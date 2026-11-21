import Link from "next/link";
import { Brand } from "@/components/shared/brand";
import { DisclaimerBar, DISCLAIMER_SHORT } from "@/components/shared/disclaimer";
import { WhatsAppFloat } from "@/components/shared/whatsapp-button";
import { buttonVariants } from "@/components/ui/button";
import { getSettings, whatsappLink } from "@/lib/settings";
import { ThemeToggle } from "@/components/shared/theme";
import { NavLink } from "@/components/shared/nav-link";
import { PublicMobileNav, type PublicNavItem } from "@/components/shared/public-mobile-nav";
import { StartCta } from "@/components/shared/start-cta";
import { cn } from "@/lib/utils";

const NAV: PublicNavItem[] = [
  { href: "/#como-funciona", label: "Cómo funciona" },
  { href: "/autoevaluacion", label: "Evalúe su perfil" },
  { href: "/preguntas-frecuentes", label: "Preguntas frecuentes" },
  { href: "/#seguridad", label: "Seguridad" },
  { href: "/#contacto", label: "Contacto" },
];

export default async function PublicLayout({ children }: LayoutProps<"/">) {
  const s = await getSettings();
  const wa = whatsappLink(s.whatsappNumber, s.whatsappMessage.replace(/\s*Mi código de expediente es: \{codigo\}/, ""), null);
  return (
    <>
      <DisclaimerBar />
      <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
          <Brand name={s.platformName} logoUrl={s.logoUrl} />
          <nav className="hidden items-center gap-1 text-sm whitespace-nowrap xl:flex" aria-label="Principal">
            {NAV.map((item) => (
              <NavLink key={item.href} href={item.href} className="rounded-md px-3 py-2 text-muted-foreground hover:text-foreground" activeClassName="bg-secondary font-medium text-primary">
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <PublicMobileNav title={s.platformName} items={[...NAV, { href: "/recuperar", label: "Recuperar mi formulario" }]} />
            <NavLink href="/recuperar" className={cn(buttonVariants({ variant: "ghost" }), "hidden sm:inline-flex")} activeClassName="bg-secondary text-primary">Recuperar</NavLink>
            <StartCta />
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
              <li><Link className="hover:text-foreground" href="/preguntas-frecuentes">Preguntas frecuentes</Link></li>
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
        <div className="space-y-1 border-t px-4 py-4 text-center text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} {s.platformName}. Servicio privado de asesoría. No garantizamos la aprobación de ninguna visa.</p>
          <p>
            Desarrollado por <span className="font-medium text-foreground/80">Sebastian Gonzalez Rodriguez</span>
          </p>
        </div>
      </footer>
      <WhatsAppFloat href={wa} />
    </>
  );
}
