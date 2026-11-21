"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Check, Copy, KeyRound, Loader2, Printer, ShieldCheck, UserRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";
import { createFileAction } from "@/actions/client";
import { FieldError, NativeSelect } from "@/components/form/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createFileSchema } from "@/validation/answers";
import { AdvisorReminder } from "./advisor-reminder";

type FormIn = z.input<typeof createFileSchema>;
type FormOut = z.output<typeof createFileSchema>;

export function StartWizard({
  questions,
  welcome,
  validityDays,
  hasSession,
  initialAdvisor,
}: {
  questions: { id: string; text: string }[];
  welcome: string;
  validityDays: number;
  hasSession: boolean;
  initialAdvisor: { code: string; name: string } | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ code: string; question: string; advisorName: string | null } | null>(null);
  const [copied, setCopied] = useState(false);
  const [confirmedSaved, setConfirmedSaved] = useState(false);

  const form = useForm<FormIn, unknown, FormOut>({
    resolver: zodResolver(createFileSchema),
    defaultValues: { surname: "", birthYear: "", securityQuestionId: "", securityAnswer: "", securityAnswerConfirm: "", advisorCode: initialAdvisor?.code ?? "", acceptPrivacy: false as unknown as true },
  });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const res = await createFileAction(values);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      setResult({ code: res.code, question: res.question, advisorName: res.advisorName });
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });

  if (result) {
    return (
      <div className="space-y-6">
        <div className="no-print text-center">
          <span className="mx-auto grid size-12 place-items-center rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"><Check className="size-6" /></span>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight">Su expediente fue creado</h1>
          <p className="mt-1 text-muted-foreground">Guarde este código. Lo necesitará para volver a entrar.</p>
        </div>

        <div className="print-page rounded-2xl border-2 border-primary/15 bg-card p-6 text-center shadow-sm">
          <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Código de expediente</p>
          <p className="mt-2 font-mono text-3xl font-semibold tracking-[0.12em] text-primary select-all sm:text-4xl">{result.code}</p>
          <div className="mt-4 rounded-xl bg-muted p-3 text-left text-sm">
            <p className="text-muted-foreground">Su pregunta de seguridad:</p>
            <p className="font-medium">{result.question}</p>
          </div>
          {result.advisorName && (
            <p className="mt-3 text-left text-sm">
              <span className="text-muted-foreground">Su asesor: </span>
              <span className="font-medium">{result.advisorName}</span>
            </p>
          )}
          {!result.advisorName && (
            <p className="no-print mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-left text-sm text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100">
              Su expediente aún no tiene asesor. Cuando tenga el código, vincúlelo desde su portal.
            </p>
          )}
          <p className="mt-4 text-left text-xs leading-relaxed text-muted-foreground">
            Para recuperar su formulario necesitará: este código, su primer apellido, su año de nacimiento y la respuesta a su
            pregunta de seguridad. Documento privado de preparación. No es el formulario DS-160 oficial.
          </p>
          <div className="no-print mt-5 flex flex-col justify-center gap-2 sm:flex-row">
            <Button
              variant="outline"
              size="lg"
              onClick={async () => {
                await navigator.clipboard.writeText(result.code);
                setCopied(true);
                toast.success("Código copiado");
              }}
            >
              {copied ? <Check /> : <Copy />} {copied ? "Copiado" : "Copiar código"}
            </Button>
            <Button variant="outline" size="lg" onClick={() => window.print()}>
              <Printer /> Imprimir
            </Button>
          </div>
        </div>

        <div className="no-print space-y-4 rounded-2xl border bg-card p-5">
          <h2 className="font-semibold">Antes de comenzar</h2>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Tenga a mano su pasaporte y datos de empleo, estudios y familia.</li>
            <li>• Sus respuestas se guardan automáticamente mientras escribe.</li>
            <li>• Tendrá <strong className="text-foreground">{validityDays} días</strong> para completar el formulario, contados desde que guarde su primera respuesta.</li>
            <li>• Cada pregunta tiene un ícono de ayuda con explicaciones y ejemplos.</li>
          </ul>
          <label className="flex items-start gap-3 rounded-lg border bg-muted/40 p-3 text-sm">
            <input type="checkbox" className="mt-0.5 size-4 accent-[var(--primary)]" checked={confirmedSaved} onChange={(e) => setConfirmedSaved(e.target.checked)} />
            <span>He guardado mi código de expediente y recuerdo la respuesta a mi pregunta de seguridad.</span>
          </label>
          <Button size="lg" className="h-11 w-full text-[15px]" disabled={!confirmedSaved} onClick={() => router.push("/portal")}>
            Ir a mi formulario <ArrowRight />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <span className="inline-flex items-center gap-2 text-sm font-medium text-primary"><KeyRound className="size-4" /> Nuevo expediente</span>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Comenzar formulario</h1>
        <p className="mt-2 text-muted-foreground">{welcome}</p>
      </div>

      {hasSession && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-950">
          <span>Ya tiene un expediente abierto en este navegador.</span>
          <Link href="/portal" className="font-medium text-primary underline underline-offset-2">Ir a mi expediente</Link>
        </div>
      )}

      {!initialAdvisor && !hasSession && <AdvisorReminder onCode={(code) => form.setValue("advisorCode", code, { shouldDirty: true })} />}

      <form onSubmit={onSubmit} className="space-y-6 rounded-2xl border bg-card p-5 shadow-sm sm:p-6" noValidate>
        <fieldset className="space-y-4">
          <legend className="mb-1 font-semibold">Datos de verificación</legend>
          <p className="-mt-1 text-sm text-muted-foreground">Junto con su código, se usarán para confirmar su identidad cuando regrese.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="surname">Primer apellido</Label>
              <Input id="surname" autoComplete="family-name" placeholder="Ej.: Rodríguez" className="h-10" aria-invalid={!!errors.surname} {...form.register("surname")} />
              <FieldError message={errors.surname?.message} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="birthYear">Año de nacimiento</Label>
              <Input id="birthYear" inputMode="numeric" maxLength={4} placeholder="Ej.: 1988" className="h-10" aria-invalid={!!errors.birthYear} {...form.register("birthYear")} />
              <FieldError message={errors.birthYear?.message} />
            </div>
          </div>
        </fieldset>

        <fieldset className="space-y-4 border-t pt-5">
          <legend className="mb-1 flex items-center gap-2 font-semibold"><ShieldCheck className="size-4 text-primary" /> Pregunta de seguridad</legend>
          <div className="space-y-1.5">
            <Label htmlFor="securityQuestionId">Elija una pregunta</Label>
            <NativeSelect id="securityQuestionId" aria-invalid={!!errors.securityQuestionId} {...form.register("securityQuestionId")}>
              <option value="">Seleccione…</option>
              {questions.map((q) => <option key={q.id} value={q.id}>{q.text}</option>)}
            </NativeSelect>
            <FieldError message={errors.securityQuestionId?.message} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="securityAnswer">Respuesta</Label>
              <Input id="securityAnswer" autoComplete="off" className="h-10" aria-invalid={!!errors.securityAnswer} {...form.register("securityAnswer")} />
              <FieldError message={errors.securityAnswer?.message} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="securityAnswerConfirm">Repita la respuesta</Label>
              <Input id="securityAnswerConfirm" autoComplete="off" className="h-10" aria-invalid={!!errors.securityAnswerConfirm} {...form.register("securityAnswerConfirm")} />
              <FieldError message={errors.securityAnswerConfirm?.message} />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">No distingue mayúsculas ni tildes. Elija una respuesta que recuerde con facilidad y que otros no conozcan.</p>
        </fieldset>

        <fieldset className="space-y-2 border-t pt-5">
          <legend className="mb-1 flex items-center gap-2 font-semibold"><UserRound className="size-4 text-primary" /> Su asesor (opcional)</legend>
          {initialAdvisor ? (
            <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-900">
              Su expediente quedará vinculado a <strong>{initialAdvisor.name}</strong> (código {initialAdvisor.code}).
            </p>
          ) : (
            <>
              <Label htmlFor="advisorCode">Código de su asesor</Label>
              <Input id="advisorCode" autoComplete="off" autoCapitalize="characters" maxLength={20} placeholder="Ej.: K7M2QX" className="h-10 font-mono tracking-wider uppercase sm:max-w-xs" aria-invalid={!!errors.advisorCode} {...form.register("advisorCode")} />
              <FieldError message={errors.advisorCode?.message} />
              <p className="text-xs text-muted-foreground">Si un asesor le dio un código, escríbalo para que él reciba su expediente. Si no tiene, déjelo vacío.</p>
            </>
          )}
        </fieldset>

        <div className="space-y-2 border-t pt-5">
          <label className="flex items-start gap-3 text-sm">
            <input type="checkbox" className="mt-0.5 size-4 accent-[var(--primary)]" {...form.register("acceptPrivacy")} />
            <span>
              He leído y acepto la{" "}
              <Link href="/privacidad" target="_blank" className="font-medium text-primary underline underline-offset-2">política de privacidad</Link>. Entiendo que esta
              es una plataforma privada de preparación y no el formulario oficial del Gobierno de los Estados Unidos.
            </span>
          </label>
          <FieldError message={errors.acceptPrivacy?.message} />
        </div>

        <Button type="submit" size="lg" className="h-11 w-full text-[15px]" disabled={pending}>
          {pending ? <Loader2 className="animate-spin" /> : <KeyRound />} Crear expediente y obtener código
        </Button>
      </form>
    </div>
  );
}
