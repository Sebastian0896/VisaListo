import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";

const TZ = process.env.APP_TIMEZONE || "America/Santo_Domingo";
const DAY = 86400_000;

export type MonthRow = { key: string; label: string; created: number; submitted: number };
export type AdvisorRow = { id: string | null; name: string; code: string | null; active: boolean; created: number; submitted: number; reviewed: number };

/** "2026-11" en la zona horaria de la plataforma */
function monthKey(d: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit" }).formatToParts(d);
  return `${parts.find((p) => p.type === "year")!.value}-${parts.find((p) => p.type === "month")!.value}`;
}

function monthLabel(key: string) {
  const [y, m] = key.split("-").map(Number);
  return new Intl.DateTimeFormat("es-DO", { timeZone: "UTC", month: "short", year: "2-digit" }).format(new Date(Date.UTC(y, m - 1, 15)));
}

/** Los últimos `n` meses (incluido el actual), del más antiguo al más reciente */
function lastMonths(n: number, now: Date) {
  const [y, m] = monthKey(now).split("-").map(Number);
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(Date.UTC(y, m - 1 - (n - 1 - i), 15));
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
  });
}

/**
 * Estadísticas del negocio a partir de los expedientes.
 * `scope` limita a los expedientes que el usuario puede ver (asesor = los suyos).
 */
export async function getBusinessStats(scope: Prisma.ApplicationFileWhereInput, withAdvisors: boolean) {
  const now = new Date();
  const [files, assessments, advisors] = await Promise.all([
    db.applicationFile.findMany({
      where: scope,
      select: { advisorId: true, createdAt: true, startedAt: true, submittedAt: true, reviewedAt: true, status: true },
    }),
    db.profileAssessment.findMany({
      where: { applicationFile: scope },
      select: { applicationFileId: true, level: true, hasFlags: true },
      orderBy: { createdAt: "desc" },
    }),
    withAdvisors ? db.adminUser.findMany({ select: { id: true, name: true, advisorCode: true, active: true }, orderBy: { name: "asc" } }) : [],
  ]);

  // Embudo: cada etapa cuenta los expedientes que alguna vez llegaron a ella
  const funnel = {
    created: files.length,
    started: files.filter((f) => f.startedAt).length,
    submitted: files.filter((f) => f.submittedAt).length,
    reviewed: files.filter((f) => f.reviewedAt || f.status === "REVIEWED").length,
  };

  const since30 = now.getTime() - 30 * DAY;
  const last30 = {
    created: files.filter((f) => f.createdAt.getTime() >= since30).length,
    submitted: files.filter((f) => f.submittedAt && f.submittedAt.getTime() >= since30).length,
  };

  // Días desde la primera respuesta hasta el envío (mediana: no la mueve un caso aislado)
  const durations = files
    .filter((f) => f.startedAt && f.submittedAt && f.submittedAt >= f.startedAt)
    .map((f) => (f.submittedAt!.getTime() - f.startedAt!.getTime()) / DAY)
    .sort((a, b) => a - b);
  const medianDays = durations.length ? durations[Math.floor((durations.length - 1) / 2)] : null;

  // Por mes (últimos 12)
  const keys = lastMonths(12, now);
  const byMonth = new Map<string, MonthRow>(keys.map((k) => [k, { key: k, label: monthLabel(k), created: 0, submitted: 0 }]));
  for (const f of files) {
    const c = byMonth.get(monthKey(f.createdAt));
    if (c) c.created++;
    if (f.submittedAt) {
      const s = byMonth.get(monthKey(f.submittedAt));
      if (s) s.submitted++;
    }
  }

  // Autoevaluación: solo la más reciente de cada expediente
  const seen = new Set<string>();
  const levels = { strong: 0, moderate: 0, weak: 0 };
  let flagged = 0;
  for (const a of assessments) {
    if (seen.has(a.applicationFileId)) continue;
    seen.add(a.applicationFileId);
    if (a.level in levels) levels[a.level as keyof typeof levels]++;
    if (a.hasFlags) flagged++;
  }

  // Por asesor (solo administradores)
  let byAdvisor: AdvisorRow[] = [];
  if (withAdvisors) {
    const rows = new Map<string | null, AdvisorRow>(
      advisors.map((a) => [a.id, { id: a.id, name: a.name, code: a.advisorCode, active: a.active, created: 0, submitted: 0, reviewed: 0 }]),
    );
    rows.set(null, { id: null, name: "Sin asesor", code: null, active: true, created: 0, submitted: 0, reviewed: 0 });
    for (const f of files) {
      const r = rows.get(f.advisorId) ?? rows.get(null)!;
      r.created++;
      if (f.submittedAt) r.submitted++;
      if (f.reviewedAt || f.status === "REVIEWED") r.reviewed++;
    }
    byAdvisor = [...rows.values()].filter((r) => r.created > 0 || (r.id && r.active)).sort((a, b) => b.created - a.created);
  }

  return { funnel, last30, medianDays, months: [...byMonth.values()], assessed: seen.size, levels, flagged, byAdvisor };
}
