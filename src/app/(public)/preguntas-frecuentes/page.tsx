import { ArrowRight, ChevronDown, MessageCircle } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Fragment } from "react";
import { DisclaimerBox } from "@/components/shared/disclaimer";
import { buttonVariants } from "@/components/ui/button";
import { getSettings, whatsappLink } from "@/lib/settings";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Preguntas frecuentes",
  description: "Respuestas sobre FormuGuía: cómo funciona la preparación del DS-160, su código, el plazo, los documentos, la seguridad de sus datos y su asesor.",
};

type Faq = { q: string; a: string[]; link?: { href: string; label: string } };
type Group = { title: string; items: Faq[] };

function faqGroups(validityDays: number, retentionDays: number): Group[] {
  return [
    {
      title: "Sobre el servicio",
      items: [
        {
          q: "¿Qué es FormuGuía?",
          a: [
            "Es un servicio **privado** de preparación guiada y asesoría para el formulario DS-160 (solicitud de visa de no inmigrante para Estados Unidos).",
            "Usted responde las preguntas con ayuda y explicaciones en cada paso, y su asesor revisa todo antes de que se complete el formulario oficial.",
          ],
        },
        {
          q: "¿Es esta la página oficial del Gobierno de Estados Unidos?",
          a: [
            "**No.** FormuGuía no es un sitio del Gobierno de los Estados Unidos ni de ninguna embajada o consulado, y no está afiliado a ellos.",
            "El DS-160 oficial se presenta en el sitio del Departamento de Estado (ceac.state.gov). Aquí se prepara y revisa la información; su asesor le indicará cómo se completa ese paso.",
          ],
        },
        {
          q: "¿Ustedes garantizan que me aprueben la visa?",
          a: [
            "**No. Nadie puede garantizarlo.** La decisión la toma únicamente el oficial consular, y la entrevista pesa mucho.",
            "Lo que sí hacemos es ayudarle a presentar un formulario completo, coherente y sin errores, y a llegar mejor preparado.",
          ],
        },
        {
          q: "¿Cuánto cuesta?",
          a: [
            "El precio del servicio de asesoría lo acuerda directamente con su asesor.",
            "Aparte está la **tarifa consular (MRV)**, que se paga al Gobierno de EE. UU. por el canal oficial; no la cobramos nosotros.",
          ],
        },
      ],
    },
    {
      title: "Su formulario",
      items: [
        {
          q: "¿Necesito crear una cuenta o una contraseña?",
          a: [
            "No. Al comenzar recibe un **código de expediente** (por ejemplo DS-XXXX-XXXX-XXXX) y elige una pregunta de seguridad.",
            "Guarde ese código en un lugar seguro: es la llave para volver a su formulario.",
          ],
          link: { href: "/comenzar", label: "Comenzar mi formulario" },
        },
        {
          q: "¿Puedo llenarlo por partes?",
          a: [
            "Sí. Lo que va respondiendo **se guarda automáticamente**, sección por sección. Puede cerrar la página y continuar más tarde, incluso desde otro dispositivo.",
          ],
        },
        {
          q: "¿Cómo vuelvo a entrar a mi formulario?",
          a: [
            "Desde «Recuperar» con su código de expediente, su primer apellido, su año de nacimiento y la respuesta a su pregunta de seguridad.",
          ],
          link: { href: "/recuperar", label: "Recuperar mi formulario" },
        },
        {
          q: "Perdí mi código, ¿qué hago?",
          a: [
            "Escríbale a su asesor: él puede ver su expediente y darle el código. Por seguridad, nunca lo enviamos a nadie que no pueda confirmar sus datos.",
          ],
        },
        {
          q: "¿Cuánto tiempo tengo para completarlo?",
          a: [
            `Tiene **${validityDays} días** a partir de su primera respuesta. En el portal verá cuánto tiempo le queda.`,
            "Si necesita más tiempo, pídaselo a su asesor: puede extender el plazo.",
          ],
        },
        {
          q: "¿Puedo cambiar respuestas después de enviarlo?",
          a: [
            "Una vez enviado, el formulario queda en revisión y no se puede editar. Si hace falta corregir algo, su asesor le pedirá los cambios y se lo habilitará de nuevo.",
          ],
        },
      ],
    },
    {
      title: "Documentos y seguridad",
      items: [
        {
          q: "¿Por qué tengo que subir la foto de mi pasaporte?",
          a: [
            "Para que su asesor confirme que nombres, fechas y número de pasaporte coinciden exactamente con el documento; un error ahí puede causar problemas en la cita.",
            "La foto del pasaporte es obligatoria para enviar el formulario. La cédula es opcional.",
          ],
        },
        {
          q: "¿Qué pasa con mis documentos después?",
          a: [
            `Se guardan cifrados y se **eliminan automáticamente ${retentionDays} días** después de que su formulario sea revisado.`,
          ],
        },
        {
          q: "¿Mis datos están seguros?",
          a: [
            "Sus respuestas y documentos se guardan **cifrados**. Solo usted y su asesor pueden verlos, y no los compartimos ni los vendemos.",
            "Puede leer los detalles en nuestra política de privacidad.",
          ],
          link: { href: "/privacidad", label: "Ver política de privacidad" },
        },
      ],
    },
    {
      title: "Su asesor y la autoevaluación",
      items: [
        {
          q: "¿Qué es el código de asesor?",
          a: [
            "Es el código que lo vincula con su asesor, para que sea esa persona quien revise su formulario y lo atienda. Si entró con el enlace de su asesor, ya está vinculado.",
            "Si no lo puso al comenzar, puede agregarlo después desde su portal.",
          ],
        },
        {
          q: "¿Cómo me comunico con mi asesor?",
          a: [
            "Desde su portal: por mensajes dentro de la plataforma o por WhatsApp, con el contacto de su asesor. Si dejó su correo en el formulario, también le avisaremos por ahí cuando haya novedades.",
          ],
        },
        {
          q: "¿Qué es la autoevaluación de perfil?",
          a: [
            "Un cuestionario corto y gratuito que le muestra los puntos fuertes de su perfil para la visa de turismo y qué conviene reforzar.",
            "Es orientativa: hay personas que cumplen todo y no la obtienen, y otras que sí. **No se limite por el resultado**; la entrevista es la que decide.",
          ],
          link: { href: "/autoevaluacion", label: "Evaluar mi perfil" },
        },
      ],
    },
  ];
}

