"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, Loader2, LockKeyhole } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { lookupQuestionAction, recoverAction } from "@/actions/client";
import { FieldError } from "@/components/form/primitives";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { recoverSchema } from "@/validation/answers";

type FormIn = z.input<typeof recoverSchema>;
type FormOut = z.output<typeof recoverSchema>;

export function RecoverForm({ expired }: { expired: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [question, setQuestion] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FormIn, unknown, FormOut>({
    resolver: zodResolver(recoverSchema),
    defaultValues: { code: "", surname: "", birthYear: "", securityAnswer: "" },
  });
  const { errors } = form.formState;

  const nextStep = async () => {
    setError(null);
    const valid = await form.trigger("code");
    if (!valid) return;
    startTransition(async () => {
      const res = await lookupQuestionAction(form.getValues("code"));
      if (!res.ok) setError(res.error);
      else setQuestion(res.question);
    });
  };

  const onSubmit = form.handleSubmit((values) => {
    setError(null);
    startTransition(async () => {
      const res = await recoverAction(values);
      if (!res.ok) {
        setError(res.error);
        form.setValue("securityAnswer", "");
        return;
      }
      router.push("/portal");
      router.refresh();
    });
  });

  return (
    <div className="space-y-6">
      <div className="text-center">
        <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-secondary text-primary"><LockKeyhole className="size-6" /></span>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight">Recuperar mi formulario</h1>
        <p className="mt-1 text-sm text-muted-foreground">Ingrese su código de expediente y sus datos de verificación.</p>
      </div>

      {expired && !error && (
        <Alert><AlertDescription>Su sesión terminó por seguridad. Ingrese nuevamente para continuar.</AlertDescription></Alert>
      )}
      {error && (
        <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>
      )}

      <form
        onSubmit={(e) => {
          if (!question) {
            e.preventDefault();
            void nextStep();
            return;
          }
          void onSubmit(e);
        }}
        className="space-y-4 rounded-2xl border bg-card p-5 shadow-sm sm:p-6"
        noValidate
      >
        <div className="space-y-1.5">
          <Label htmlFor="code">Código de expediente</Label>
          <Input
            id="code"
            autoComplete="off"
            autoCapitalize="characters"
            placeholder="DS-XXXX-XXXX-XXXX"
            className="h-11 bg-card font-mono text-base tracking-wider uppercase"
            readOnly={!!question}
            aria-invalid={!!errors.code}
            {...form.register("code")}
          />
          <FieldError message={errors.code?.message} />
        </div>

        {question && (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="surname">Primer apellido</Label>
                <Input id="surname" autoComplete="family-name" className="h-10 bg-card" aria-invalid={!!errors.surname} {...form.register("surname")} />
                <FieldError message={errors.surname?.message} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="birthYear">Año de nacimiento</Label>
                <Input id="birthYear" inputMode="numeric" maxLength={4} className="h-10 bg-card" aria-invalid={!!errors.birthYear} {...form.register("birthYear")} />
                <FieldError message={errors.birthYear?.message} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="securityAnswer">{question}</Label>
              <Input id="securityAnswer" autoComplete="off" className="h-10 bg-card" aria-invalid={!!errors.securityAnswer} {...form.register("securityAnswer")} />
              <FieldError message={errors.securityAnswer?.message} />
            </div>
          </>
        )}

        <div className="flex gap-2 pt-1">
          {question && (
            <Button type="button" variant="outline" size="lg" className="h-11" onClick={() => { setQuestion(null); setError(null); }}>
              <ArrowLeft /> Cambiar código
            </Button>
          )}
          <Button type="submit" size="lg" className="h-11 flex-1 text-[15px]" disabled={pending}>
            {pending ? <Loader2 className="animate-spin" /> : null}
            {question ? "Ingresar a mi formulario" : "Continuar"} {!pending && <ArrowRight />}
          </Button>
        </div>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        ¿Aún no tiene expediente? <Link href="/comenzar" className="font-medium text-primary hover:underline">Comience aquí</Link>
      </p>
      <p className="text-center text-xs text-muted-foreground">
        Si olvidó su código o su respuesta de seguridad, comuníquese con su asesor. Por seguridad, no podemos indicarle qué dato es incorrecto.
      </p>
    </div>
  );
}
