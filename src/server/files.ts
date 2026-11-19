import "server-only";
import { createHmac } from "node:crypto";
import type { ApplicationFile, FileStatus } from "@/generated/prisma/client";
import { audit } from "@/lib/audit";
import { generateUniqueCode } from "@/lib/code";
import { db } from "@/lib/db";
import { burnHashTime, hashSecurityAnswer, verifySecurityAnswer } from "@/lib/hash";
import { normalizeCode, normalizeText } from "@/lib/normalize";
import { getSettings } from "@/lib/settings";
import { CLIENT_EDITABLE, EXPIRABLE } from "@/lib/status";
import { findAdvisorByCode } from "./advisors";
import { getPublishedVersion } from "./form";

// ───────────── Límites contra intentos automatizados ─────────────
const IP_WINDOW_MS = 15 * 60 * 1000;
const IP_MAX_FAILURES = 10; // por IP en 15 minutos
const FILE_MAX_FAILURES = 5; // por expediente antes de bloqueo
const FILE_LOCK_MS = 30 * 60 * 1000;
const CREATE_MAX_PER_HOUR = 10; // expedientes nuevos por IP/hora

export const GENERIC_RECOVERY_ERROR =
  "No pudimos verificar sus datos. Revise la información e inténtelo de nuevo. Si el problema continúa, comuníquese con su asesor.";
export const RATE_LIMIT_ERROR = "Demasiados intentos. Por seguridad, espere unos minutos antes de volver a intentarlo.";

export async function isRateLimited(kind: string, ipHash: string, max: number, windowMs: number, onlyFailures = true) {
  const count = await db.recoveryAttempt.count({
    where: {
      kind,
      ipHash,
      createdAt: { gte: new Date(Date.now() - windowMs) },
      ...(onlyFailures ? { success: false } : {}),
    },
  });
  return count >= max;
}

export async function recordAttempt(kind: string, ipHash: string, success: boolean) {
  await db.recoveryAttempt.create({ data: { kind, ipHash, success } });
}

// ───────────── Creación ─────────────

export async function createApplicationFile(input: {
  surname: string;
  birthYear: number;
  securityQuestionId: string;
  securityAnswer: string;
  /** Código del asesor que escribió el cliente (opcional) */
  advisorCode?: string;
  ipHash: string;
}) {
  if (await isRateLimited("create", input.ipHash, CREATE_MAX_PER_HOUR, 60 * 60 * 1000, false)) {
    return { ok: false as const, error: RATE_LIMIT_ERROR };
  }
  const [version, question, settings] = await Promise.all([
    getPublishedVersion(),
    db.securityQuestion.findFirst({ where: { id: input.securityQuestionId, active: true } }),
    getSettings(),
  ]);
  if (!version) return { ok: false as const, error: "El formulario no está disponible en este momento." };
  if (!question) return { ok: false as const, error: "Seleccione una pregunta de seguridad válida." };

  // Código de asesor: si se escribió, debe existir y estar activo (no se ignora en silencio)
  let advisorId: string | null = null;
  let advisorName: string | null = null;
  if (input.advisorCode && input.advisorCode.trim()) {
    const advisor = await findAdvisorByCode(input.advisorCode);
    if (!advisor) return { ok: false as const, error: "El código de asesor no es válido. Revíselo o déjelo vacío." };
    advisorId = advisor.id;
    advisorName = advisor.name;
  }

  const securityAnswerHash = await hashSecurityAnswer(input.securityAnswer);
  const surname = input.surname.trim().replace(/\s+/g, " ");

  // Reintenta en el improbable caso de colisión del código
  for (let attempt = 0; attempt < 5; attempt++) {
    const uniqueCode = generateUniqueCode();
    try {
      const file = await db.$transaction(async (tx) => {
        const applicant = await tx.applicant.create({
          data: { verifySurname: normalizeText(surname), birthYear: input.birthYear, firstSurname: surname.toUpperCase() },
        });
        const file = await tx.applicationFile.create({
          data: {
            uniqueCode,
            applicantId: applicant.id,
            templateVersionId: version.id,
            securityQuestionId: question.id,
            securityAnswerHash,
            advisorId,
          },
        });
        await tx.consentRecord.create({
          data: { applicationFileId: file.id, kind: "privacy", version: settings.privacyVersion, ipHash: input.ipHash },
        });
        await audit({ action: "file.created", actorType: "CLIENT", fileId: file.id, ipHash: input.ipHash, details: { withAdvisor: !!advisorId } }, tx);
        if (advisorId) await audit({ action: "file.assigned", actorType: "CLIENT", fileId: file.id, details: { advisorId, via: "code" } }, tx);
        await audit({ action: "consent.accepted", actorType: "CLIENT", fileId: file.id, details: { kind: "privacy", version: settings.privacyVersion } }, tx);
        return file;
      });
      await recordAttempt("create", input.ipHash, true);
      return { ok: true as const, fileId: file.id, code: file.uniqueCode, question: question.text, advisorName };
    } catch (e) {
      if ((e as { code?: string }).code === "P2002") continue;
      throw e;
    }
  }
  return { ok: false as const, error: "No se pudo crear el expediente. Inténtelo de nuevo." };
}

