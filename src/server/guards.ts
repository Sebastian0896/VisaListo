import "server-only";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getClientFileId } from "@/lib/client-session";
import { db } from "@/lib/db";
import { getClientFile } from "./files";

/** Verifica en el servidor que hay un asesor autenticado y activo. */
export async function requireAdmin() {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) redirect("/admin/login");
  const admin = await db.adminUser.findUnique({ where: { id }, select: { id: true, name: true, email: true, active: true } });
  if (!admin?.active) redirect("/admin/login");
  return admin;
}

/** Variante para acciones/rutas: devuelve null en vez de redirigir. */
export async function getAdmin() {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) return null;
  const admin = await db.adminUser.findUnique({ where: { id }, select: { id: true, name: true, email: true, active: true } });
  return admin?.active ? admin : null;
}

/** Expediente del cliente según su cookie de sesión. Nunca recibe IDs desde la URL. */
export async function requireClientFile() {
  const fileId = await getClientFileId();
  if (!fileId) redirect("/recuperar?sesion=expirada");
  const file = await getClientFile(fileId);
  if (!file) redirect("/recuperar?sesion=expirada");
  return file;
}
