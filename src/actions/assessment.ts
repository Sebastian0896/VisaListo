"use server";

import { revalidatePath } from "next/cache";
import { validateAssessment, type AssessmentResult } from "@/lib/assessment";
import { audit } from "@/lib/audit";
import { getClientFileId } from "@/lib/client-session";
import { db } from "@/lib/db";
import { saveAssessment } from "@/server/assessment";

/** Guarda la autoevaluación del cliente autenticado (el resultado se calcula en el servidor). */
export async function saveAssessmentAction(answers: unknown): Promise<{ ok: true; result: AssessmentResult } | { ok: false; error: string }> {
  const fileId = await getClientFileId();
  if (!fileId) return { ok: false, error: "Su sesión expiró. Vuelva a ingresar con su código." };
  if (!validateAssessment(answers)) return { ok: false, error: "Responda todas las preguntas." };
  // Límite simple: 10 autoevaluaciones por día por expediente
  const today = await db.profileAssessment.count({ where: { applicationFileId: fileId, createdAt: { gte: new Date(Date.now() - 86400_000) } } });
  if (today >= 10) return { ok: false, error: "Ya realizó varias autoevaluaciones hoy. Inténtelo mañana." };
  const { result } = await saveAssessment(fileId, answers);
  await audit({ action: "assessment.completed", actorType: "CLIENT", fileId, details: { level: result.level, flags: result.flags.length } });
  revalidatePath("/portal/autoevaluacion");
  return { ok: true, result };
}
