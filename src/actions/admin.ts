"use server";

import { AuthError } from "next-auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { signIn, signOut } from "@/auth";
import type { FileStatus, Prisma } from "@/generated/prisma/client";
import { audit } from "@/lib/audit";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { ADMIN_TRANSITIONS, STATUS_LABELS } from "@/lib/status";
import { addDays } from "@/server/files";
import { canAccessFile } from "@/server/advisors";
import { assertAdmin, getAdmin } from "@/server/guards";

type Result = { ok: true } | { ok: false; error: string };

function revalidateFile(fileId: string) {
  revalidatePath(`/admin/expedientes/${fileId}`);
  revalidatePath("/admin/expedientes");
  revalidatePath("/admin");
}

/** Usuario del panel con acceso al expediente (Administrador: todos; Asesor: los suyos). */
async function fileGuard(fileId: string) {
  if (typeof fileId !== "string" || fileId.length > 40) return null;
  const a = await getAdmin();
  if (!a || !(await canAccessFile(a, fileId))) return null;
  return a;
}

// ───────────── Sesión ─────────────

export async function adminLoginAction(input: { email: string; password: string }): Promise<Result> {
  try {
    await signIn("credentials", { email: input.email, password: input.password, redirect: false });
    return { ok: true };
  } catch (e) {
    if (e instanceof AuthError) {
      if ((e as { code?: string }).code === "rate_limited") return { ok: false, error: "Demasiados intentos. Espere unos minutos." };
      return { ok: false, error: "Correo o contraseña incorrectos." };
    }
    throw e;
  }
}

export async function adminLogoutAction() {
  await signOut({ redirectTo: "/admin/login" });
}

// ───────────── Estados ─────────────

const idSchema = z.string().min(1).max(40);

export async function changeStatusAction(fileId: string, to: FileStatus): Promise<Result> {
  const a = await fileGuard(fileId);
  if (!a) return { ok: false, error: "No tiene acceso a este expediente." };
  idSchema.parse(fileId);
  const file = await db.applicationFile.findUnique({ where: { id: fileId } });
  if (!file) return { ok: false, error: "Expediente no encontrado" };
  if (!ADMIN_TRANSITIONS[file.status].includes(to)) {
    return { ok: false, error: `No se puede pasar de «${STATUS_LABELS[file.status]}» a «${STATUS_LABELS[to]}».` };
  }
  if (to === "REOPENED") return reopenAction(fileId);
  if (to === "NEEDS_CORRECTIONS") return { ok: false, error: "Use «Solicitar correcciones» para indicar qué debe corregirse." };
  if (to === "REVIEWED") return markReviewedAction(fileId, "");

  await db.$transaction(async (tx) => {
    await tx.applicationFile.update({ where: { id: fileId }, data: { status: to } });
    await audit({ action: "file.status_changed", actorType: "ADMIN", actorId: a.id, fileId, details: { from: file.status, to } }, tx);
  });
  revalidateFile(fileId);
  return { ok: true };
}

export async function requestCorrectionsAction(fileId: string, text: string): Promise<Result> {
  const a = await fileGuard(fileId);
  if (!a) return { ok: false, error: "No tiene acceso a este expediente." };
  const body = z.string().trim().min(5, "Describa qué debe corregirse").max(3000).safeParse(text);
  if (!body.success) return { ok: false, error: body.error.issues[0].message };
  const file = await db.applicationFile.findUnique({ where: { id: fileId } });
  if (!file) return { ok: false, error: "Expediente no encontrado" };
  if (!ADMIN_TRANSITIONS[file.status].includes("NEEDS_CORRECTIONS")) return { ok: false, error: "El expediente no admite correcciones en su estado actual." };

  const settings = await getSettings();
  const now = new Date();
  // Si la vigencia ya pasó, se otorga un nuevo período para corregir
  const expiresAt = !file.expiresAt || file.expiresAt <= now ? addDays(now, settings.validityDays) : file.expiresAt;

  await db.$transaction(async (tx) => {
    await tx.applicationFile.update({ where: { id: fileId }, data: { status: "NEEDS_CORRECTIONS", correctionRequest: body.data, expiresAt } });
    await tx.review.create({ data: { applicationFileId: fileId, adminUserId: a.id, outcome: "CORRECTIONS_REQUESTED", comments: body.data } });
    await tx.message.create({ data: { applicationFileId: fileId, senderType: "ADMIN", adminUserId: a.id, message: `Correcciones solicitadas:\n${body.data}` } });
    await audit({ action: "file.corrections_requested", actorType: "ADMIN", actorId: a.id, fileId, details: { from: file.status } }, tx);
    await audit({ action: "file.status_changed", actorType: "ADMIN", actorId: a.id, fileId, details: { from: file.status, to: "NEEDS_CORRECTIONS" } }, tx);
  });
  revalidateFile(fileId);
  return { ok: true };
}