/** **negrita** → <strong>; el resto, texto plano */
function rich(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((p, i) =>
    p.startsWith("**") && p.endsWith("**") ? <strong key={i} className="font-semibold text-foreground">{p.slice(2, -2)}</strong> : <Fragment key={i}>{p}</Fragment>,
  );
}

const plain = (text: string) => text.replace(/\*\*/g, "");

export default async function FaqPage() {
  const s = await getSettings();
  const groups = faqGroups(s.validityDays, s.documentRetentionDays);
  const wa = whatsappLink(s.whatsappNumber, "Hola, tengo una pregunta sobre FormuGuía.", null);

  // Datos estructurados para buscadores (FAQPage)
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: groups.flatMap((g) =>
      g.items.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a.map(plain).join(" ") } })),
    ),
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <h1 className="text-3xl font-semibold tracking-tight">Preguntas frecuentes</h1>
      <p className="mt-2 text-muted-foreground">Lo que más nos preguntan antes y durante la preparación del formulario DS-160.</p>

      <nav aria-label="Temas" className="mt-6 flex flex-wrap gap-2">
        {groups.map((g, i) => (
          <a key={g.title} href={`#tema-${i + 1}`} className="rounded-full border bg-card px-3 py-1 text-sm text-muted-foreground transition hover:text-foreground">
            {g.title}
          </a>
        ))}
      </nav>

      <div className="mt-8 space-y-10">
        {groups.map((g, i) => (
          <section key={g.title} id={`tema-${i + 1}`} className="scroll-mt-24">
            <h2 className="mb-3 text-lg font-semibold">{g.title}</h2>
            <div className="divide-y overflow-hidden rounded-2xl border bg-card">
              {g.items.map((f) => (
                <details key={f.q} className="group">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-medium transition hover:bg-muted/50 [&::-webkit-details-marker]:hidden">
                    {f.q}
                    <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden />
                  </summary>
                  <div className="space-y-3 px-5 pb-5 text-[15px] leading-relaxed text-foreground/85">
                    {f.a.map((p, j) => <p key={j}>{rich(p)}</p>)}
                    {f.link && (
                      <Link href={f.link.href} className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                        {f.link.label} <ArrowRight className="size-3.5" />
                      </Link>
                    )}
                  </div>
                </details>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="mt-12 rounded-2xl border bg-card p-6 text-center">
        <p className="font-medium">¿No encontró su respuesta?</p>
        <p className="mt-1 text-sm text-muted-foreground">Escríbanos y le ayudamos.</p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {wa && (
            <a href={wa} target="_blank" rel="noopener noreferrer" className={cn(buttonVariants(), "gap-2")}>
              <MessageCircle className="size-4" /> Escribir por WhatsApp
            </a>
          )}
          <Link href="/comenzar" className={buttonVariants({ variant: "outline" })}>Comenzar formulario</Link>
        </div>
      </div>

      <DisclaimerBox className="mt-8" />
    </div>
  );
}
