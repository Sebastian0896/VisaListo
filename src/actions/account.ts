"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { db } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/hash";
import { getAdmin } from "@/server/guards";

type Result = { ok: true } | { ok: false; error: string };

const passwordSchema = z
  .string()
  .min(10, "La contraseña debe tener al menos 10 caracteres")
  .max(200)
  .refine((p) => /[a-zA-Z]/.test(p) && /\d/.test(p), "Use letras y al menos un número");

// ───────────── Mi cuenta ─────────────

const accountSchema = z.object({
  name: z.string().trim().min(2, "Escriba su nombre").max(80),
  email: z.string().trim().toLowerCase().email("Correo no válido").max(200),
  currentPassword: z.string().min(1, "Escriba su contraseña actual").max(200),
  newPassword: z.string().max(200),
  confirmPassword: z.string().max(200),
});
export type AccountInput = z.input<typeof accountSchema>;

/** Actualiza nombre, correo y (opcionalmente) contraseña. Siempre exige la contraseña actual. */
export async function updateAccountAction(input: AccountInput): Promise<Result> {
  const me = await getAdmin();
  if (!me) return { ok: false, error: "Sesión expirada. Vuelva a iniciar sesión." };
  const parsed = accountSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos no válidos" };
  const d = parsed.data;

  const user = await db.adminUser.findUnique({ where: { id: me.id } });
  if (!user || !(await verifyPassword(user.passwordHash, d.currentPassword))) {
    return { ok: false, error: "La contraseña actual no es correcta." };
  }

  const changingPassword = d.newPassword.length > 0;
  if (changingPassword) {
    const p = passwordSchema.safeParse(d.newPassword);
    if (!p.success) return { ok: false, error: p.error.issues[0].message };
    if (d.newPassword !== d.confirmPassword) return { ok: false, error: "La confirmación no coincide con la nueva contraseña." };
    if (d.newPassword === d.currentPassword) return { ok: false, error: "La nueva contraseña debe ser distinta de la actual." };
  }

  if (d.email !== user.email && (await db.adminUser.findUnique({ where: { email: d.email } }))) {
    return { ok: false, error: "Ya existe otro asesor con ese correo." };
  }

  await db.adminUser.update({
    where: { id: me.id },
    data: {
      name: d.name,
      email: d.email,
      ...(changingPassword ? { passwordHash: await hashPassword(d.newPassword) } : {}),
    },
  });
  const changed = [d.name !== user.name && "nombre", d.email !== user.email && "correo"].filter(Boolean);
  if (changed.length) await audit({ action: "admin.account_updated", actorType: "ADMIN", actorId: me.id, details: { fields: changed } });
  if (changingPassword) await audit({ action: "admin.password_changed", actorType: "ADMIN", actorId: me.id });
  revalidatePath("/admin", "layout");
  return { ok: true };
}

// ───────────── Asesores ─────────────

const newAdminSchema = z.object({
  name: z.string().trim().min(2, "Escriba el nombre").max(80),
  email: z.string().trim().toLowerCase().email("Correo no válido").max(200),
  password: passwordSchema,
});
export type NewAdminInput = z.input<typeof newAdminSchema>;

export async function createAdminAction(input: NewAdminInput): Promise<Result> {
  const me = await getAdmin();
  if (!me) return { ok: false, error: "Sesión expirada. Vuelva a iniciar sesión." };
  const parsed = newAdminSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos no válidos" };
  const d = parsed.data;
  if (await db.adminUser.findUnique({ where: { email: d.email } })) return { ok: false, error: "Ya existe un asesor con ese correo." };
  const created = await db.adminUser.create({ data: { name: d.name, email: d.email, passwordHash: await hashPassword(d.password) } });
  await audit({ action: "admin.created", actorType: "ADMIN", actorId: me.id, details: { adminId: created.id } });
  revalidatePath("/admin/configuracion");
  return { ok: true };
}

export async function setAdminActiveAction(adminId: string, active: boolean): Promise<Result> {
  const me = await getAdmin();
  if (!me) return { ok: false, error: "Sesión expirada. Vuelva a iniciar sesión." };
  if (adminId === me.id) return { ok: false, error: "No puede desactivar su propia cuenta." };
  if (!active) {
    const others = await db.adminUser.count({ where: { active: true, id: { not: adminId } } });
    if (others === 0) return { ok: false, error: "Debe quedar al menos un asesor activo." };
  }
  await db.adminUser.update({ where: { id: adminId }, data: { active } });
  await audit({ action: "admin.status_changed", actorType: "ADMIN", actorId: me.id, details: { adminId, active } });
  revalidatePath("/admin/configuracion");
  return { ok: true };
}
