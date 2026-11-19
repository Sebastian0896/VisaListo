"use client";

import { Link2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { linkAdvisorAction } from "@/actions/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/** Permite al cliente vincular su expediente a un asesor si no lo hizo al comenzar. */
export function LinkAdvisorForm() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [pending, startTransition] = useTransition();
  return (
    <form
      className="mt-3 space-y-2"
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          const res = await linkAdvisorAction({ code });
          if (!res.ok) return void toast.error(res.error);
          toast.success(`Expediente vinculado a ${res.advisorName}`);
          setCode("");
          router.refresh();
        });
      }}
    >
      <p className="text-xs text-muted-foreground">¿Un asesor le dio un código? Escríbalo para que reciba su expediente.</p>
      <div className="flex gap-2">
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          maxLength={20}
          placeholder="Ej.: K7M2QX"
          aria-label="Código de su asesor"
          className="h-9 bg-card font-mono tracking-wider uppercase"
        />
        <Button type="submit" size="sm" className="h-9" disabled={pending || code.trim().length < 4}>
          {pending ? <Loader2 className="animate-spin" /> : <Link2 />} Vincular
        </Button>
      </div>
    </form>
  );
}
