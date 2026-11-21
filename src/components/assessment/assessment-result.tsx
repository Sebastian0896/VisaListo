import { AlertTriangle, CheckCircle2, CircleDot, Info, Lightbulb, TrendingUp } from "lucide-react";
import { DISCLAIMER, LEVEL_TEXT, type AssessmentResult, type Level } from "@/lib/assessment";
import { cn } from "@/lib/utils";

const LEVEL_STYLE: Record<Level, { box: string; chip: string; icon: typeof CheckCircle2 }> = {
  strong: { box: "border-emerald-200 bg-emerald-50 text-emerald-950", chip: "bg-emerald-50 text-emerald-800 ring-emerald-200", icon: CheckCircle2 },
  moderate: { box: "border-amber-200 bg-amber-50 text-amber-950", chip: "bg-amber-50 text-amber-900 ring-amber-200", icon: CircleDot },
  weak: { box: "border-orange-200 bg-orange-50 text-orange-950", chip: "bg-orange-50 text-orange-900 ring-orange-200", icon: TrendingUp },
};

const AREA_LEVEL_LABEL: Record<Level, string> = { strong: "Fuerte", moderate: "Aceptable", weak: "A reforzar" };

/** Resultado de la autoevaluación. Se usa para el cliente y en el expediente del asesor. */
export function AssessmentResultView({ result, audience = "client", compact = false }: { result: AssessmentResult; audience?: "client" | "advisor"; compact?: boolean }) {
  const style = LEVEL_STYLE[result.level];
  const Icon = style.icon;
  return (
    <div className="space-y-4">
      <div className={cn("rounded-2xl border p-5", style.box)}>
        <p className="flex items-center gap-2 text-lg font-semibold"><Icon className="size-5" /> {LEVEL_TEXT[result.level].title}</p>
        {!compact && <p className="mt-1.5 text-sm leading-relaxed">{audience === "client" ? LEVEL_TEXT[result.level].summary : "Resultado orientativo de la autoevaluación del cliente. Úselo para preparar la entrevista."}</p>}
      </div>

      {result.flags.length > 0 && (
        <div className="space-y-2">
          {result.flags.map((f) => (
            <div key={f.message} className={cn("flex gap-2.5 rounded-xl border p-3.5 text-sm leading-relaxed", f.severity === "high" ? "border-rose-200 bg-rose-50 text-rose-950" : "border-amber-200 bg-amber-50 text-amber-950")}>
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              <p>{f.message}</p>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-2xl border bg-card p-5">
        <h3 className="text-sm font-semibold">Por área</h3>
        <ul className="mt-3 space-y-2">
          {result.areas.map((a) => (
            <li key={a.key} className="flex items-center justify-between gap-3 text-sm">
              <span>{a.title}</span>
              <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset", LEVEL_STYLE[a.level].chip)}>{AREA_LEVEL_LABEL[a.level]}</span>
            </li>
          ))}
        </ul>
      </div>

      {!compact && (
        <div className="rounded-2xl border bg-card p-5">
          <h3 className="flex items-center gap-2 text-sm font-semibold"><Lightbulb className="size-4 text-primary" /> {audience === "client" ? "Cómo prepararse" : "Puntos para trabajar con el cliente"}</h3>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-muted-foreground">
            {result.tips.map((t) => <li key={t} className="flex gap-2"><span className="text-primary">•</span>{t}</li>)}
          </ul>
        </div>
      )}

      <div className="flex gap-2.5 rounded-xl border bg-muted/40 p-4 text-[13px] leading-relaxed text-muted-foreground">
        <Info className="mt-0.5 size-4 shrink-0 text-primary" />
        <p>{DISCLAIMER}</p>
      </div>
    </div>
  );
}
