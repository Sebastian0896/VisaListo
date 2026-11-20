"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { redirect } from "next/navigation";
import { audit } from "@/lib/audit";
import { clearClientSession, getClientFileId, setClientSession } from "@/lib/client-session";
import { db } from "@/lib/db";
import { getClientIpHash } from "@/lib/request";
import { getSettings } from "@/lib/settings";
import { computeOverallProgress, getAnswers, saveSectionAnswers, type SaveResult } from "@/server/answers";
import {
  clientCanEdit,
  createApplicationFile,
  getClientFile,
  getRecoveryQuestion,
  isRateLimited,
  RATE_LIMIT_ERROR,
  recordAttempt,
  recoverApplicationFile,
} from "@/server/files";
import { findAdvisorByCode } from "@/server/advisors";
import { loadFormVersion } from "@/server/form";
import { notifyAdvisors } from "@/server/notifications";
import { createFileSchema, messageSchema, recoverSchema, type CreateFileInput, type RecoverInput } from "@/validation/answers";

type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string };

export async function createFileAction(input: CreateFileInput): Promise<Result<{ code: string; question: string; advisorName: string | null }>> {
  const parsed = createFileSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos no válidos" };
  const ipHash = await getClientIpHash();
  const res = await createApplicationFile({ ...parsed.data, ipHash });
  if (!res.ok) return res;
  await setClientSession(res.fileId);
  if (res.advisorName) {
    const fileId = res.fileId;
    after(() => notifyAdvisors(fileId, "linked"));
  }
  return { ok: true, code: res.code, question: res.question, advisorName: res.advisorName };
}

export async function lookupQuestionAction(code: string): Promise<Result<{ question: string }>> {
  const ipHash = await getClientIpHash();
  if (await isRateLimited("lookup", ipHash, 30, 15 * 60 * 1000, false)) return { ok: false, error: RATE_LIMIT_ERROR };
  await recordAttempt("lookup", ipHash, true);
  if (typeof code !== "string" || code.trim().length < 10) return { ok: false, error: "Escriba su código de expediente completo." };
  const question = await getRecoveryQuestion(code);
  if (!question) return { ok: false, error: "Servicio no disponible." };
  return { ok: true, question };
}

export async function recoverAction(input: RecoverInput): Promise<Result> {
  const parsed = recoverSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos no válidos" };
  const ipHash = await getClientIpHash();
  const res = await recoverApplicationFile({ ...parsed.data, ipHash });
  if (!res.ok) return res;
  await setClientSession(res.fileId);
  return { ok: true };
}

export async function logoutClientAction() {
  await clearClientSession();
  redirect("/");
}

async function currentFileId() {
  const id = await getClientFileId();
  if (!id) throw new Error("Sesión expirada");
  return id;
}

export async function saveAnswersAction(sectionKey: string, values: Record<string, unknown>): Promise<SaveResult> {
  const fileId = await getClientFileId();
  if (!fileId) return { ok: false, error: "Su sesión expiró. Vuelva a ingresar con su código.", locked: true };
  if (typeof sectionKey !== "string" || typeof values !== "object" || values === null) return { ok: false, error: "Datos no válidos" };
  return saveSectionAnswers(fileId, sectionKey, values);
}

export async function submitFileAction(input: { message?: string; declaration: boolean }): Promise<Result> {
  const fileId = await currentFileId();
  if (input.declaration !== true) return { ok: false, error: "Debe confirmar la declaración para enviar." };
  const message = (input.message ?? "").trim().slice(0, 2000);

  const file = await getClientFile(fileId);
  if (!file) return { ok: false, error: "Sesión no válida." };
  if (!clientCanEdit(file) || file.status === "PENDING_START") {
    return { ok: false, error: "Este formulario no se puede enviar en su estado actual." };
  }
  const sections = await loadFormVersion(file.templateVersionId);
  const progress = computeOverallProgress(sections, await getAnswers(fileId));
  if (progress.percent < 100) {
    return { ok: false, error: "Aún hay preguntas obligatorias sin responder. Revise las secciones marcadas como pendientes." };
  }
  const passport = await db.document.findFirst({ where: { applicationFileId: fileId, kind: "PASSPORT", deletedAt: null }, select: { id: true } });
  if (!passport) {
    return { ok: false, error: "Suba la foto de su pasaporte en la sección «Pasaporte» antes de enviar." };
  }
  const settings = await getSettings();
  const ipHash = await getClientIpHash();
  const from = file.status;

  await db.$transaction(async (tx) => {
    await tx.applicationFile.update({
      where: { id: fileId },
      data: { status: "SUBMITTED", submittedAt: new Date(), lastActivityAt: new Date(), correctionRequest: null },
    });
    await tx.consentRecord.create({ data: { applicationFileId: fileId, kind: "submission_declaration", version: settings.privacyVersion, ipHash } });
    if (message) {
      await tx.message.create({ data: { applicationFileId: fileId, senderType: "CLIENT", message, isSubmissionNote: true } });
    }
    await audit({ action: "file.submitted", actorType: "CLIENT", fileId, ipHash, details: { from, withMessage: !!message } }, tx);
  });
  after(() => notifyAdvisors(fileId, "submitted"));
  revalidatePath("/portal");
  return { ok: true };
}

