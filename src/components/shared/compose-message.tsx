"use client";

import { Loader2, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function ComposeMessage({
  send,
  placeholder = "Escriba su mensaje…",
}: {
  send: (input: { message: string }) => Promise<{ ok: true } | { ok: false; error: string }>;
  placeholder?: string;
}) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [pending, startTransition] = useTransition();
  return (
    <form
      className="space-y-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (text.trim().length < 2) return;
        startTransition(async () => {
          const res = await send({ message: text });
          if (!res.ok) {
            toast.error(res.error);
            return;
          }
          setText("");
          toast.success("Mensaje enviado");
          router.refresh();
        });
      }}
    >
      <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} maxLength={2000} placeholder={placeholder} className="bg-white" aria-label="Mensaje" />
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{text.length}/2000</span>
        <Button type="submit" disabled={pending || text.trim().length < 2}>
          {pending ? <Loader2 className="animate-spin" /> : <Send />} Enviar
        </Button>
      </div>
    </form>
  );
}
