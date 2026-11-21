import Link from "next/link";
import { Brand } from "@/components/shared/brand";
import { DisclaimerBar, DISCLAIMER_SHORT } from "@/components/shared/disclaimer";
import { WhatsAppFloat } from "@/components/shared/whatsapp-button";
import { buttonVariants } from "@/components/ui/button";
import { getSettings, whatsappLink } from "@/lib/settings";
import { ThemeToggle } from "@/components/shared/theme";
import { cn } from "@/lib/utils";

export default async function PublicLayout({ children }: LayoutProps<"/">) {
  const s = await getSettings();
  const wa = whatsappLink(s.whatsappNumber, s.whatsappMessage.replace(/\s*Mi código de expediente es: \{codigo\}/, ""), null);
  return (
    <>
      <DisclaimerBar />
      <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
          <Brand name={s.platformName} logoUrl={s.logoUrl} />
          <nav className="hidden items-center gap-1 text-sm md:flex" aria-label="Principal">
            <Link href="/#como-funciona" className="rounded-md px-3 py-2 text-muted-foreground hover:text-foreground">Cómo funciona</Link>
            <Link href="/autoevaluacion" className="rounded-md px-3 py-2 text-muted-foreground hover:text-foreground">Evalúe su perfil</Link>
            <Link href="/#seguridad" className="rounded-md px-3 py-2 text-muted-foreground hover:text-foreground">Seguridad</Link>
            <Link href="/#contacto" className="rounded-md px-3 py-2 text-muted-foreground hover:text-foreground">Contacto</Link>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/recuperar" className={cn(buttonVariants({ variant: "ghost" }), "hidden sm:inline-flex")}>Recuperar</Link>
            <Link href="/comenzar" className={buttonVariants()}>Comenzar</Link>
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t bg-card">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div className="space-y-3">
            <Brand name={s.platformName} logoUrl={s.logoUrl} />
            <p className="max-w-md text-xs leading-relaxed text-muted-foreground">{DISCLAIMER_SHORT}</p>
          </div>
          <div className="space-y-2 text-sm">
            <p className="font-medium">Plataforma</p>
            <ul className="space-y-1.5 text-muted-foreground">
              <li><Link className="hover:text-foreground" href="/comenzar">Comenzar formulario</Link></li>
              <li><Link className="hover:text-foreground" href="/recuperar">Recuperar mi formulario</Link></li>
              <li><Link className="hover:text-foreground" href="/autoevaluacion">Autoevaluación de su perfil</Link></li>
              <li><Link className="hover:text-foreground" href="/privacidad">Política de privacidad</Link></li>
            </ul>
          </div>
          <div className="space-y-2 text-sm">
            <p className="font-medium">Contacto</p>
            <ul className="space-y-1.5 text-muted-foreground">
              {s.contactEmail && <li>{s.contactEmail}</li>}
              {s.contactPhone && <li>{s.contactPhone}</li>}
              {s.contactAddress && <li>{s.contactAddress}</li>}
              {s.officeHours && <li>{s.officeHours}</li>}
              {!s.contactEmail && !s.contactPhone && !s.contactAddress && <li>Datos de contacto disponibles próximamente.</li>}
            </ul>
          </div>
        </div>
        <div className="border-t py-4 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} {s.platformName}. Servicio privado de asesoría. No garantizamos la aprobación de ninguna visa.
        </div>
      </footer>
      <WhatsAppFloat href={wa} />
    </>
  );
}
