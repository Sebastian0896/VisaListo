"use client";

import { Loader2, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { submitFileAction } from "@/actions/client";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { FileStatus } from "@/generated/prisma/enums";
import { STATUS_DESCRIPTIONS } from "@/lib/status";

export function SubmitPanel({ canSubmit, canEdit, status, pendingCount }: { canSubmit: boolean; canEdit: boolean; status: FileStatus; pendingCount: number }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [declaration, setDeclaration] = useState(false);
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  if (!canEdit) {
    return <div className="rounded-2xl border bg-muted p-5 text-sm">{STATUS_DESCRIPTIONS[status]}</div>;
  }

  const submit = () =>
    startTransition(async () => {
      const res = await submitFileAction({ message, declaration });
      if (!res.ok) {
        toast.error(res.error);
        setOpen(false);
        return;
      }
      toast.success("Formulario enviado a su asesor");
      setOpen(false);
      router.push("/portal");
      router.refresh();
    });

  return (
    <div className="space-y-5 rounded-2xl border-2 border-primary/15 bg-card p-5 shadow-sm sm:p-6">
      <h2 className="text-lg font-semibold">Enviar a su asesor</h2>
      {!canSubmit && (
        <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-950">
          {status === "PENDING_START"
            ? "Aún no ha comenzado a completar el formulario."
            : `Complete las ${pendingCount} pregunta(s) obligatoria(s) pendiente(s) para poder enviar.`}
        </p>
      )}
      <div className="space-y-1.5">
        <Label htmlFor="advisor-message">Mensaje para su asesor (opcional)</Label>
        <Textarea
          id="advisor-message"
          rows={4}
          maxLength={2000}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Ej.: Tengo algunas dudas sobre la información laboral que proporcioné. Me gustaría que la revisara antes de continuar."
          className="bg-card"
        />
        <p className="text-xs text-muted-foreground">Su asesor lo verá junto con el formulario y podrá responderle en «Mensajes».</p>
      </div>
      <label className="flex items-start gap-3 rounded-lg border bg-muted/40 p-3.5 text-sm leading-relaxed">
        <input type="checkbox" className="mt-0.5 size-4 accent-[var(--primary)]" checked={declaration} onChange={(e) => setDeclaration(e.target.checked)} />
        <span>
          Declaro que la información proporcionada es correcta y completa según mi conocimiento. Entiendo que este es un
          formulario privado de preparación y que no constituye una solicitud presentada al Gobierno de los Estados Unidos.
        </span>
      </label>
      <Button size="lg" className="h-11 w-full text-[15px] sm:w-auto sm:px-6" disabled={!canSubmit || !declaration} onClick={() => setOpen(true)}>
        <Send /> Confirmar y enviar formulario
      </Button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Enviar el formulario a su asesor?</AlertDialogTitle>
            <AlertDialogDescription>
              Después de enviarlo no podrá modificar sus respuestas mientras su asesor lo revisa. Si se necesitan cambios, su asesor
              habilitará nuevamente la edición.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Volver</AlertDialogCancel>
            <Button onClick={submit} disabled={pending}>
              {pending ? <Loader2 className="animate-spin" /> : <Send />} Sí, enviar
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
