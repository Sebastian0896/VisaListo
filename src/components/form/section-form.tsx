"use client";

import { AlertCircle, ArrowLeft, ArrowRight, Check, CloudOff, Info, Loader2, Lock } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm, useWatch, type FieldValues } from "react-hook-form";
import { toast } from "sonner";
import { saveAnswersAction } from "@/actions/client";
import { buttonVariants } from "@/components/ui/button";
import { Button } from "@/components/ui/button";
import { computeSectionProgress, isAnswered, isVisible, type AnswerMap, type AnswerValue, type ClientSection } from "@/lib/form-types";
import { cn } from "@/lib/utils";
import { validateAnswer } from "@/validation/answers";
import { QuestionField } from "./question-field";

type SaveState = { kind: "idle" } | { kind: "saving" } | { kind: "saved"; at: Date } | { kind: "error"; message: string };

const DEBOUNCE_MS = 1200;

export function SectionForm({
  section,
  initial,
  external,
  canEdit,
  prevHref,
  nextHref,
  isLast,
}: {
  section: ClientSection;
  initial: AnswerMap;
  /** Respuestas de otras secciones de las que dependen condiciones de esta */
  external: AnswerMap;
  canEdit: boolean;
  prevHref: string | null;
  nextHref: string | null;
  isLast: boolean;
}) {
  const router = useRouter();
  const defaults = useMemo(() => {
    const d: Record<string, AnswerValue> = {};
    for (const q of section.questions) d[q.key] = initial[q.key] ?? (q.type === "GROUP" ? [] : "");
    return d;
  }, [section, initial]);

  const form = useForm<FieldValues>({ defaultValues: defaults, mode: "onChange" });
  const values = useWatch({ control: form.control }) as AnswerMap;
  const [save, setSave] = useState<SaveState>({ kind: "idle" });
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
  const [showPending, setShowPending] = useState(false);

  const dirty = useRef(new Set<string>());
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inflight = useRef<Promise<boolean> | null>(null);
  const startedNotified = useRef(false);

  const byKey = useMemo(() => new Map(section.questions.map((q) => [q.key, q] as const)), [section]);
  const merged = useMemo(() => ({ ...external, ...values }), [external, values]);
  const visible = section.questions.filter((q) => isVisible(q, merged, byKey));
  const progress = computeSectionProgress({ questions: visible }, merged);

  // Errores de formato en el cliente (los mismos que valida el servidor)
  const clientErrors = useMemo(() => {
    const errs: Record<string, string> = {};
    for (const q of visible) {
      const v = values[q.key];
      if (v === undefined) continue;
      const e = validateAnswer(q, v);
      if (e) errs[q.key] = e;
    }
    return errs;
  }, [values, visible]);

  const flush = useCallback(async (): Promise<boolean> => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    if (inflight.current) await inflight.current;
    if (!canEdit || dirty.current.size === 0) return true;

    const current = form.getValues() as AnswerMap;
    const payload: Record<string, AnswerValue> = {};
    for (const key of dirty.current) {
      const q = byKey.get(key);
      if (!q) continue;
      const v = current[key];
      // No se envían valores con formato inválido: se guardarán cuando se corrijan
      if (v !== undefined && validateAnswer(q, v)) continue;
      payload[key] = v ?? (q.type === "GROUP" ? [] : "");
    }
    const keys = Object.keys(payload);
    if (keys.length === 0) return true;
    keys.forEach((k) => dirty.current.delete(k));

    setSave({ kind: "saving" });
    const p = (async () => {
      try {
        const res = await saveAnswersAction(section.key, payload);
        if (res.ok) {
          setSave({ kind: "saved", at: new Date(res.savedAt) });
          setServerErrors((prev) => {
            const n = { ...prev };
            keys.forEach((k) => delete n[k]);
            return n;
          });
          if (res.startedNow && !startedNotified.current) {
            startedNotified.current = true;
            toast.info("Comenzó la vigencia de su formulario", { description: "Puede ver el tiempo restante en la parte superior." });
            router.refresh();
          }
          return true;
        }
        if (res.fieldErrors) setServerErrors((prev) => ({ ...prev, ...res.fieldErrors }));
        if (res.locked) {
          setSave({ kind: "error", message: res.error });
          router.refresh();
          return false;
        }
        keys.filter((k) => !res.fieldErrors?.[k]).forEach((k) => dirty.current.add(k));
        setSave({ kind: "error", message: res.error });
        return false;
      } catch {
        keys.forEach((k) => dirty.current.add(k));
        setSave({ kind: "error", message: "Sin conexión. Reintentaremos al seguir escribiendo." });
        return false;
      } finally {
        inflight.current = null;
      }
    })();
    inflight.current = p;
    return p;
  }, [byKey, canEdit, form, router, section.key]);

  // Programa el guardado cada vez que cambia un campo
  useEffect(() => {
    if (!canEdit) return;
    const sub = form.watch((_v, { name }) => {
      if (!name) return;
      dirty.current.add(name.split(".")[0]);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => void flush(), DEBOUNCE_MS);
    });
    return () => sub.unsubscribe();
  }, [canEdit, flush, form]);

  // Guarda al ocultar la pestaña y avisa si se intenta cerrar con cambios pendientes
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === "hidden") void flush();
    };
    const onUnload = (e: BeforeUnloadEvent) => {
      if (dirty.current.size > 0 || inflight.current) {
        void flush();
        e.preventDefault();
      }
    };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("beforeunload", onUnload);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("beforeunload", onUnload);
    };
  }, [flush]);

  const go = async (href: string | null, checkPending: boolean) => {
    const ok = await flush();
    if (!ok && save.kind === "error") {
      toast.error("No se pudieron guardar algunos cambios. Revise los campos marcados.");
      return;
    }
    if (checkPending && progress.totalRequired > progress.answeredRequired) {
      setShowPending(true);
      toast.warning(`Quedan ${progress.totalRequired - progress.answeredRequired} preguntas obligatorias en esta sección`, {
        description: "Puede continuar y completarlas después.",
      });
    }
    if (href) {
      router.push(href);
      router.refresh();
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void go(isLast ? "/portal/revision" : nextHref, true);
      }}
      className="space-y-6"
      noValidate
    >
      {/* Cabecera de la sección */}
      <div className="rounded-2xl border bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-primary">Sección {section.order}</p>
            <h1 className="mt-0.5 text-2xl font-semibold tracking-tight">{section.title}</h1>
            {section.description && <p className="mt-1 text-muted-foreground">{section.description}</p>}
          </div>
          <SaveIndicator state={save} canEdit={canEdit} />
        </div>
        <div className="mt-4 flex items-center gap-3">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress.totalRequired ? (progress.answeredRequired / progress.totalRequired) * 100 : 100}%` }} />
          </div>
          <span className="text-xs text-muted-foreground tabular-nums">{progress.answeredRequired}/{progress.totalRequired} obligatorias</span>
        </div>
        {section.notice && (
          <div className="mt-4 flex gap-2.5 rounded-xl border border-sky-200 bg-sky-50 p-3.5 text-sm leading-relaxed text-sky-950">
            <Info className="mt-0.5 size-4 shrink-0" />
            <p>{section.notice}</p>
          </div>
        )}
        {!canEdit && (
          <div className="mt-4 flex gap-2.5 rounded-xl border bg-muted p-3.5 text-sm">
            <Lock className="mt-0.5 size-4 shrink-0" />
            <p>La edición no está disponible en este momento. Puede consultar sus respuestas.</p>
          </div>
        )}
      </div>

      {/* Preguntas */}
      <div className="space-y-7 rounded-2xl border bg-white p-5 shadow-sm sm:p-6">
        {visible.map((q) => (
          <QuestionField
            key={q.key}
            question={q}
            control={form.control}
            disabled={!canEdit}
            error={clientErrors[q.key] ?? serverErrors[q.key]}
            showRequiredHint={showPending && q.required && !isAnswered(q, merged[q.key])}
          />
        ))}
      </div>

      {/* Navegación */}
      <div className="sticky bottom-0 z-20 -mx-4 border-t bg-background/95 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0">
        <div className="flex items-center justify-between gap-3">
          {prevHref ? (
            <Button type="button" variant="outline" size="lg" className="h-11" onClick={() => void go(prevHref, false)}>
              <ArrowLeft /> Anterior
            </Button>
          ) : (
            <Link href="/portal" className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-11")}>
              <ArrowLeft /> Resumen
            </Link>
          )}
          <Button type="submit" size="lg" className="h-11 px-5">
            {isLast ? "Revisar y enviar" : "Continuar"} <ArrowRight />
          </Button>
        </div>
      </div>
    </form>
  );
}

function SaveIndicator({ state, canEdit }: { state: SaveState; canEdit: boolean }) {
  if (!canEdit) return null;
  const base = "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium";
  switch (state.kind) {
    case "saving":
      return <span className={cn(base, "bg-muted text-muted-foreground")} aria-live="polite"><Loader2 className="size-3.5 animate-spin" /> Guardando…</span>;
    case "saved":
      return (
        <span className={cn(base, "bg-emerald-50 text-emerald-800")} aria-live="polite">
          <Check className="size-3.5" /> Guardado {state.at.toLocaleTimeString("es-DO", { hour: "2-digit", minute: "2-digit" })}
        </span>
      );
    case "error":
      return <span className={cn(base, "bg-rose-50 text-rose-800")} aria-live="assertive" title={state.message}>{state.message.includes("conexión") ? <CloudOff className="size-3.5" /> : <AlertCircle className="size-3.5" />} {state.message.length > 60 ? "No se pudo guardar" : state.message}</span>;
    default:
      return <span className={cn(base, "bg-muted text-muted-foreground")}><Check className="size-3.5" /> Guardado automático activo</span>;
  }
}
