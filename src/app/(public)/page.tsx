import { ArrowRight, Clock, FileText, KeyRound, Lock, MessageSquare, Printer, Save, ShieldCheck, UserCheck, ClipboardCheck } from "lucide-react";
import Link from "next/link";
import { DisclaimerBox } from "@/components/shared/disclaimer";
import { WhatsAppIcon } from "@/components/shared/whatsapp-button";
import { buttonVariants } from "@/components/ui/button";
import { getSettings, whatsappLink } from "@/lib/settings";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const STEPS = [
  { icon: KeyRound, title: "Reciba su código", text: "Al comenzar le damos un código único y usted elige una pregunta de seguridad. No necesita crear cuenta ni contraseña." },
  { icon: FileText, title: "Complete por secciones", text: "Cada pregunta tiene una explicación en español y ejemplos. Su avance se guarda automáticamente." },
  { icon: UserCheck, title: "Envíelo a su asesor", text: "Revise el resumen, deje un mensaje si tiene dudas y envíe. Su asesor revisará la información." },
  { icon: MessageSquare, title: "Reciba orientación", text: "Consulte las respuestas de su asesor, haga correcciones si se le solicitan e imprima su copia." },
];

const FEATURES = [
  { icon: Save, title: "Guardado automático", text: "Puede salir y volver cuando quiera; nada se pierde." },
  { icon: Clock, title: "Vigencia clara", text: "El plazo empieza cuando usted comienza a llenar, no antes." },
  { icon: MessageSquare, title: "Mensajes con su asesor", text: "Una conversación asociada a su expediente." },
  { icon: Printer, title: "Imprima o descargue", text: "Una copia en PDF ordenada por secciones." },
];

