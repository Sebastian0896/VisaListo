import type { Metadata } from "next";
import { sendClientMessageAction } from "@/actions/client";
import { ComposeMessage } from "@/components/shared/compose-message";
import { MessageThread } from "@/components/shared/message-thread";
import { WhatsAppIcon } from "@/components/shared/whatsapp-button";
import { buttonVariants } from "@/components/ui/button";
import { db } from "@/lib/db";
import { whatsappLink } from "@/lib/settings";
import { getPortalData } from "@/server/portal";

export const metadata: Metadata = { title: "Mensajes" };

export default async function ClientMessagesPage() {
  const { file, settings } = await getPortalData();
  const messages = await db.message.findMany({ where: { applicationFileId: file.id }, orderBy: { createdAt: "asc" } });
  // Al abrir la conversación, los mensajes del asesor quedan como leídos
  await db.message.updateMany({ where: { applicationFileId: file.id, senderType: "ADMIN", readAt: null }, data: { readAt: new Date() } });
  const wa = whatsappLink(settings.whatsappNumber, settings.whatsappMessage, file.uniqueCode);

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Mensajes con su asesor</h1>
          <p className="mt-1 text-sm text-muted-foreground">Consultas sobre su expediente {file.uniqueCode}.</p>
        </div>
        {wa && (
          <a href={wa} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: "outline" })}>
            <WhatsAppIcon className="size-4 text-[#1f9d55]" /> WhatsApp
          </a>
        )}
      </div>
      <div className="rounded-2xl border bg-muted/30 p-4 sm:p-6">
        <MessageThread messages={messages} viewer="CLIENT" />
      </div>
      <div className="rounded-2xl border bg-card p-4 shadow-sm sm:p-5">
        <ComposeMessage send={sendClientMessageAction} placeholder="Escriba su consulta para el asesor…" />
      </div>
    </div>
  );
}
