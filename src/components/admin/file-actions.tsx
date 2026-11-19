"use client";

import { CalendarPlus, CheckCheck, ChevronDown, Download, Loader2, PencilLine, Printer, RotateCcw, ScanSearch } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { changeStatusAction, extendValidityAction, markReviewedAction, reopenAction, requestCorrectionsAction } from "@/actions/admin";
import { Button, buttonVariants } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { FileStatus } from "@/generated/prisma/enums";
import { ADMIN_TRANSITIONS, STATUS_LABELS } from "@/lib/status";

type DialogKind = "corrections" | "reviewed" | "reopen" | "extend" | null;

export function FileActions({ fileId, status, started, validityDays }: { fileId: string; status: FileStatus; started: boolean; validityDays: number }) {
  const router = useRouter();
  const [dialog, setDialog] = useState<DialogKind>(null);
  const [text, setText] = useState("");
  const [days, setDays] = useState(String(validityDays));
  const [pending, startTransition] = useTransition();
  const allowed = ADMIN_TRANSITIONS[status];

  const run = (fn: () => Promise<{ ok: true } | { ok: false; error: string }>, success: string) =>
    startTransition(async () => {
      const res = await fn();
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(success);
      setDialog(null);
      setText("");
      router.refresh();
    });

  const open = (k: DialogKind) => {
    setText("");
    setDays(String(validityDays));
    setDialog(k);
  };

  return (
    <div className="no-print flex flex-wrap gap-2">
      {allowed.includes("IN_REVIEW") && (
        <Button variant="outline" disabled={pending} onClick={() => run(() => changeStatusAction(fileId, "IN_REVIEW"), "Expediente marcado «En revisión»")}>
          <ScanSearch /> Revisar
        </Button>
      )}
      {allowed.includes("REVIEWED") && (
        <Button onClick={() => open("reviewed")}>
          <CheckCheck /> Marcar como revisado
        </Button>
      )}
      {allowed.includes("NEEDS_CORRECTIONS") && (
        <Button variant="outline" onClick={() => open("corrections")}>
          <PencilLine /> Solicitar correcciones
        </Button>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger className={buttonVariants({ variant: "outline" })}>
          Más acciones <ChevronDown />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {allowed.includes("REOPENED") && (
            <DropdownMenuItem onClick={() => open("reopen")}><RotateCcw /> Reabrir expediente</DropdownMenuItem>
          )}
          {started && <DropdownMenuItem onClick={() => open("extend")}><CalendarPlus /> Extender vigencia</DropdownMenuItem>}
          <DropdownMenuItem onClick={() => window.open(`/api/pdf/admin/${fileId}`, "_blank")}><Download /> Descargar PDF (cliente)</DropdownMenuItem>
          <DropdownMenuItem onClick={() => window.open(`/api/pdf/admin/${fileId}?interno=1`, "_blank")}><Download /> PDF administrativo (con notas)</DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push(`/admin/expedientes/${fileId}/imprimir`)}><Printer /> Imprimir</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Solicitar correcciones */}
      <Dialog open={dialog === "corrections"} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Solicitar correcciones</DialogTitle>
            <DialogDescription>El cliente verá estas indicaciones en su portal y podrá editar el formulario para volver a enviarlo.</DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="corr">Qué debe corregir</Label>
            <Textarea id="corr" rows={5} value={text} onChange={(e) => setText(e.target.value)} placeholder="Ej.: En «Ocupación», indique la fecha exacta de inicio en su empleo actual y el teléfono de la empresa." />
          </div>
          <DialogFooter>
            <Button disabled={pending || text.trim().length < 5} onClick={() => run(() => requestCorrectionsAction(fileId, text), "Correcciones solicitadas")}>
              {pending && <Loader2 className="animate-spin" />} Enviar solicitud
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revisado */}
      <Dialog open={dialog === "reviewed"} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Marcar como revisado</DialogTitle>
            <DialogDescription>Indica que terminó la revisión de la información. Puede dejar un comentario interno de la revisión.</DialogDescription>
          </DialogHeader>
          <Textarea rows={3} value={text} onChange={(e) => setText(e.target.value)} placeholder="Comentario de la revisión (opcional, no lo ve el cliente)" />
          <DialogFooter>
            <Button disabled={pending} onClick={() => run(() => markReviewedAction(fileId, text), "Expediente revisado")}>
              {pending && <Loader2 className="animate-spin" />} Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reabrir */}
      <Dialog open={dialog === "reopen"} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reabrir expediente</DialogTitle>
            <DialogDescription>
              El cliente podrá editar nuevamente su formulario. Si la vigencia ya terminó, se otorgará un nuevo período desde hoy. Estado actual: {STATUS_LABELS[status]}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="rdays">Días de vigencia (si está vencido)</Label>
            <Input id="rdays" type="number" min={1} max={365} value={days} onChange={(e) => setDays(e.target.value)} className="w-32" />
          </div>
          <DialogFooter>
            <Button disabled={pending} onClick={() => run(() => reopenAction(fileId, Number(days)), "Expediente reabierto")}>
              {pending && <Loader2 className="animate-spin" />} Reabrir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Extender */}
      <Dialog open={dialog === "extend"} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Extender vigencia</DialogTitle>
            <DialogDescription>Se suman días a la fecha de vencimiento actual (o desde hoy si ya venció). Un expediente vencido sin enviar vuelve a «En proceso».</DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="edays">Días adicionales</Label>
            <Input id="edays" type="number" min={1} max={365} value={days} onChange={(e) => setDays(e.target.value)} className="w-32" />
          </div>
          <DialogFooter>
            <Button disabled={pending} onClick={() => run(() => extendValidityAction(fileId, Number(days)), "Vigencia extendida")}>
              {pending && <Loader2 className="animate-spin" />} Extender
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
