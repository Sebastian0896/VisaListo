"use server";

import { timingSafeEqual } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { signIn } from "@/auth";
import type { AdminRole } from "@/generated/prisma/enums";
import { audit } from "@/lib/audit";
import { db } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/hash";
import { getClientIpHash } from "@/lib/request";
import { assertAdmin } from "@/server/guards";
import { isRateLimited, RATE_LIMIT_ERROR, recordAttempt } from "@/server/files";
import { setupStatus } from "@/server/setup";
import { uniqueAdvisorCode } from "@/server/advisors";

type Result = { ok: true } | { ok: false; error: string };

const passwordSchema = z
  .string()
  .min(10, "La contraseña debe tener al menos 10 caracteres")
  .max(200)
  .refine((p) => /[a-zA-Z]/.test(p) && /\d/.test(p), "Use letras y al menos un número");

const roleSchema = z.enum(["ADMIN", "ADVISOR"]);

async function guard(role?: AdminRole) {
  try {
    return await assertAdmin(role);
  } catch (e) {
    return { error: (e as Error).message } as const;
  }
}

// ───────────── Mi cuenta (todos los roles) ─────────────

const accountSchema = z.object({
  name: z.string().trim().min(2, "Escriba su nombre").max(80),
  email: z.string().trim().toLowerCase().email("Correo no válido").max(200),
  currentPassword: z.string().min(1, "Escriba su contraseña actual").max(200),
  newPassword: z.string().max(200),
  confirmPassword: z.string().max(200),
  whatsappNumber: z.string().trim().regex(/^\+?[\d\s-]{0,20}$/, "Número de WhatsApp no válido").max(20),
  contactHours: z.string().trim().max(120, "Máximo 120 caracteres"),
});
export type AccountInput = z.input<typeof accountSchema>;

/** Actualiza nombre, correo y (opcionalmente) contraseña. Siempre exige la contraseña actual. */
export async function updateAccountAction(input: AccountInput): Promise<Result> {
  const me = await guard();
  if ("error" in me) return { ok: false, error: me.error };
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
    return { ok: false, error: "Ya existe otro usuario con ese correo." };
  }

  await db.adminUser.update({
    where: { id: me.id },
    data: { name: d.name, email: d.email, whatsappNumber: d.whatsappNumber || null, contactHours: d.contactHours || null, ...(changingPassword ? { passwordHash: await hashPassword(d.newPassword) } : {}) },
  });
  const changed = [d.name !== user.name && "nombre", d.email !== user.email && "correo", (d.whatsappNumber || null) !== user.whatsappNumber && "whatsapp", (d.contactHours || null) !== user.contactHours && "horario"].filter(Boolean);
  if (changed.length) await audit({ action: "admin.account_updated", actorType: "ADMIN", actorId: me.id, details: { fields: changed } });
  if (changingPassword) await audit({ action: "admin.password_changed", actorType: "ADMIN", actorId: me.id });
  revalidatePath("/admin", "layout");
  return { ok: true };
}

// ───────────── Usuarios (solo Administrador) ─────────────

const newUserSchema = z.object({
  name: z.string().trim().min(2, "Escriba el nombre").max(80),
  email: z.string().trim().toLowerCase().email("Correo no válido").max(200),
  password: passwordSchema,
  role: roleSchema,
});
export type NewUserInput = z.input<typeof newUserSchema>;

export async function createUserAction(input: NewUserInput): Promise<Result> {
  const me = await guard("ADMIN");
  if ("error" in me) return { ok: false, error: me.error };
  const parsed = newUserSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos no válidos" };
  const d = parsed.data;
  if (await db.adminUser.findUnique({ where: { email: d.email } })) return { ok: false, error: "Ya existe un usuario con ese correo." };
  const created = await db.adminUser.create({ data: { name: d.name, email: d.email, role: d.role, advisorCode: await uniqueAdvisorCode(), passwordHash: await hashPassword(d.password) } });
  await audit({ action: "admin.created", actorType: "ADMIN", actorId: me.id, details: { adminId: created.id, role: d.role } });
  revalidatePath("/admin/usuarios");
  return { ok: true };
}

/** Debe quedar al menos un Administrador activo distinto del usuario afectado. */
async function otherActiveAdmins(excludeId: string) {
  return db.adminUser.count({ where: { role: "ADMIN", active: true, id: { not: excludeId } } });
}

