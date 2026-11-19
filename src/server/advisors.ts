import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import type { AdminRole } from "@/generated/prisma/enums";
import { generateAdvisorCode } from "@/lib/code";
import { db } from "@/lib/db";
import { normalizeAdvisorCode } from "@/lib/normalize";

type PanelUser = { id: string; role: AdminRole };

/** Usuario activo del panel al que pertenece un código de asesor. */
export async function findAdvisorByCode(raw: string) {
  const code = normalizeAdvisorCode(raw);
  if (code.length < 4) return null;
  const user = await db.adminUser.findUnique({ where: { advisorCode: code }, select: { id: true, name: true, active: true } });
  return user?.active ? user : null;
}

/** Genera un código de asesor que no esté en uso. */
export async function uniqueAdvisorCode(tx: Prisma.TransactionClient = db) {
  for (let i = 0; i < 10; i++) {
    const code = generateAdvisorCode();
    if (!(await tx.adminUser.findUnique({ where: { advisorCode: code }, select: { id: true } }))) return code;
  }
  throw new Error("No se pudo generar un código de asesor único");
}

/**
 * Filtro de expedientes visibles para un usuario del panel:
 * el Administrador ve todos; el Asesor solo los asignados a él.
 */
export function fileScope(user: PanelUser): Prisma.ApplicationFileWhereInput {
  return user.role === "ADMIN" ? {} : { advisorId: user.id };
}

/** ¿Puede este usuario ver/gestionar el expediente? (se valida siempre en el servidor) */
export async function canAccessFile(user: PanelUser, fileId: string) {
  if (user.role === "ADMIN") return !!(await db.applicationFile.findUnique({ where: { id: fileId }, select: { id: true } }));
  return !!(await db.applicationFile.findFirst({ where: { id: fileId, advisorId: user.id }, select: { id: true } }));
}
