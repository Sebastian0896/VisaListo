import { ExternalLink, Globe, TriangleAlert } from "lucide-react";
import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/page-header";
import { LEVEL_TEXT } from "@/lib/assessment";
import { cn } from "@/lib/utils";
import { fileScope } from "@/server/advisors";
import { requireAdmin } from "@/server/guards";
import { getBusinessStats, type MonthRow } from "@/server/stats";

export const metadata: Metadata = { title: "Estadísticas" };

// Una sola serie por gráfico: azul de la paleta validada (paso propio en modo oscuro)
const BAR = "bg-[#2a78d6] dark:bg-[#3987e5]";

const pct = (part: number, whole: number) => (whole ? Math.round((part / whole) * 100) : 0);

export default async function StatsPage() {
  const me = await requireAdmin();
  const isAdmin = me.role === "ADMIN";
  const s = await getBusinessStats(fileScope(me), isAdmin);
  const { funnel } = s;

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Estadísticas"
        description={isAdmin ? "Cómo avanzan los expedientes de toda la plataforma." : "Cómo avanzan sus expedientes."}
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Tile label="Expedientes" value={funnel.created} />
        <Tile label="Nuevos (últimos 30 días)" value={s.last30.created} note={`${s.last30.submitted} ${s.last30.submitted === 1 ? "enviado" : "enviados"} en ese período`} />
        <Tile label="Tasa de envío" value={`${pct(funnel.submitted, funnel.created)} %`} note="de los creados llegan a enviarse" />
        <Tile
          label="Tiempo típico hasta enviar"
          value={s.medianDays === null ? "—" : s.medianDays < 1 ? "< 1 día" : `${Math.round(s.medianDays)} ${Math.round(s.medianDays) === 1 ? "día" : "días"}`}
          note="mediana, desde la primera respuesta"
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card title="Embudo de expedientes" sub="Cuántos llegan a cada etapa y qué porcentaje conservan respecto a los creados.">
          {funnel.created === 0 ? (
            <Empty text="Aún no hay expedientes." />
          ) : (
            <ul className="space-y-3">
              {[
                { label: "Creados", value: funnel.created },
                { label: "Iniciados (con alguna respuesta)", value: funnel.started },
                { label: "Enviados para revisión", value: funnel.submitted },
                { label: "Revisados", value: funnel.reviewed },
              ].map((row) => (
                <HBar key={row.label} label={row.label} value={row.value} max={funnel.created} />
              ))}
            </ul>
          )}
        </Card>

        <Card title="Expedientes creados por mes" sub="Últimos 12 meses. Pase el cursor por una barra para ver también los enviados.">
          <MonthChart months={s.months} />
        </Card>

        <Card title="Resultados de la autoevaluación" sub={`Última autoevaluación de ${s.assessed} ${s.assessed === 1 ? "expediente" : "expedientes"} (solo las hechas desde el portal).`}>
          {s.assessed === 0 ? (
            <Empty text="Ningún cliente ha completado la autoevaluación todavía." />
          ) : (
            <>
              <ul className="space-y-3">
                {(["strong", "moderate", "weak"] as const).map((lvl) => (
                  <HBar key={lvl} label={LEVEL_TEXT[lvl].title} value={s.levels[lvl]} max={s.assessed} />
                ))}
              </ul>
              {s.flagged > 0 && (
                <p className="mt-4 flex items-start gap-2 text-sm text-muted-foreground">
                  <TriangleAlert className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
                  <span>
                    <strong className="font-medium text-foreground">{s.flagged}</strong> {s.flagged === 1 ? "caso marca" : "casos marcan"} antecedentes migratorios o negaciones previas: conviene revisarlos con el cliente.
                  </span>
                </p>
              )}
            </>
          )}
        </Card>

        <Card title="Visitas a la web" sub="Tráfico de las páginas públicas (inicio, autoevaluación, comenzar, recuperar).">
          <div className="flex gap-3 text-sm text-muted-foreground">
            <Globe className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
            <div className="space-y-2">
              <p>
                Las visitas se miden con <strong className="font-medium text-foreground">Vercel Web Analytics</strong>: visitantes, páginas más vistas, de dónde llegan, país y dispositivo. No usa cookies y no mide el portal del cliente ni este panel.
              </p>
              <p>Se consultan en Vercel → proyecto → <em>Analytics</em>.</p>
              <a
                href="https://vercel.com/dashboard"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline"
              >
                Abrir Vercel <ExternalLink className="size-3.5" />
              </a>
            </div>
          </div>
        </Card>
      </div>

      {isAdmin && (
        <section className="mt-6 overflow-hidden rounded-2xl border bg-card shadow-sm">
          <header className="border-b px-4 py-3">
            <h2 className="text-sm font-semibold">Por asesor</h2>
            <p className="text-xs text-muted-foreground">Expedientes vinculados a cada asesor mediante su código.</p>
          </header>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-muted-foreground">
                <tr className="border-b">
                  <th className="px-4 py-2 font-medium">Asesor</th>
                  <th className="px-4 py-2 text-right font-medium">Creados</th>
                  <th className="px-4 py-2 text-right font-medium">Enviados</th>
                  <th className="px-4 py-2 text-right font-medium">Revisados</th>
                  <th className="px-4 py-2 text-right font-medium">Tasa de envío</th>
                </tr>
              </thead>
              <tbody className="divide-y tabular-nums">
                {s.byAdvisor.map((r) => (
                  <tr key={r.id ?? "none"}>
                    <td className="px-4 py-2.5">
                      <span className={cn("font-medium", !r.id && "text-muted-foreground")}>{r.name}</span>
                      {r.code && <span className="ml-2 font-mono text-xs text-muted-foreground">{r.code}</span>}
                      {r.id && !r.active && <span className="ml-2 text-xs text-muted-foreground">(inactivo)</span>}
                    </td>
                    <td className="px-4 py-2.5 text-right">{r.created}</td>
                    <td className="px-4 py-2.5 text-right">{r.submitted}</td>
                    <td className="px-4 py-2.5 text-right">{r.reviewed}</td>
                    <td className="px-4 py-2.5 text-right">{r.created ? `${pct(r.submitted, r.created)} %` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

function Tile({ label, value, note }: { label: string; value: number | string; note?: string }) {
  return (
    <div className="rounded-2xl border bg-card p-4 shadow-sm">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-3xl font-semibold">{value}</p>
      {note && <p className="mt-0.5 text-xs text-muted-foreground">{note}</p>}
    </div>
  );
}

function Card({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border bg-card shadow-sm">
      <header className="border-b px-4 py-3">
        <h2 className="text-sm font-semibold">{title}</h2>
        <p className="text-xs text-muted-foreground">{sub}</p>
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="py-8 text-center text-sm text-muted-foreground">{text}</p>;
}

/** Barra horizontal anclada a la izquierda; el valor va en texto, no solo en el color */
function HBar({ label, value, max }: { label: string; value: number; max: number }) {
  const width = max ? (value / max) * 100 : 0;
  return (
    <li>
      <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
        <span>{label}</span>
        <span className="text-muted-foreground tabular-nums">
          <strong className="font-semibold text-foreground">{value}</strong> · {pct(value, max)} %
        </span>
      </div>
      <div className="h-2.5 rounded-r-[4px] bg-muted">
        <div className={cn("h-full rounded-r-[4px]", BAR)} style={{ width: `${width}%`, minWidth: value > 0 ? 4 : 0 }} />
      </div>
    </li>
  );
}

/** Columnas por mes con tooltip al pasar el cursor (o al enfocar con el teclado) */
function MonthChart({ months }: { months: MonthRow[] }) {
  const max = Math.max(...months.map((m) => m.created), 0);
  if (max === 0) return <Empty text="Sin expedientes en los últimos 12 meses." />;
  const last = months.length - 1;
  const peak = months.findIndex((m) => m.created === max);
  return (
    <>
      <div className="relative">
        <span className="absolute top-0 left-0 text-[11px] text-muted-foreground tabular-nums">{max}</span>
        <div className="absolute inset-x-0 top-2 border-t border-dashed border-border" aria-hidden />
        <div className="flex h-44 items-end gap-1.5 border-b border-foreground/20 pt-6">
          {months.map((m, i) => (
            <div key={m.key} tabIndex={0} className="group relative flex h-full flex-1 flex-col items-center justify-end outline-none" aria-label={`${m.label}: ${m.created} creados, ${m.submitted} enviados`}>
              {(i === peak || i === last) && m.created > 0 && (
                <span className="mb-1 text-[11px] font-medium tabular-nums">{m.created}</span>
              )}
              <div
                className={cn("w-full max-w-9 rounded-t-[4px] transition-opacity group-hover:opacity-80", BAR)}
                style={{ height: `${(m.created / max) * 100}%`, minHeight: m.created > 0 ? 4 : 0 }}
              />
              <div
                className={cn(
                  "pointer-events-none absolute bottom-full z-10 mb-1 w-max rounded-lg border bg-popover px-2.5 py-1.5 text-xs text-popover-foreground opacity-0 shadow-md transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100",
                  // En los bordes se alinea hacia adentro para no salirse de la tarjeta
                  i < 2 ? "left-0" : i > last - 2 ? "right-0" : "left-1/2 -translate-x-1/2",
                )}
              >
                <p className="font-medium capitalize">{m.label}</p>
                <p className="tabular-nums">{m.created} creados · {m.submitted} enviados</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-1.5 flex gap-1.5">
        {months.map((m) => (
          <span key={m.key} className="flex-1 truncate text-center text-[10px] text-muted-foreground capitalize">{m.label.split(" ")[0].replace(".", "")}</span>
        ))}
      </div>
      <details className="mt-3 text-sm">
        <summary className="cursor-pointer text-xs font-medium text-primary">Ver como tabla</summary>
        <table className="mt-2 w-full text-xs tabular-nums">
          <thead className="text-left text-muted-foreground">
            <tr><th className="py-1 font-medium">Mes</th><th className="py-1 text-right font-medium">Creados</th><th className="py-1 text-right font-medium">Enviados</th></tr>
          </thead>
          <tbody className="divide-y">
            {months.map((m) => (
              <tr key={m.key}><td className="py-1 capitalize">{m.label}</td><td className="py-1 text-right">{m.created}</td><td className="py-1 text-right">{m.submitted}</td></tr>
            ))}
          </tbody>
        </table>
      </details>
    </>
  );
}
