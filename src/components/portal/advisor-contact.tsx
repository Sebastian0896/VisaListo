import { Clock, MessageSquare, Phone, UserRound } from "lucide-react";
import Link from "next/link";
import { WhatsAppIcon } from "@/components/shared/whatsapp-button";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PortalContact } from "@/server/portal";
import { LinkAdvisorForm } from "./link-advisor";

/** Tarjeta de contacto del portal: el asesor vinculado (o la oficina) y sus vías de contacto. */
export function AdvisorContactCard({ contact, unread }: { contact: PortalContact; unread: number }) {
  const firstName = contact.advisorName?.split(" ")[0];
  const label = contact.isAdvisorNumber && firstName ? `Escribir a ${capitalize(firstName)}` : "Escribir a la oficina";
  return (
    <div className="rounded-2xl border bg-card p-5 shadow-sm">
      <h2 className="text-sm font-semibold">{contact.advisorName ? "Su asesor" : "Contacto"}</h2>

      {contact.advisorName ? (
        <div className="mt-3 flex items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-secondary text-sm font-semibold text-primary">{initials(contact.advisorName)}</span>
          <div className="min-w-0">
            <p className="truncate font-medium">{contact.advisorName}</p>
            {contact.isAdvisorNumber && contact.phoneDisplay && <p className="text-xs text-muted-foreground">{contact.phoneDisplay}</p>}
          </div>
        </div>
      ) : (
        <>
          <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground"><UserRound className="size-4" /> Aún no tiene un asesor asignado.</p>
          <LinkAdvisorForm />
        </>
      )}

      {contact.hours && (
        <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground"><Clock className="size-3.5" /> {contact.hours}</p>
      )}

      <div className="mt-4 grid gap-2">
        {contact.whatsappHref && (
          <a href={contact.whatsappHref} target="_blank" rel="noopener noreferrer" className={cn(buttonVariants(), "justify-start bg-[#1f9d55] text-white hover:bg-[#188a49]")}>
            <WhatsAppIcon className="size-4" /> {label}
          </a>
        )}
        {contact.isAdvisorNumber && contact.telHref && (
          <a href={contact.telHref} className={cn(buttonVariants({ variant: "outline" }), "justify-start")}>
            <Phone /> Llamar
          </a>
        )}
        <Link href="/portal/mensajes" className={cn(buttonVariants({ variant: "outline" }), "justify-between")}>
          <span className="flex items-center gap-2"><MessageSquare /> Mensajes en la plataforma</span>
          {unread > 0 && <span className="rounded-full bg-primary px-2 text-xs font-semibold text-primary-foreground">{unread}</span>}
        </Link>
      </div>
      {contact.whatsappHref && (
        <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">El mensaje de WhatsApp incluye su código de expediente para que puedan ubicarlo.</p>
      )}
    </div>
  );
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]!.toUpperCase()).join("");
}

function capitalize(word: string) {
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}