export async function markReviewedAction(fileId: string, comments: string): Promise<Result> {
  const a = await fileGuard(fileId);
  if (!a) return { ok: false, error: "No tiene acceso a este expediente." };
  const file = await db.applicationFile.findUnique({ where: { id: fileId } });
  if (!file) return { ok: false, error: "Expediente no encontrado" };
  if (!ADMIN_TRANSITIONS[file.status].includes("REVIEWED")) return { ok: false, error: "El expediente no puede marcarse como revisado en su estado actual." };
  const text = comments.trim().slice(0, 3000) || null;
  await db.$transaction(async (tx) => {
    await tx.applicationFile.update({ where: { id: fileId }, data: { status: "REVIEWED", reviewedAt: new Date(), correctionRequest: null } });
    await tx.review.create({ data: { applicationFileId: fileId, adminUserId: a.id, outcome: "APPROVED", comments: text } });
    await audit({ action: "file.reviewed", actorType: "ADMIN", actorId: a.id, fileId }, tx);
    await audit({ action: "file.status_changed", actorType: "ADMIN", actorId: a.id, fileId, details: { from: file.status, to: "REVIEWED" } }, tx);
  });
  revalidateFile(fileId);
  return { ok: true };
}

export async function reopenAction(fileId: string, days?: number): Promise<Result> {
  const a = await fileGuard(fileId);
  if (!a) return { ok: false, error: "No tiene acceso a este expediente." };
  const file = await db.applicationFile.findUnique({ where: { id: fileId } });
  if (!file) return { ok: false, error: "Expediente no encontrado" };
  if (!ADMIN_TRANSITIONS[file.status].includes("REOPENED")) return { ok: false, error: "El expediente no puede reabrirse en su estado actual." };
  const settings = await getSettings();
  const now = new Date();
  const span = days && days > 0 ? Math.min(days, 365) : settings.validityDays;
  const expiresAt = !file.expiresAt || file.expiresAt <= now ? addDays(now, span) : file.expiresAt;
  await db.$transaction(async (tx) => {
    await tx.applicationFile.update({ where: { id: fileId }, data: { status: "REOPENED", expiresAt } });
    await audit(
      { action: "file.reopened", actorType: "ADMIN", actorId: a.id, fileId, details: { from: file.status, previousExpiresAt: file.expiresAt?.toISOString() ?? null, expiresAt: expiresAt.toISOString() } },
      tx,
    );
  });
  revalidateFile(fileId);
  return { ok: true };
}

export async function extendValidityAction(fileId: string, days: number): Promise<Result> {
  const a = await fileGuard(fileId);
  if (!a) return { ok: false, error: "No tiene acceso a este expediente." };
  const d = z.coerce.number().int().min(1, "Mínimo 1 día").max(365, "Máximo 365 días").safeParse(days);
  if (!d.success) return { ok: false, error: d.error.issues[0].message };
  const file = await db.applicationFile.findUnique({ where: { id: fileId } });
  if (!file) return { ok: false, error: "Expediente no encontrado" };
  if (!file.startedAt) return { ok: false, error: "La vigencia aún no ha comenzado: el cliente no ha iniciado el formulario." };
  const now = new Date();
  const base = file.expiresAt && file.expiresAt > now ? file.expiresAt : now;
  const expiresAt = addDays(base, d.data);
  // Un expediente vencido sin enviar vuelve a "En proceso"
  const status: FileStatus = file.status === "EXPIRED" ? (file.submittedAt ? "REOPENED" : "IN_PROGRESS") : file.status;
  await db.$transaction(async (tx) => {
    await tx.applicationFile.update({ where: { id: fileId }, data: { expiresAt, status } });
    await audit(
      { action: "file.extended", actorType: "ADMIN", actorId: a.id, fileId, details: { days: d.data, previousExpiresAt: file.expiresAt?.toISOString() ?? null, expiresAt: expiresAt.toISOString() } },
      tx,
    );
    if (status !== file.status) {
      await audit({ action: "file.status_changed", actorType: "ADMIN", actorId: a.id, fileId, details: { from: file.status, to: status } }, tx);
    }
  });
  revalidateFile(fileId);
  return { ok: true };
}

// ───────────── Notas y mensajes ─────────────

