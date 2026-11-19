import "server-only";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import type { AdminRole } from "@/generated/prisma/enums";
import { getClientFileId } from "@/lib/client-session";
import { db } from "@/lib/db";
import { getClientFile } from "./files";

const ADMIN_SELECT = { id: true, name: true, email: true, role: true, active: true } as const;

/** Usuario del panel autenticado y activo (consulta la base en cada solicitud). */
export async function getAdmin() {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) return null;
  const admin = await db.adminUser.findUnique({ where: { id }, select: ADMIN_SELECT });
  return admin?.active ? admin : null;
}

/** Para páginas: exige sesión del panel y, opcionalmente, un rol. */
export async function requireAdmin(role?: AdminRole) {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  if (role && admin.role !== role) redirect("/admin?acceso=denegado");
  return admin;
}

/** Para acciones de servidor: lanza error si no hay sesión o no tiene el rol. */
export async function assertAdmin(role?: AdminRole) {
  const admin = await getAdmin();
  if (!admin) throw new Error("No autorizado");
  if (role && admin.role !== role) throw new Error("Solo un administrador puede realizar esta acción");
  return admin;
}

/** Expediente del cliente según su cookie de sesión. Nunca recibe IDs desde la URL. */
export async function requireClientFile() {
  const fileId = await getClientFileId();
  if (!fileId) redirect("/recuperar?sesion=expirada");
  const file = await getClientFile(fileId);
  if (!file) redirect("/recuperar?sesion=expirada");
  return file;
}
