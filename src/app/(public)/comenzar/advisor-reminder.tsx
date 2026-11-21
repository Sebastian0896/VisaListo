"use client";

import { UserRound } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { normalizeAdvisorCode } from "@/lib/normalize";

/**
 * Recordatorio al llegar a «Comenzar» sin el enlace de un asesor:
 * pide el código para vincular el expediente desde el inicio, o deja seguir sin él.
 * El código se valida al crear el expediente.
 */
export function AdvisorReminder({ onCode }: { onCode: (code: string) => void }) {
  const [open, setOpen] = useState(true);
  const [code, setCode] = useState("");
  const clean = normalizeAdvisorCode(code);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <DialogHeader>
          <span className="grid size-10 place-items-center rounded-full bg-secondary text-primary">
            <UserRound className="size-5" />
          </span>
          <DialogTitle className="text-lg font-semibold">¿Tiene el código de su asesor?</DialogTitle>
          <DialogDescription className="leading-relaxed">
            Escríbalo para que su expediente quede <strong className="text-foreground">vinculado a su asesor</strong> desde el inicio: así podrá revisarlo, escribirle y atenderle.
          </DialogDescription>
        </DialogHeader>

        <form
          id="advisor-reminder"
          className="space-y-1.5"
          onSubmit={(e) => {
            e.preventDefault();
            if (!clean) return;
            onCode(clean);
            setOpen(false);
          }}
        >
          <Label htmlFor="reminder-code">Código de su asesor</Label>
          <Input
            id="reminder-code"
            autoFocus
            autoComplete="off"
            autoCapitalize="characters"
            maxLength={20}
            placeholder="Ej.: K7M2QX"
            className="h-10 font-mono tracking-wider uppercase"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
        </form>

        <p className="rounded-lg bg-muted px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">
          ¿Aún no lo tiene? Puede continuar sin él y <strong className="text-foreground">vincularlo más adelante</strong> desde su portal. Si su asesor le compartió un enlace, ábralo: el código se coloca solo.
        </p>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Continuar sin código</Button>
          <Button type="submit" form="advisor-reminder" disabled={!clean}>Usar este código</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