export async function addNoteAction(fileId: string, body: string): Promise<Result> {
  const a = await fileGuard(fileId);
  if (!a) return { ok: false, error: "No tiene acceso a este expediente." };
  const text = z.string().trim().min(2, "Escriba la nota").max(4000).safeParse(body);
  if (!text.success) return { ok: false, error: text.error.issues[0].message };
  await db.internalNote.create({ data: { applicationFileId: fileId, adminUserId: a.id, body: text.data } });
  await audit({ action: "note.added", actorType: "ADMIN", actorId: a.id, fileId });
  revalidateFile(fileId);
  return { ok: true };
}

export async function sendAdminMessageAction(fileId: string, input: { message: string }): Promise<Result> {
  const a = await fileGuard(fileId);
  if (!a) return { ok: false, error: "No tiene acceso a este expediente." };
  const text = z.string().trim().min(2, "Escriba un mensaje").max(2000).safeParse(input.message);
  if (!text.success) return { ok: false, error: text.error.issues[0].message };
  const file = await db.applicationFile.findUnique({ where: { id: fileId }, select: { id: true } });
  if (!file) return { ok: false, error: "Expediente no encontrado" };
  await db.message.create({ data: { applicationFileId: fileId, senderType: "ADMIN", adminUserId: a.id, message: text.data } });
  // Responder implica haber leído los mensajes del cliente
  await db.message.updateMany({ where: { applicationFileId: fileId, senderType: "CLIENT", readAt: null }, data: { readAt: new Date() } });
  await audit({ action: "message.sent", actorType: "ADMIN", actorId: a.id, fileId });
  revalidateFile(fileId);
  revalidatePath("/admin/mensajes");
  return { ok: true };
}

// ───────────── Configuración ─────────────

const settingsSchema = z.object({
  platformName: z.string().trim().min(2).max(80),
  logoUrl: z.string().trim().url("URL de logotipo no válida").max(500).or(z.literal("")),
  whatsappNumber: z.string().trim().regex(/^\+?[\d\s-]{0,20}$/, "Número no válido").max(20),
  whatsappMessage: z.string().trim().min(5).max(500),
  validityDays: z.coerce.number().int().min(1).max(365),
  expiryWarningDays: z.coerce.number().int().min(0).max(60),
  welcomeMessage: z.string().trim().max(1000),
  expiryMessage: z.string().trim().max(1000),
  contactEmail: z.string().trim().email("Correo no válido").max(200).or(z.literal("")),
  contactPhone: z.string().trim().max(40),
  contactAddress: z.string().trim().max(300),
  officeHours: z.string().trim().max(200),
  aboutText: z.string().trim().max(1000),
  privacyPolicy: z.string().trim().max(20000),
  privacyVersion: z.string().trim().min(1).max(20),
});
export type SettingsInput = z.input<typeof settingsSchema>;

export async function updateSettingsAction(input: SettingsInput): Promise<Result> {
  const a = await assertAdmin("ADMIN");
  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos no válidos" };
  const d = parsed.data;
  const data = {
    ...d,
    logoUrl: d.logoUrl || null,
    whatsappNumber: d.whatsappNumber || null,
    contactEmail: d.contactEmail || null,
    contactPhone: d.contactPhone || null,
    contactAddress: d.contactAddress || null,
    officeHours: d.officeHours || null,
  };
  await db.platformSettings.upsert({ where: { id: 1 }, create: { id: 1, ...data }, update: data });
  await audit({ action: "settings.updated", actorType: "ADMIN", actorId: a.id, details: { fields: Object.keys(d) } });
  revalidatePath("/", "layout");
  return { ok: true };
}

// ───────────── Plantillas del formulario ─────────────

const helpSchema = z.object({
  guidance: z.string().trim().min(3, "La orientación es obligatoria").max(2000),
  example: z.string().trim().max(1000),
  notApplicable: z.string().trim().max(1000),
  warning: z.string().trim().max(1000),
});

/** Las orientaciones se pueden editar en cualquier versión (no alteran los datos guardados). */
export async function updateHelpAction(questionId: string, input: z.input<typeof helpSchema>): Promise<Result> {
  const a = await assertAdmin("ADMIN");
  const parsed = helpSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const d = parsed.data;
  const data = { guidance: d.guidance, example: d.example || null, notApplicable: d.notApplicable || null, warning: d.warning || null };
  const q = await db.formQuestion.findUnique({ where: { id: questionId }, select: { id: true, key: true, section: { select: { templateVersionId: true } } } });
  if (!q) return { ok: false, error: "Pregunta no encontrada" };
  await db.helpContent.upsert({ where: { questionId }, create: { questionId, ...data }, update: data });
  await audit({ action: "template.updated", actorType: "ADMIN", actorId: a.id, details: { kind: "help", question: q.key } });
  revalidatePath(`/admin/formulario/${q.section.templateVersionId}`);
  return { ok: true };
}