// ───────────── Recuperación ─────────────

/**
 * Devuelve la pregunta de seguridad para un código. Si el código no existe, devuelve una pregunta
 * determinística (derivada del código) para no revelar si el expediente existe.
 */
export async function getRecoveryQuestion(rawCode: string) {
  const code = normalizeCode(rawCode);
  const file = await db.applicationFile.findUnique({ where: { uniqueCode: code }, include: { securityQuestion: true } });
  if (file) return file.securityQuestion.text;
  const questions = await db.securityQuestion.findMany({ where: { active: true }, orderBy: { order: "asc" } });
  if (!questions.length) return null;
  const h = createHmac("sha256", process.env.IP_HASH_SECRET ?? "x").update(code).digest();
  return questions[h.readUInt32BE(0) % questions.length].text;
}

export async function recoverApplicationFile(input: {
  code: string;
  surname: string;
  birthYear: number;
  securityAnswer: string;
  ipHash: string;
}) {
  if (await isRateLimited("recovery", input.ipHash, IP_MAX_FAILURES, IP_WINDOW_MS)) {
    return { ok: false as const, error: RATE_LIMIT_ERROR };
  }
  const code = normalizeCode(input.code);
  const file = await db.applicationFile.findUnique({ where: { uniqueCode: code }, include: { applicant: true } });

  if (!file) {
    await burnHashTime(input.securityAnswer);
    await recordAttempt("recovery", input.ipHash, false);
    return { ok: false as const, error: GENERIC_RECOVERY_ERROR };
  }

  if (file.lockedUntil && file.lockedUntil > new Date()) {
    await burnHashTime(input.securityAnswer);
    await recordAttempt("recovery", input.ipHash, false);
    return { ok: false as const, error: RATE_LIMIT_ERROR };
  }

  const answerOk = await verifySecurityAnswer(file.securityAnswerHash, input.securityAnswer);
  const surnameOk = normalizeText(input.surname) === file.applicant.verifySurname;
  const yearOk = input.birthYear === file.applicant.birthYear;

  if (!(answerOk && surnameOk && yearOk)) {
    const failed = file.failedAttempts + 1;
    await db.applicationFile.update({
      where: { id: file.id },
      data: {
        failedAttempts: failed >= FILE_MAX_FAILURES ? 0 : failed,
        lockedUntil: failed >= FILE_MAX_FAILURES ? new Date(Date.now() + FILE_LOCK_MS) : file.lockedUntil,
      },
    });
    await recordAttempt("recovery", input.ipHash, false);
    await audit({ action: "file.recovery_failed", actorType: "CLIENT", fileId: file.id, ipHash: input.ipHash, details: { locked: failed >= FILE_MAX_FAILURES } });
    return { ok: false as const, error: GENERIC_RECOVERY_ERROR };
  }

  await db.applicationFile.update({ where: { id: file.id }, data: { failedAttempts: 0, lockedUntil: null, lastActivityAt: new Date() } });
  await recordAttempt("recovery", input.ipHash, true);
  await audit({ action: "file.recovered", actorType: "CLIENT", fileId: file.id, ipHash: input.ipHash });
  return { ok: true as const, fileId: file.id };
}

// ───────────── Vigencia ─────────────

/** Si el expediente superó su vencimiento sin enviarse, lo marca como Vencido. */
export async function applyExpiry<T extends Pick<ApplicationFile, "id" | "status" | "expiresAt">>(file: T): Promise<T> {
  if (EXPIRABLE.includes(file.status) && file.expiresAt && file.expiresAt <= new Date()) {
    const res = await db.applicationFile.updateMany({
      where: { id: file.id, status: file.status },
      data: { status: "EXPIRED" },
    });
    if (res.count) {
      await audit({ action: "file.expired", actorType: "SYSTEM", fileId: file.id, details: { from: file.status } });
    }
    return { ...file, status: "EXPIRED" as FileStatus };
  }
  return file;
}

/** Barrido general (se ejecuta al cargar el panel administrativo). */
export async function sweepExpired() {
  const due = await db.applicationFile.findMany({
    where: { status: { in: EXPIRABLE }, expiresAt: { lte: new Date() } },
    select: { id: true, status: true, expiresAt: true },
  });
  for (const f of due) await applyExpiry(f);
  return due.length;
}

export function clientCanEdit(file: Pick<ApplicationFile, "status" | "expiresAt">) {
  if (!CLIENT_EDITABLE.includes(file.status)) return false;
  if (file.expiresAt && file.expiresAt <= new Date()) return false;
  return true;
}

/** Expediente del cliente autenticado (con vencimiento aplicado). */
export async function getClientFile(fileId: string) {
  const file = await db.applicationFile.findUnique({
    where: { id: fileId },
    include: { applicant: true, securityQuestion: true, advisor: { select: { name: true, whatsappNumber: true, active: true } } },
  });
  if (!file) return null;
  return applyExpiry(file);
}

export function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}
