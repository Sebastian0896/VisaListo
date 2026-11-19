import { z } from "zod";
import { COUNTRIES } from "@/lib/countries";
import type { AnswerValue, ClientQuestion, GroupFieldDef, OptionDef } from "@/lib/form-types";
import { YES_NO_OPTIONS } from "@/lib/form-types";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const todayIso = () => new Date().toISOString().slice(0, 10);

function scalarSchema(type: string, opts: { options?: OptionDef[]; maxLength?: number; min?: number; max?: number; past?: boolean; future?: boolean }) {
  const max = opts.maxLength ?? (type === "TEXTAREA" ? 4000 : 200);
  switch (type) {
    case "EMAIL":
      return z.string().trim().max(200).email("Escriba un correo válido, por ejemplo: nombre@correo.com");
    case "PHONE":
      return z
        .string()
        .trim()
        .max(30)
        .regex(/^\+?[\d\s().-]{7,}$/, "Escriba un teléfono válido (solo números, espacios, + y guiones)");
    case "DATE":
      return z
        .string()
        .regex(ISO_DATE, "Fecha no válida")
        .refine((v) => !Number.isNaN(Date.parse(v)), "Fecha no válida")
        .refine((v) => v >= "1900-01-01", "La fecha es demasiado antigua")
        .refine((v) => !opts.past || v <= todayIso(), "La fecha no puede ser futura")
        .refine((v) => !opts.future || v >= todayIso(), "La fecha debe ser posterior a hoy");
    case "NUMBER":
      return z
        .string()
        .trim()
        .regex(/^\d+([.,]\d+)?$/, "Escriba solo números")
        .refine((v) => opts.min === undefined || Number(v.replace(",", ".")) >= opts.min, `El valor mínimo es ${opts.min}`)
        .refine((v) => opts.max === undefined || Number(v.replace(",", ".")) <= opts.max, `El valor máximo es ${opts.max}`);
    case "SELECT":
    case "RADIO": {
      const values = (opts.options ?? []).map((o) => o.value);
      return z.string().refine((v) => values.includes(v), "Seleccione una opción de la lista");
    }
    case "YESNO":
      return z.enum(["yes", "no"], { message: "Seleccione Sí o No" });
    case "COUNTRY":
      return z.string().refine((v) => COUNTRIES.includes(v), "Seleccione un país de la lista");
    default:
      return z.string().max(max, `Máximo ${max} caracteres`);
  }
}

function groupFieldSchema(f: GroupFieldDef) {
  return scalarSchema(f.type, { options: f.type === "YESNO" ? YES_NO_OPTIONS : f.options });
}

/**
 * Valida el formato de una respuesta. Un valor vacío siempre es válido para guardar
 * (el guardado es incremental); la obligatoriedad se evalúa al revisar/enviar.
 */
export function validateAnswer(q: Pick<ClientQuestion, "type" | "options" | "config">, value: AnswerValue): string | null {
  if (q.type === "GROUP") {
    if (!Array.isArray(value)) return "Formato no válido";
    const maxItems = q.config.maxItems ?? 20;
    if (value.length > maxItems) return `Máximo ${maxItems} registros`;
    const fields = q.config.fields ?? [];
    for (const [i, row] of value.entries()) {
      if (typeof row !== "object" || row === null) return "Formato no válido";
      for (const key of Object.keys(row)) {
        if (!fields.some((f) => f.key === key)) return "Formato no válido";
      }
      for (const f of fields) {
        const v = row[f.key];
        if (v === undefined || v === "") continue;
        if (typeof v !== "string") return "Formato no válido";
        const r = groupFieldSchema(f).safeParse(v);
        if (!r.success) return `Registro ${i + 1}, «${f.label}»: ${r.error.issues[0]?.message}`;
      }
    }
    return null;
  }
  if (typeof value !== "string") return "Formato no válido";
  if (value.trim() === "") return null;
  const r = scalarSchema(q.type, { options: q.options, ...q.config }).safeParse(value);
  return r.success ? null : (r.error.issues[0]?.message ?? "Valor no válido");
}

// ───────────── Esquemas de formularios fijos ─────────────

export const createFileSchema = z.object({
  surname: z.string().trim().min(2, "Escriba su primer apellido").max(60),
  birthYear: z.coerce
    .number({ message: "Escriba su año de nacimiento" })
    .int()
    .min(1900, "Año no válido")
    .max(new Date().getFullYear(), "Año no válido"),
  securityQuestionId: z.string().min(1, "Seleccione una pregunta"),
  securityAnswer: z.string().trim().min(3, "La respuesta debe tener al menos 3 caracteres").max(100),
  securityAnswerConfirm: z.string().trim(),
  acceptPrivacy: z.literal(true, { message: "Debe aceptar la política de privacidad para continuar" }),
}).refine((d) => d.securityAnswer.toLowerCase() === d.securityAnswerConfirm.toLowerCase(), {
  path: ["securityAnswerConfirm"],
  message: "Las respuestas no coinciden",
});
export type CreateFileInput = z.input<typeof createFileSchema>;

export const recoverSchema = z.object({
  code: z.string().trim().min(10, "Escriba su código de expediente").max(30),
  surname: z.string().trim().min(2, "Escriba su primer apellido").max(60),
  birthYear: z.coerce.number({ message: "Escriba su año de nacimiento" }).int().min(1900).max(2100),
  securityAnswer: z.string().trim().min(1, "Escriba su respuesta de seguridad").max(100),
});
export type RecoverInput = z.input<typeof recoverSchema>;

export const messageSchema = z.object({
  message: z.string().trim().min(2, "Escriba un mensaje").max(2000, "Máximo 2000 caracteres"),
});