const questionSchema = z.object({
  label: z.string().trim().min(3).max(300),
  required: z.boolean(),
  active: z.boolean(),
  order: z.coerce.number().int().min(0).max(999),
  options: z.string().max(5000).optional(),
});

async function assertDraft(versionId: string) {
  const v = await db.formTemplateVersion.findUnique({ where: { id: versionId } });
  if (!v) throw new Error("Versión no encontrada");
  if (v.status !== "DRAFT") throw new Error("Solo se pueden modificar preguntas en versiones en borrador.");
  return v;
}

/** Opciones en formato "valor|Etiqueta" (una por línea) */
function parseOptions(text: string) {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l, order) => {
      const [value, ...rest] = l.split("|");
      const label = rest.join("|").trim() || value.trim();
      return { value: value.trim().slice(0, 60), label: label.slice(0, 200), order };
    });
}

export async function updateQuestionAction(questionId: string, input: z.input<typeof questionSchema>): Promise<Result> {
  const a = await assertAdmin("ADMIN");
  const parsed = questionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const q = await db.formQuestion.findUnique({ where: { id: questionId }, include: { section: true } });
  if (!q) return { ok: false, error: "Pregunta no encontrada" };
  try {
    await assertDraft(q.section.templateVersionId);
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
  const { options, ...rest } = parsed.data;
  await db.$transaction(async (tx) => {
    await tx.formQuestion.update({ where: { id: questionId }, data: rest });
    if (options !== undefined && (q.type === "SELECT" || q.type === "RADIO")) {
      const parsedOpts = parseOptions(options);
      await tx.formOption.deleteMany({ where: { questionId } });
      if (parsedOpts.length) await tx.formOption.createMany({ data: parsedOpts.map((o) => ({ ...o, questionId })) });
    }
  });
  await audit({ action: "template.updated", actorType: "ADMIN", actorId: a.id, details: { kind: "question", question: q.key } });
  revalidatePath(`/admin/formulario/${q.section.templateVersionId}`);
  return { ok: true };
}

const newQuestionSchema = z.object({
  key: z.string().trim().regex(/^[a-z][a-z0-9_]{1,40}$/, "Clave: minúsculas, números y _ (ej.: hobby_details)"),
  label: z.string().trim().min(3).max(300),
  type: z.enum(["TEXT", "TEXTAREA", "EMAIL", "PHONE", "DATE", "NUMBER", "SELECT", "RADIO", "YESNO", "COUNTRY"]),
  required: z.boolean(),
  guidance: z.string().trim().min(3, "Escriba la orientación").max(2000),
  options: z.string().max(5000),
});

export async function addQuestionAction(sectionId: string, input: z.input<typeof newQuestionSchema>): Promise<Result> {
  const a = await assertAdmin("ADMIN");
  const parsed = newQuestionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const section = await db.formSection.findUnique({ where: { id: sectionId }, include: { questions: { select: { order: true } } } });
  if (!section) return { ok: false, error: "Sección no encontrada" };
  try {
    await assertDraft(section.templateVersionId);
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
  const d = parsed.data;
  const exists = await db.formQuestion.findFirst({ where: { key: d.key, section: { templateVersionId: section.templateVersionId } } });
  if (exists) return { ok: false, error: "Ya existe una pregunta con esa clave en esta versión." };
  const opts = d.type === "SELECT" || d.type === "RADIO" ? parseOptions(d.options) : [];
  if ((d.type === "SELECT" || d.type === "RADIO") && opts.length < 2) return { ok: false, error: "Agregue al menos dos opciones (una por línea)." };
  await db.formQuestion.create({
    data: {
      sectionId,
      key: d.key,
      label: d.label,
      type: d.type,
      required: d.required,
      order: Math.max(0, ...section.questions.map((q) => q.order)) + 1,
      options: opts.length ? { create: opts } : undefined,
      help: { create: { guidance: d.guidance } },
    },
  });
  await audit({ action: "template.updated", actorType: "ADMIN", actorId: a.id, details: { kind: "question_added", question: d.key } });
  revalidatePath(`/admin/formulario/${section.templateVersionId}`);
  return { ok: true };
}

/** Crea una nueva versión en borrador copiando otra (estructura, opciones y orientaciones). */
export async function cloneVersionAction(fromVersionId: string): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const a = await assertAdmin("ADMIN");
  const from = await db.formTemplateVersion.findUnique({
    where: { id: fromVersionId },
    include: { sections: { include: { questions: { include: { options: true, help: true } } } } },
  });
  if (!from) return { ok: false, error: "Versión no encontrada" };
  const draft = await db.formTemplateVersion.findFirst({ where: { templateId: from.templateId, status: "DRAFT" } });
  if (draft) return { ok: false, error: `Ya existe un borrador (versión ${draft.version}). Publíquelo o edítelo antes de crear otro.` };
  const last = await db.formTemplateVersion.aggregate({ where: { templateId: from.templateId }, _max: { version: true } });
  const created = await db.$transaction(
    async (tx) => {
      const v = await tx.formTemplateVersion.create({
        data: { templateId: from.templateId, version: (last._max.version ?? 0) + 1, status: "DRAFT", notes: `Basada en la versión ${from.version}` },
      });
      for (const s of from.sections) {
        await tx.formSection.create({
          data: {
            templateVersionId: v.id,
            key: s.key,
            order: s.order,
            title: s.title,
            description: s.description,
            notice: s.notice,
            questions: {
              create: s.questions.map((q) => ({
                key: q.key,
                order: q.order,
                label: q.label,
                type: q.type,
                required: q.required,
                active: q.active,
                sensitive: q.sensitive,
                placeholder: q.placeholder,
                config: (q.config ?? undefined) as Prisma.InputJsonValue | undefined,
                showIf: (q.showIf ?? undefined) as Prisma.InputJsonValue | undefined,
                options: { create: q.options.map((o) => ({ value: o.value, label: o.label, order: o.order })) },
                help: q.help ? { create: { guidance: q.help.guidance, example: q.help.example, notApplicable: q.help.notApplicable, warning: q.help.warning } } : undefined,
              })),
            },
          },
        });
      }
      return v;
    },
    { timeout: 120_000 },
  );
  await audit({ action: "template.updated", actorType: "ADMIN", actorId: a.id, details: { kind: "version_cloned", from: from.version, to: created.version } });
  revalidatePath("/admin/formulario");
  return { ok: true, id: created.id };
}

export async function publishVersionAction(versionId: string): Promise<Result> {
  const a = await assertAdmin("ADMIN");
  const v = await db.formTemplateVersion.findUnique({ where: { id: versionId } });
  if (!v || v.status !== "DRAFT") return { ok: false, error: "Solo se puede publicar un borrador." };
  await db.$transaction(async (tx) => {
    await tx.formTemplateVersion.updateMany({ where: { templateId: v.templateId, status: "PUBLISHED" }, data: { status: "ARCHIVED" } });
    await tx.formTemplateVersion.update({ where: { id: versionId }, data: { status: "PUBLISHED", publishedAt: new Date() } });
  });
  await audit({ action: "template.updated", actorType: "ADMIN", actorId: a.id, details: { kind: "version_published", version: v.version } });
  revalidatePath("/admin/formulario");
  return { ok: true };
}

export async function toggleVerifiedAction(versionId: string, verified: boolean): Promise<Result> {
  const a = await assertAdmin("ADMIN");
  await db.formTemplateVersion.update({ where: { id: versionId }, data: { verifiedAt: verified ? new Date() : null } });
  await audit({ action: "template.updated", actorType: "ADMIN", actorId: a.id, details: { kind: verified ? "version_verified" : "version_unverified" } });
  revalidatePath("/admin/formulario");
  revalidatePath(`/admin/formulario/${versionId}`);
  return { ok: true };
}

// ───────────── Asignación de asesor (solo Administrador) ─────────────

export async function reassignFileAction(fileId: string, advisorId: string | null): Promise<Result> {
  const a = await assertAdmin("ADMIN");
  const file = await db.applicationFile.findUnique({ where: { id: fileId }, select: { id: true, advisorId: true } });
  if (!file) return { ok: false, error: "Expediente no encontrado" };
  if (advisorId) {
    const target = await db.adminUser.findUnique({ where: { id: advisorId }, select: { active: true } });
    if (!target?.active) return { ok: false, error: "El usuario seleccionado no existe o está inactivo." };
  }
  if ((file.advisorId ?? null) === (advisorId ?? null)) return { ok: true };
  await db.applicationFile.update({ where: { id: fileId }, data: { advisorId } });
  await audit({ action: "file.assigned", actorType: "ADMIN", actorId: a.id, fileId, details: { from: file.advisorId, advisorId, via: "admin" } });
  revalidateFile(fileId);
  return { ok: true };
}
