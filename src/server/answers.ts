import "server-only";
import { auditAnswerChange, audit } from "@/lib/audit";
import { decryptJson, encryptJson } from "@/lib/crypto";
import { db } from "@/lib/db";
import { computeSectionProgress, type AnswerMap, type AnswerValue, type ClientSection } from "@/lib/form-types";
import { getSettings } from "@/lib/settings";
import { validateAnswer } from "@/validation/answers";
import { addDays, clientCanEdit, getClientFile } from "./files";
import { loadFormVersion } from "./form";

/** Respuestas descifradas del expediente, indexadas por clave de pregunta. */
export async function getAnswers(fileId: string): Promise<AnswerMap> {
  const rows = await db.applicationAnswer.findMany({
    where: { applicationFileId: fileId },
    include: { question: { select: { key: true } } },
  });
  const map: AnswerMap = {};
  for (const r of rows) {
    const v = decryptJson<AnswerValue>(r.valueEnc);
    if (v !== null) map[r.question.key] = v;
  }
  return map;
}

export function computeOverallProgress(sections: ClientSection[], answers: AnswerMap) {
  let total = 0;
  let done = 0;
  const perSection = sections.map((s) => {
    const p = computeSectionProgress(s, answers);
    total += p.totalRequired;
    done += p.answeredRequired;
    return { key: s.key, title: s.title, order: s.order, ...p };
  });
  return { percent: total ? Math.round((done / total) * 100) : 0, perSection, total, done };
}

export type SaveResult =
  | { ok: true; savedAt: string; percent: number; startedNow: boolean; expiresAt: string | null }
  | { ok: false; error: string; fieldErrors?: Record<string, string>; locked?: boolean };

/**
 * Guarda de forma incremental las respuestas de una sección.
 * - Solo acepta claves que pertenecen a la sección indicada.
 * - Valida el formato en el servidor.
 * - En la primera respuesta guardada fija startedAt y calcula expiresAt (no se modifican después).
 */
export async function saveSectionAnswers(fileId: string, sectionKey: string, values: Record<string, unknown>): Promise<SaveResult> {
  const file = await getClientFile(fileId);
  if (!file) return { ok: false, error: "Sesión no válida." };
  if (!clientCanEdit(file)) {
    return { ok: false, locked: true, error: "Su formulario no se puede editar en este momento." };
  }

  const sections = await loadFormVersion(file.templateVersionId);
  const section = sections.find((s) => s.key === sectionKey);
  if (!section) return { ok: false, error: "Sección no encontrada." };
  const byKey = new Map(section.questions.map((q) => [q.key, q] as const));

  const fieldErrors: Record<string, string> = {};
  const toUpsert: { questionId: string; value: AnswerValue }[] = [];
  const toDelete: string[] = [];
  const changedKeys: string[] = [];

  for (const [key, raw] of Object.entries(values)) {
    const q = byKey.get(key);
    if (!q) continue; // se ignoran claves ajenas a la sección
    const value = (q.type === "GROUP" ? (Array.isArray(raw) ? raw : []) : typeof raw === "string" ? raw : "") as AnswerValue;
    const err = validateAnswer(q, value);
    if (err) {
      fieldErrors[key] = err;
      continue;
    }
    changedKeys.push(key);
    const empty = Array.isArray(value) ? value.length === 0 : value.trim() === "";
    if (empty) toDelete.push(q.id);
    else toUpsert.push({ questionId: q.id, value: Array.isArray(value) ? value : value.trim() });
  }

  const now = new Date();
  const startedNow = !file.startedAt && toUpsert.length > 0;
  const settings = startedNow ? await getSettings() : null;

  await db.$transaction(async (tx) => {
    for (const a of toUpsert) {
      const valueEnc = encryptJson(a.value);
      await tx.applicationAnswer.upsert({
        where: { applicationFileId_questionId: { applicationFileId: fileId, questionId: a.questionId } },
        create: { applicationFileId: fileId, questionId: a.questionId, valueEnc },
        update: { valueEnc },
      });
    }
    if (toDelete.length) {
      await tx.applicationAnswer.deleteMany({ where: { applicationFileId: fileId, questionId: { in: toDelete } } });
    }
    if (startedNow && settings) {
      // Solo se fija si sigue vacío (evita condiciones de carrera entre pestañas)
      const res = await tx.applicationFile.updateMany({
        where: { id: fileId, startedAt: null },
        data: {
          startedAt: now,
          expiresAt: addDays(now, settings.validityDays),
          validityDays: settings.validityDays,
          status: "IN_PROGRESS",
        },
      });
      if (res.count) await audit({ action: "file.started", actorType: "CLIENT", fileId, details: { validityDays: settings.validityDays } }, tx);
    }
  });

  // Progreso por sección y general
  const answers = await getAnswers(fileId);
  const overall = computeOverallProgress(sections, answers);
  const sp = overall.perSection.find((p) => p.key === sectionKey)!;
  await db.applicationSection.upsert({
    where: { applicationFileId_sectionId: { applicationFileId: fileId, sectionId: section.id } },
    create: { applicationFileId: fileId, sectionId: section.id, answeredRequired: sp.answeredRequired, totalRequired: sp.totalRequired, answeredCount: sp.answeredCount, completed: sp.completed },
    update: { answeredRequired: sp.answeredRequired, totalRequired: sp.totalRequired, answeredCount: sp.answeredCount, completed: sp.completed },
  });

  // Sincroniza el nombre de visualización del solicitante (el primer apellido de verificación no cambia)
  const applicantData: { givenNames?: string | null } = {};
  if (sectionKey === "personal") {
    applicantData.givenNames = typeof answers.given_names === "string" ? answers.given_names.trim().toUpperCase() || null : null;
  }

  const updated = await db.applicationFile.update({
    where: { id: fileId },
    data: {
      lastActivityAt: now,
      progressPercent: overall.percent,
      applicant: Object.keys(applicantData).length ? { update: applicantData } : undefined,
    },
  });

  if (changedKeys.length) await auditAnswerChange(fileId, sectionKey, changedKeys);

  if (Object.keys(fieldErrors).length) {
    return { ok: false, error: "Algunos campos tienen errores de formato.", fieldErrors };
  }
  return { ok: true, savedAt: now.toISOString(), percent: overall.percent, startedNow, expiresAt: updated.expiresAt?.toISOString() ?? null };
}

/** Lista de preguntas obligatorias pendientes (visibles) por sección. */
export function pendingRequired(sections: ClientSection[], answers: AnswerMap) {
  return computeOverallProgress(sections, answers).perSection.filter((s) => !s.completed);
}
