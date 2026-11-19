import "server-only";
import type { ActorType, Prisma } from "@/generated/prisma/client";
import { db } from "./db";

export type AuditAction =
  | "file.created"
  | "file.started"
  | "file.recovered"
  | "file.recovery_failed"
  | "answers.updated"
  | "file.submitted"
  | "file.status_changed"
  | "file.corrections_requested"
  | "file.reopened"
  | "file.extended"
  | "file.expired"
  | "file.reviewed"
  | "message.sent"
  | "note.added"
  | "pdf.client_downloaded"
  | "pdf.admin_downloaded"
  | "consent.accepted"
  | "admin.login"
  | "admin.login_failed"
  | "admin.account_updated"
  | "admin.password_changed"
  | "admin.created"
  | "admin.status_changed"
  | "admin.role_changed"
  | "settings.updated"
  | "template.updated";

export const AUDIT_LABELS: Record<string, string> = {
  "file.created": "Expediente creado",
  "file.started": "Inicio del formulario",
  "file.recovered": "Acceso / recuperación",
  "file.recovery_failed": "Intento de recuperación fallido",
  "answers.updated": "Respuestas actualizadas",
  "file.submitted": "Formulario enviado",
  "file.status_changed": "Cambio de estado",
  "file.corrections_requested": "Correcciones solicitadas",
  "file.reopened": "Expediente reabierto",
  "file.extended": "Vigencia extendida",
  "file.expired": "Expediente vencido",
  "file.reviewed": "Revisión finalizada",
  "message.sent": "Mensaje enviado",
  "note.added": "Nota interna agregada",
  "pdf.client_downloaded": "PDF descargado (cliente)",
  "pdf.admin_downloaded": "PDF descargado (asesor)",
  "consent.accepted": "Aceptación de política",
  "admin.login": "Inicio de sesión del asesor",
  "admin.login_failed": "Inicio de sesión fallido",
  "admin.account_updated": "Cuenta del asesor actualizada",
  "admin.password_changed": "Contraseña del asesor cambiada",
  "admin.created": "Asesor creado",
  "admin.status_changed": "Usuario activado / desactivado",
  "admin.role_changed": "Rol de usuario cambiado",
  "settings.updated": "Configuración actualizada",
  "template.updated": "Formulario modificado",
};

type LogInput = {
  action: AuditAction;
  actorType: ActorType;
  actorId?: string | null;
  fileId?: string | null;
  details?: Prisma.InputJsonValue;
  ipHash?: string | null;
};

export async function audit(input: LogInput, tx: Prisma.TransactionClient = db) {
  await tx.auditLog.create({
    data: {
      action: input.action,
      actorType: input.actorType,
      actorId: input.actorId ?? null,
      applicationFileId: input.fileId ?? null,
      details: input.details,
      ipHash: input.ipHash ?? null,
    },
  });
}

/**
 * Registra cambios de respuestas agrupándolos: si hay un registro reciente (10 min) para la
 * misma sección, se actualiza en vez de crear uno nuevo. Solo se guardan las claves, nunca valores.
 */
export async function auditAnswerChange(fileId: string, sectionKey: string, keys: string[]) {
  const since = new Date(Date.now() - 10 * 60 * 1000);
  const recent = await db.auditLog.findFirst({
    where: { applicationFileId: fileId, action: "answers.updated", updatedAt: { gte: since } },
    orderBy: { updatedAt: "desc" },
  });
  const prev = (recent?.details ?? {}) as { section?: string; keys?: string[]; saves?: number };
  if (recent && prev.section === sectionKey) {
    const merged = Array.from(new Set([...(prev.keys ?? []), ...keys]));
    await db.auditLog.update({
      where: { id: recent.id },
      data: { details: { section: sectionKey, keys: merged, saves: (prev.saves ?? 1) + 1 } },
    });
    return;
  }
  await audit({
    action: "answers.updated",
    actorType: "CLIENT",
    fileId,
    details: { section: sectionKey, keys, saves: 1 },
  });
}
