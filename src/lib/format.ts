/** Hora actual (en un helper para usarla en componentes de servidor). */
export function nowMs() {
  return Date.now();
}

const TZ =process.env.APP_TIMEZONE || "America/Santo_Domingo";

export function formatDate(d: Date | string | null | undefined, withTime = false) {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("es-DO", {
    timeZone: TZ,
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  }).format(date);
}

export function formatDateTime(d: Date | string | null | undefined) {
  return formatDate(d, true);
}

/** "3 días y 4 horas" a partir de milisegundos restantes */
export function formatRemaining(ms: number) {
  if (ms <= 0) return "vencido";
  const minutes = Math.floor(ms / 60000);
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const mins = minutes % 60;
  if (days > 0) return `${days} ${days === 1 ? "día" : "días"}${hours ? ` y ${hours} h` : ""}`;
  if (hours > 0) return `${hours} h ${mins} min`;
  return `${mins} min`;
}

/** Fecha ISO "YYYY-MM-DD" → "12 mar 1990" sin desplazamiento por zona horaria */
export function formatIsoDay(value: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return value;
  const date = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], 12));
  return new Intl.DateTimeFormat("es-DO", { timeZone: "UTC", day: "2-digit", month: "short", year: "numeric" }).format(date);
}
