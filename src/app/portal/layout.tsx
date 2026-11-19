import { FileText, Home, LogOut, MessageSquare, Printer } from "lucide-react";
import Link from "next/link";
import { logoutClientAction } from "@/actions/client";
import { ExpiryCountdown } from "@/components/portal/expiry-countdown";
import { Brand } from "@/components/shared/brand";
import { DisclaimerBar } from "@/components/shared/disclaimer";
import { StatusBadge } from "@/components/shared/status-badge";
import { WhatsAppFloat } from "@/components/shared/whatsapp-button";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/shared/theme";
import { getPortalData } from "@/server/portal";

export const dynamic = "force-dynamic";

export default async function PortalLayout({ children }: LayoutProps<"/portal">) {
  const { file, settings, unread, sections, contact } = await getPortalData();
  const firstSection = sections[0]?.key ?? "";
  const nav = [
    { href: "/portal", label: "Resumen", icon: Home },
    { href: `/portal/formulario/${firstSection}`, label: "Formulario", icon: FileText },
    { href: "/portal/mensajes", label: "Mensajes", icon: MessageSquare, badge: unread },
    { href: "/portal/imprimir", label: "Imprimir", icon: Printer },
  ];
  return (
    <>
      <DisclaimerBar className="no-print" />
      <header className="no-print sticky top-0 z-30 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3">
          <Brand name={settings.platformName} logoUrl={settings.logoUrl} href="/portal" />
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="font-mono text-xs font-medium tracking-wider text-muted-foreground">{file.uniqueCode}</p>
              <ExpiryCountdown paused={["SUBMITTED", "IN_REVIEW", "REVIEWED"].includes(file.status)} expiresAt={file.expiresAt?.toISOString() ?? null} warningDays={settings.expiryWarningDays} compact />
            </div>
            <ThemeToggle />
            <StatusBadge status={file.status} />
            <form action={logoutClientAction}>
              <Button type="submit" variant="ghost" size="sm" aria-label="Salir">
                <LogOut /> <span className="hidden sm:inline">Salir</span>
              </Button>
            </form>
          </div>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-3 pb-2" aria-label="Portal">
          {nav.map((n) => (
            <Link key={n.label} href={n.href} className="relative inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm whitespace-nowrap text-muted-foreground transition hover:bg-secondary hover:text-foreground">
              <n.icon className="size-4" /> {n.label}
              {!!n.badge && <span className="ml-0.5 rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground">{n.badge}</span>}
            </Link>
          ))}
        </nav>
      </header>
      <main className="flex-1">{children}</main>
      <WhatsAppFloat href={contact.whatsappHref} label={contact.isAdvisorNumber && contact.advisorName ? `Hablar con ${contact.advisorName.split(" ")[0].charAt(0)}${contact.advisorName.split(" ")[0].slice(1).toLowerCase()}` : undefined} />
    </>
  );
}
