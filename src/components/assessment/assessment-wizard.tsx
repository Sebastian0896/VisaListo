"use client";

import { ArrowRight, Loader2, RotateCcw, Sparkles } from "lucide-react";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { saveAssessmentAction } from "@/actions/assessment";
import { Button, buttonVariants } from "@/components/ui/button";
import { AREAS, ASSESSMENT_QUESTIONS, evaluateAssessment, validateAssessment, type AreaKey, type AssessmentAnswers, type AssessmentResult } from "@/lib/assessment";
import { cn } from "@/lib/utils";
import { AssessmentResultView } from "./assessment-result";

export function AssessmentWizard({
  mode,
  initialAnswers = {},
  prefilledKeys = [],
  initialResult = null,
}: {
  mode: "public" | "portal";
  initialAnswers?: AssessmentAnswers;
  prefilledKeys?: string[];
  initialResult?: AssessmentResult | null;
}) {
  const [answers, setAnswers] = useState<AssessmentAnswers>(initialAnswers);
  const [result, setResult] = useState<AssessmentResult | null>(initialResult);
  const [showErrors, setShowErrors] = useState(false);
  const [pending, startTransition] = useTransition();
  const prefilled = useMemo(() => new Set(prefilledKeys), [prefilledKeys]);

  const answered = ASSESSMENT_QUESTIONS.filter((q) => answers[q.key]).length;
  const total = ASSESSMENT_QUESTIONS.length;

  const submit = () => {
    if (!validateAssessment(answers)) {
      setShowErrors(true);
      toast.error(`Responda todas las preguntas (${total - answered} pendiente${total - answered === 1 ? "" : "s"}).`);
      const first = ASSESSMENT_QUESTIONS.find((q) => !answers[q.key]);
      if (first) document.getElementById(`aq-${first.key}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    if (mode === "public") {
      setResult(evaluateAssessment(answers));
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    startTransition(async () => {
      const res = await saveAssessmentAction(answers);
      if (!res.ok) return void toast.error(res.error);
      setResult(res.result);
      toast.success("Autoevaluación guardada. Su asesor podrá verla.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  };

  if (result) {
    return (
      <div className="space-y-5">
        <AssessmentResultView result={result} />
        <div className="flex flex-wrap gap-2">
          {mode === "public" ? (
            <>
              <Link href="/comenzar" className={cn(buttonVariants({ size: "lg" }), "h-11 px-5")}>
                Comenzar mi formulario con un asesor <ArrowRight />
              </Link>
              <Button variant="outline" size="lg" className="h-11" onClick={() => setResult(null)}><RotateCcw /> Cambiar respuestas</Button>
            </>
          ) : (
            <>
              <Link href="/portal" className={cn(buttonVariants({ size: "lg" }), "h-11 px-5")}>Volver a mi expediente</Link>
              <Button variant="outline" size="lg" className="h-11" onClick={() => setResult(null)}><RotateCcw /> Volver a evaluarme</Button>
            </>
          )}
        </div>
        {mode === "public" && <p className="text-xs text-muted-foreground">Sus respuestas no se guardaron: esta evaluación se hizo solo en su navegador.</p>}
      </div>
    );
  }

  const areas = Object.keys(AREAS) as AreaKey[];
  return (
    <div className="space-y-6">
      {prefilled.size > 0 && (
        <p className="flex gap-2 rounded-xl border border-sky-200 bg-sky-50 p-3.5 text-sm text-sky-950">
          <Sparkles className="mt-0.5 size-4 shrink-0" /> Marcamos algunas respuestas según su formulario. Revíselas y corrija lo que haga falta.
        </p>
      )}
      {areas.map((area) => (
        <section key={area} className="space-y-5 rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
          <h2 className="font-semibold text-primary">{AREAS[area].title}</h2>
          {ASSESSMENT_QUESTIONS.filter((q) => q.area === area).map((q) => {
            const missing = showErrors && !answers[q.key];
            return (
              <fieldset key={q.key} id={`aq-${q.key}`} className="scroll-mt-28 space-y-2">
                <legend className="text-[15px] font-medium">
                  {q.label}
                  {prefilled.has(q.key) && answers[q.key] === initialAnswers[q.key] && (
                    <span className="ml-2 rounded bg-sky-50 px-1.5 py-0.5 text-[11px] font-medium text-sky-800">Según su formulario</span>
                  )}
                </legend>
                {q.help && <p className="text-[13px] text-muted-foreground">{q.help}</p>}
                <div className="grid gap-2 sm:grid-cols-2">
                  {q.options.map((o) => {
                    const checked = answers[q.key] === o.value;
                    return (
                      <label
                        key={o.value}
                        className={cn(
                          "flex cursor-pointer items-start gap-2.5 rounded-lg border bg-card px-3.5 py-2.5 text-sm transition has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50",
                          checked ? "border-primary bg-secondary font-medium text-primary" : "hover:border-foreground/25",
                        )}
                      >
                        <input type="radio" className="mt-0.5 size-4 shrink-0 accent-[var(--primary)]" name={q.key} value={o.value} checked={checked} onChange={() => setAnswers((a) => ({ ...a, [q.key]: o.value }))} />
                        {o.label}
                      </label>
                    );
                  })}
                </div>
                {missing && <p className="text-[13px] font-medium text-destructive">Elija una opción.</p>}
              </fieldset>
            );
          })}
        </section>
      ))}
      <div className="sticky bottom-0 z-20 -mx-4 flex items-center justify-between gap-3 border-t bg-background/95 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0">
        <span className="text-sm text-muted-foreground tabular-nums">{answered} de {total} respondidas</span>
        <Button size="lg" className="h-11 px-5" disabled={pending} onClick={submit}>
          {pending ? <Loader2 className="animate-spin" /> : <Sparkles />} Ver mi resultado
        </Button>
      </div>
    </div>
  );
}