export async function sendClientMessageAction(input: { message: string }): Promise<Result> {
  const fileId = await currentFileId();
  const parsed = messageSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Mensaje no válido" };
  const ipHash = await getClientIpHash();
  // Límite simple anti-abuso: 20 mensajes por hora
  const recent = await db.message.count({
    where: { applicationFileId: fileId, senderType: "CLIENT", createdAt: { gte: new Date(Date.now() - 3600_000) } },
  });
  if (recent >= 20) return { ok: false, error: "Ha enviado muchos mensajes. Espere un momento antes de enviar otro." };
  const pendingBefore = await db.message.count({ where: { applicationFileId: fileId, senderType: "CLIENT", readAt: null } });
  await db.message.create({ data: { applicationFileId: fileId, senderType: "CLIENT", message: parsed.data.message } });
  if (pendingBefore === 0) after(() => notifyAdvisors(fileId, "message"));
  await db.applicationFile.update({ where: { id: fileId }, data: { lastActivityAt: new Date() } });
  await audit({ action: "message.sent", actorType: "CLIENT", fileId, ipHash });
  revalidatePath("/portal/mensajes");
  return { ok: true };
}

export async function markAdvisorMessagesReadAction() {
  const fileId = await getClientFileId();
  if (!fileId) return;
  await db.message.updateMany({ where: { applicationFileId: fileId, senderType: "ADMIN", readAt: null }, data: { readAt: new Date() } });
}

/** Vincula el expediente del cliente a un asesor mediante su código (solo si aún no tiene uno). */
export async function linkAdvisorAction(input: { code: string }): Promise<Result<{ advisorName: string }>> {
  const fileId = await getClientFileId();
  if (!fileId) return { ok: false, error: "Su sesión expiró. Vuelva a ingresar con su código." };
  const ipHash = await getClientIpHash();
  if (await isRateLimited("advisor_link", ipHash, 10, 15 * 60 * 1000)) return { ok: false, error: RATE_LIMIT_ERROR };
  if (typeof input?.code !== "string" || !input.code.trim()) return { ok: false, error: "Escriba el código de su asesor." };

  const file = await db.applicationFile.findUnique({ where: { id: fileId }, select: { advisorId: true } });
  if (!file) return { ok: false, error: "Sesión no válida." };
  if (file.advisorId) return { ok: false, error: "Su expediente ya tiene un asesor asignado. Para cambiarlo, comuníquese con la oficina." };

  const advisor = await findAdvisorByCode(input.code);
  if (!advisor) {
    await recordAttempt("advisor_link", ipHash, false);
    return { ok: false, error: "El código de asesor no es válido. Revíselo e inténtelo de nuevo." };
  }
  // updateMany con advisorId null evita sobrescribir si dos pestañas lo intentan a la vez
  const res = await db.applicationFile.updateMany({ where: { id: fileId, advisorId: null }, data: { advisorId: advisor.id } });
  if (!res.count) return { ok: false, error: "Su expediente ya tiene un asesor asignado." };
  await audit({ action: "file.assigned", actorType: "CLIENT", fileId, ipHash, details: { advisorId: advisor.id, via: "portal" } });
  revalidatePath("/portal", "layout");
  after(() => notifyAdvisors(fileId, "linked"));
  return { ok: true, advisorName: advisor.name };
}
