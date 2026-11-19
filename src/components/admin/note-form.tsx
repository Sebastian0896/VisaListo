"use client";

import { Loader2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { addNoteAction } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function NoteForm({ fileId }: { fileId: string }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [pending, startTransition] = useTransition();
  return (
    <form
      className="space-y-2"
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          const res = await addNoteAction(fileId, text);
          if (!res.ok) return void toast.error(res.error);
          setText("");
          router.refresh();
        });
      }}
    >
      <Textarea rows={3} value={text} onChange={(e) => setText(e.target.value)} placeholder="Observaciones, dudas para consultar, pendientes…" className="bg-card" aria-label="Nueva nota interna" />
      <Button type="submit" size="sm" variant="outline" disabled={pending || text.trim().length < 2}>
        {pending ? <Loader2 className="animate-spin" /> : <Plus />} Agregar nota
      </Button>
    </form>
  );
}
