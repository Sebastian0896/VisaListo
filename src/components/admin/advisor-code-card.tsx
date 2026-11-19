"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { WhatsAppIcon } from "@/components/shared/whatsapp-button";
import { Button } from "@/components/ui/button";

/** Código y enlace del asesor, listos para copiar o compartir con clientes. */
export function AdvisorCodeCard({ code, link }: { code: string; link: string }) {
  const [copied, setCopied] = useState<"code" | "link" | null>(null);
  const copy = async (value: string, what: "code" | "link") => {
    await navigator.clipboard.writeText(value);
    setCopied(what);
    toast.success(what === "code" ? "Código copiado" : "Enlace copiado");
    setTimeout(() => setCopied(null), 2000);
  };
  const shareText = `Para preparar su formulario de visa conmigo, comience aquí: ${link}\nSi se lo piden, mi código de asesor es: ${code}`;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className="rounded-xl border-2 border-primary/20 bg-secondary px-4 py-2 font-mono text-2xl font-semibold tracking-[0.18em] text-primary">{code}</span>
        <Button variant="outline" size="sm" onClick={() => copy(code, "code")}>
          {copied === "code" ? <Check /> : <Copy />} Copiar código
        </Button>
      </div>
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-muted-foreground">Enlace para sus clientes (el código se llena solo)</p>
        <div className="flex flex-wrap items-center gap-2">
          <code className="min-w-0 flex-1 truncate rounded-lg border bg-muted/40 px-3 py-2 text-sm">{link}</code>
          <Button variant="outline" size="sm" onClick={() => copy(link, "link")}>
            {copied === "link" ? <Check /> : <Copy />} Copiar enlace
          </Button>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-7 items-center gap-1.5 rounded-lg border px-2.5 text-[0.8rem] font-medium transition hover:bg-muted"
          >
            <WhatsAppIcon className="size-3.5 text-[#1f9d55]" /> Compartir
          </a>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Los clientes que comiencen con su enlace o escriban su código quedarán asignados a usted. Solo usted y los administradores verán esos expedientes.
      </p>
    </div>
  );
}
