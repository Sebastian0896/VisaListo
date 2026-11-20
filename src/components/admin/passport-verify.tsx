"use client";

import { BadgeCheck, Loader2, Undo2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { setPassportVerifiedAction } from "@/actions/admin";
import { Button } from "@/components/ui/button";

export function PassportVerifyButton({ fileId, verified, verifiedLabel, hasPassport }: { fileId: string; verified: boolean; verifiedLabel: string | null; hasPassport: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const run = (value: boolean) =>
    startTransition(async () => {
      const res = await setPassportVerifiedAction(fileId, value);
      if (!res.ok) return void toast.error(res.error);
      toast.success(value ? "Datos marcados como verificados" : "Verificación retirada");
      router.refresh();
    });

  if (verified) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
        <span className="flex items-center gap-2 font-medium"><BadgeCheck className="size-5" /> {verifiedLabel}</span>
        <Button variant="ghost" size="sm" disabled={pending} onClick={() => run(false)}>
          {pending ? <Loader2 className="animate-spin" /> : <Undo2 />} Retirar
        </Button>
      </div>
    );
  }
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-muted/40 px-4 py-3 text-sm">
      <span className="text-muted-foreground">
        {hasPassport ? "Compare cada dato con la imagen. Si algo no coincide, solicite correcciones." : "El cliente aún no ha subido la foto del pasaporte."}
      </span>
      <Button size="sm" disabled={pending || !hasPassport} onClick={() => run(true)}>
        {pending ? <Loader2 className="animate-spin" /> : <BadgeCheck />} Datos verificados contra el pasaporte
      </Button>
    </div>
  );
}
