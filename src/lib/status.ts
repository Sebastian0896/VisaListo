import type { FileStatus } from "@/generated/prisma/enums";

export const STATUS_LABELS: Record<FileStatus, string> = {
  PENDING_START: "Pendiente de inicio",
  IN_PROGRESS: "En proceso",
  SUBMITTED: "Enviado",
  IN_REVIEW: "En revisión",
  NEEDS_CORRECTIONS: "Requiere correcciones",
  REOPENED: "Reabierto",
  REVIEWED: "Revisado",
  EXPIRED: "Vencido",
};

export const STATUS_DESCRIPTIONS: Record<FileStatus, string> = {
  PENDING_START: "Su expediente está creado. La vigencia comenzará cuando guarde su primera respuesta.",
  IN_PROGRESS: "Está completando su formulario. Sus respuestas se guardan automáticamente.",
  SUBMITTED: "Su formulario fue enviado al asesor. La edición está bloqueada mientras se revisa.",
  IN_REVIEW: "Su asesor está revisando la información.",
  NEEDS_CORRECTIONS: "Su asesor solicitó correcciones. Revise las indicaciones y vuelva a enviar.",
  REOPENED: "Su asesor habilitó nuevamente la edición del formulario.",
  REVIEWED: "Su asesor terminó la revisión del formulario.",
  EXPIRED: "El período de vigencia terminó. Comuníquese con su asesor para solicitar una extensión.",
};

/** Clases de color (Tailwind) por estado */
export const STATUS_STYLES: Record<FileStatus, string> = {
  PENDING_START: "bg-slate-100 text-slate-700 ring-slate-200",
  IN_PROGRESS: "bg-sky-50 text-sky-800 ring-sky-200",
  SUBMITTED: "bg-indigo-50 text-indigo-800 ring-indigo-200",
  IN_REVIEW: "bg-violet-50 text-violet-800 ring-violet-200",
  NEEDS_CORRECTIONS: "bg-amber-50 text-amber-900 ring-amber-200",
  REOPENED: "bg-cyan-50 text-cyan-800 ring-cyan-200",
  REVIEWED: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  EXPIRED: "bg-rose-50 text-rose-800 ring-rose-200",
};

export const ALL_STATUSES = Object.keys(STATUS_LABELS) as FileStatus[];

/** Estados en los que el cliente puede editar (si además no ha vencido). */
export const CLIENT_EDITABLE: FileStatus[] = ["PENDING_START", "IN_PROGRESS", "NEEDS_CORRECTIONS", "REOPENED"];

/** Estados en los que corre la vigencia y puede vencer. */
export const EXPIRABLE: FileStatus[] = ["IN_PROGRESS", "NEEDS_CORRECTIONS", "REOPENED"];

/** Transiciones que el asesor puede aplicar manualmente desde cada estado. */
export const ADMIN_TRANSITIONS: Record<FileStatus, FileStatus[]> = {
  PENDING_START: [],
  IN_PROGRESS: ["REOPENED"],
  SUBMITTED: ["IN_REVIEW", "NEEDS_CORRECTIONS", "REVIEWED", "REOPENED"],
  IN_REVIEW: ["NEEDS_CORRECTIONS", "REVIEWED", "REOPENED"],
  NEEDS_CORRECTIONS: ["IN_REVIEW", "REOPENED"],
  REOPENED: ["IN_REVIEW"],
  REVIEWED: ["IN_REVIEW", "REOPENED"],
  EXPIRED: ["REOPENED"],
};