export default async function HomePage() {
  const s = await getSettings();
  const wa = whatsappLink(s.whatsappNumber, "Hola, me interesa el servicio de preparación del formulario DS-160.");
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b bg-gradient-to-b from-card to-background">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_80%_0%,var(--accent)_0%,transparent_70%)]" />
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 md:grid-cols-[1.15fr_1fr] md:py-24">
          <div className="space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
              <ShieldCheck className="size-3.5 text-primary" /> Asesoría privada en español
            </span>
            <h1 className="text-4xl font-semibold tracking-tight text-balance text-foreground md:text-5xl">
              Prepare la información de su DS-160 con calma y acompañamiento
            </h1>
            <p className="max-w-xl text-lg leading-relaxed text-muted-foreground">{s.aboutText}</p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/comenzar" className={cn(buttonVariants({ size: "lg" }), "h-11 px-5 text-[15px]")}>
                Comenzar formulario <ArrowRight className="size-4" />
              </Link>
              <Link href="/recuperar" className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-11 px-5 text-[15px]")}>
                Recuperar mi formulario
              </Link>
            </div>
            <p className="text-xs text-muted-foreground">Sin cuentas ni contraseñas. Solo un código y sus datos de verificación.</p>
            <Link href="/autoevaluacion" className="inline-flex w-fit items-center gap-2 rounded-xl border bg-card px-4 py-2.5 text-sm font-medium text-primary shadow-sm transition hover:bg-secondary">
              <ClipboardCheck className="size-4" /> ¿Qué tan preparado está su perfil? Evalúelo gratis en 3 minutos <ArrowRight className="size-4" />
            </Link>
          </div>

          {/* Vista previa ilustrativa */}
          <div className="relative" aria-hidden>
            <div className="rounded-2xl border bg-card p-5 shadow-xl shadow-primary/5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Su progreso</p>
                  <p className="text-2xl font-semibold">68%</p>
                </div>
                <span className="rounded-full bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-800 ring-1 ring-sky-200">En proceso</span>
              </div>
              <div className="mt-3 h-2 rounded-full bg-muted"><div className="h-2 w-[68%] rounded-full bg-primary" /></div>
              <ul className="mt-5 space-y-2.5 text-sm">
                {["Información personal", "Contacto y domicilio", "Pasaporte", "Información del viaje", "Información familiar"].map((t, i) => (
                  <li key={t} className="flex items-center justify-between rounded-lg border px-3 py-2">
                    <span>{t}</span>
                    <span className={cn("text-xs font-medium", i < 3 ? "text-emerald-700" : "text-muted-foreground")}>{i < 3 ? "Completa" : "Pendiente"}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 rounded-lg bg-secondary p-3 text-xs leading-relaxed text-secondary-foreground">
                <strong>Orientación:</strong> Indique a qué se dedica actualmente: empleo, negocio propio, estudios, jubilación u otra situación.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Cómo funciona */}
      <section id="como-funciona" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-16 md:py-20">
        <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">Cómo funciona</h2>
        <p className="mt-2 max-w-2xl text-muted-foreground">Cuatro pasos sencillos. Usted avanza a su ritmo y su asesor le acompaña.</p>
        <ol className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, i) => (
            <li key={step.title} className="rounded-2xl border bg-card p-5">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-secondary text-primary"><step.icon className="size-5" /></span>
                <span className="text-xs font-semibold text-muted-foreground">Paso {i + 1}</span>
              </div>
              <h3 className="mt-4 font-semibold">{step.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Características */}
      <section className="border-y bg-card">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-14 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="flex gap-3">
              <f.icon className="mt-0.5 size-5 shrink-0 text-primary" />
              <div>
                <p className="font-medium">{f.title}</p>
                <p className="text-sm text-muted-foreground">{f.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Seguridad */}
      <section id="seguridad" className="mx-auto grid max-w-6xl scroll-mt-24 gap-10 px-4 py-16 md:grid-cols-2 md:py-20">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">Su información, protegida</h2>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            Aplicamos medidas razonables para proteger sus datos personales. Ningún sistema es infalible, por eso limitamos al
            mínimo quién puede ver su información y registramos cada acceso.
          </p>
          <ul className="mt-6 space-y-3 text-sm">
            {[
              "Conexión cifrada y respuestas almacenadas con cifrado.",
              "Su respuesta de seguridad se guarda de forma irreversible (hash).",
              "Solo usted y su asesor pueden ver su expediente.",
              "Límite de intentos para impedir accesos automatizados.",
              "Nunca le pediremos contraseñas de portales oficiales.",
            ].map((t) => (
              <li key={t} className="flex gap-2.5"><Lock className="mt-0.5 size-4 shrink-0 text-primary" />{t}</li>
            ))}
          </ul>
          <Link href="/privacidad" className={cn(buttonVariants({ variant: "link" }), "mt-4 px-0")}>Leer la política de privacidad</Link>
        </div>
        <div className="space-y-4">
          <DisclaimerBox />
          <div className="rounded-xl border bg-card p-4 text-sm leading-relaxed text-muted-foreground">
            <p className="font-medium text-foreground">Sin promesas de aprobación</p>
            <p className="mt-1">
              La decisión sobre cualquier visa corresponde exclusivamente a las autoridades consulares. Nuestro servicio le ayuda a
              organizar su información de forma completa y coherente.
            </p>
          </div>
        </div>
      </section>

      {/* Contacto */}
      <section id="contacto" className="scroll-mt-24 border-t bg-primary text-primary-foreground dark:bg-card dark:text-foreground">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-4 py-14 md:flex-row md:items-center">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">¿Tiene preguntas antes de empezar?</h2>
            <p className="mt-2 max-w-xl text-primary-foreground/75 dark:text-muted-foreground">
              {[s.contactEmail, s.contactPhone, s.officeHours].filter(Boolean).join(" · ") || "Escríbanos y le orientamos sobre el proceso."}
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            {wa && (
              <a href={wa} target="_blank" rel="noopener noreferrer" className={cn(buttonVariants({ size: "lg" }), "h-11 bg-background px-5 text-foreground hover:bg-background/90")}>
                <WhatsAppIcon className="size-5 text-[#1f9d55]" /> Escribir por WhatsApp
              </a>
            )}
            <Link href="/comenzar" className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-11 border-primary-foreground/30 bg-transparent px-5 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground dark:border-border dark:text-foreground dark:hover:bg-muted dark:hover:text-foreground")}>
              Comenzar formulario
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
