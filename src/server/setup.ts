import "server-only";
import { db } from "@/lib/db";

/**
 * La configuración inicial (crear el primer Administrador) solo está disponible mientras no exista
 * ningún Administrador. En producción exige el código ADMIN_SETUP_TOKEN definido en el servidor.
 */
export async function setupStatus() {
  const admins = await db.adminUser.count({ where: { role: "ADMIN" } });
  const tokenRequired = process.env.NODE_ENV === "production" || !!process.env.ADMIN_SETUP_TOKEN;
  const tokenConfigured = !!process.env.ADMIN_SETUP_TOKEN;
  return { needsSetup: admins === 0, tokenRequired, tokenConfigured };
}
