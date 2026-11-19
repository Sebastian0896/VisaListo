import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export type ThreadMessage = {
  id: string;
  senderType: "CLIENT" | "ADMIN";
  message: string;
  createdAt: Date;
  readAt: Date | null;
  isSubmissionNote: boolean;
  authorName?: string | null;
};

/** Conversación cliente ↔ asesor. `viewer` define qué lado aparece a la derecha. */
export function MessageThread({ messages, viewer }: { messages: ThreadMessage[]; viewer: "CLIENT" | "ADMIN" }) {
  if (!messages.length) {
    return <p className="py-10 text-center text-sm text-muted-foreground">Aún no hay mensajes en esta conversación.</p>;
  }
  return (
    <ol className="space-y-4">
      {messages.map((m) => {
        const mine = m.senderType === viewer;
        const who = m.senderType === "ADMIN" ? (viewer === "ADMIN" ? m.authorName || "Asesor" : "Su asesor") : viewer === "CLIENT" ? "Usted" : "Solicitante";
        return (
          <li key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
            <div className={cn("max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm sm:max-w-[75%]", mine ? "rounded-br-md bg-primary text-primary-foreground" : "rounded-bl-md border bg-card")}>
              <div className={cn("mb-1 flex flex-wrap items-center gap-x-2 text-xs", mine ? "text-primary-foreground/70" : "text-muted-foreground")}>
                <span className="font-semibold">{who}</span>
                <span>{formatDateTime(m.createdAt)}</span>
                {m.isSubmissionNote && <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase", mine ? "bg-primary-foreground/15" : "bg-secondary text-primary")}>Al enviar el formulario</span>}
              </div>
              <p className="leading-relaxed whitespace-pre-line">{m.message}</p>
              {mine && <p className={cn("mt-1 text-right text-[10px]", "text-primary-foreground/60")}>{m.readAt ? "Leído" : "Enviado"}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