export async function setUserActiveAction(userId: string, active: boolean): Promise<Result> {
  const me = await guard("ADMIN");
  if ("error" in me) return { ok: false, error: me.error };
  if (userId === me.id) return { ok: false, error: "No puede desactivar su propia cuenta." };
  const target = await db.adminUser.findUnique({ where: { id: userId } });
  if (!target) return { ok: false, error: "Usuario no encontrado." };
  if (!active && target.role === "ADMIN" && (await otherActiveAdmins(userId)) === 0) {
    return { ok: false, error: "Debe quedar al menos un administrador activo." };
  }
  await db.adminUser.update({ where: { id: userId }, data: { active } });
  await audit({ action: "admin.status_changed", actorType: "ADMIN", actorId: me.id, details: { adminId: userId, active } });
  revalidatePath("/admin/usuarios");
  return { ok: true };
}

export async function setUserRoleAction(userId: string, role: AdminRole): Promise<Result> {
  const me = await guard("ADMIN");
  if ("error" in me) return { ok: false, error: me.error };
  if (!roleSchema.safeParse(role).success) return { ok: false, error: "Rol no válido." };
  if (userId === me.id) return { ok: false, error: "No puede cambiar su propio rol." };
  const target = await db.adminUser.findUnique({ where: { id: userId } });
  if (!target) return { ok: false, error: "Usuario no encontrado." };
  if (target.role === "ADMIN" && role !== "ADMIN" && (await otherActiveAdmins(userId)) === 0) {
    return { ok: false, error: "Debe quedar al menos un administrador activo." };
  }
  await db.adminUser.update({ where: { id: userId }, data: { role } });
  await audit({ action: "admin.role_changed", actorType: "ADMIN", actorId: me.id, details: { adminId: userId, role } });
  revalidatePath("/admin/usuarios");
  return { ok: true };
}

// ───────────── Configuración inicial: primer Administrador ─────────────

function tokenMatches(given: string) {
  const expected = process.env.ADMIN_SETUP_TOKEN ?? "";
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && b.length > 0 && timingSafeEqual(a, b);
}

const setupSchema = z.object({
  name: z.string().trim().min(2, "Escriba su nombre").max(80),
  email: z.string().trim().toLowerCase().email("Correo no válido").max(200),
  password: passwordSchema,
  confirmPassword: z.string(),
  token: z.string().max(200),
});
export type SetupInput = z.input<typeof setupSchema>;

export async function createFirstAdminAction(input: SetupInput): Promise<Result> {
  const ipHash = await getClientIpHash();
  if (await isRateLimited("setup", ipHash, 10, 15 * 60 * 1000)) return { ok: false, error: RATE_LIMIT_ERROR };
  const parsed = setupSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos no válidos" };
  const d = parsed.data;
  if (d.password !== d.confirmPassword) return { ok: false, error: "Las contraseñas no coinciden." };

  const status = await setupStatus();
  if (!status.needsSetup) return { ok: false, error: "La configuración inicial ya se realizó. Inicie sesión." };
  if (status.tokenRequired && !status.tokenConfigured) {
    return { ok: false, error: "Falta configurar ADMIN_SETUP_TOKEN en el servidor." };
  }
  if (status.tokenRequired && !tokenMatches(d.token)) {
    await recordAttempt("setup", ipHash, false);
    return { ok: false, error: "El código de instalación no es correcto." };
  }

  // Transacción serializable: si dos personas lo intentan a la vez, solo una crea el administrador
  try {
    await db.$transaction(
      async (tx) => {
        if ((await tx.adminUser.count({ where: { role: "ADMIN" } })) > 0) throw new Error("ya-configurado");
        const existing = await tx.adminUser.findUnique({ where: { email: d.email } });
        const passwordHash = await hashPassword(d.password);
        const user = existing
          ? await tx.adminUser.update({ where: { id: existing.id }, data: { name: d.name, role: "ADMIN", active: true, passwordHash } })
          : await tx.adminUser.create({ data: { name: d.name, email: d.email, role: "ADMIN", advisorCode: await uniqueAdvisorCode(tx), passwordHash } });
        await audit({ action: "admin.created", actorType: "SYSTEM", actorId: user.id, ipHash, details: { setup: true, role: "ADMIN" } }, tx);
      },
      { isolationLevel: "Serializable" },
    );
  } catch (e) {
    if ((e as Error).message === "ya-configurado" || (e as { code?: string }).code === "P2034") {
      return { ok: false, error: "La configuración inicial ya se realizó. Inicie sesión." };
    }
    throw e;
  }
  await recordAttempt("setup", ipHash, true);
  await signIn("credentials", { email: d.email, password: d.password, redirect: false });
  return { ok: true };
}
