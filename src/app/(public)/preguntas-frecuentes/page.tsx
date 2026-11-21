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
  description: "Guía para preparar su DS-160 con su asesor en FormuGuía: qué necesita, cómo llenarlo por partes, el envío y la revisión, sus documentos y cómo comunicarse con su asesor.",
};

type Faq = { q: string; a: string[]; link?: { href: string; label: string } };
type Group = { title: string; items: Faq[] };

function faqGroups(validityDays: number, retentionDays: number): Group[] {
  return [
    {
      title: "Antes de empezar",
      items: [
        {
          q: "¿Qué es FormuGuía?",
          a: [
            "Es la plataforma con la que **usted y su asesor** preparan juntos su formulario DS-160 (solicitud de visa de no inmigrante para Estados Unidos).",
            "Usted responde las preguntas con ayuda en cada paso, y su asesor revisa todo, le orienta y le acompaña durante el proceso.",
          ],
        },
        {
          q: "¿Es esta la página oficial del Gobierno de Estados Unidos?",
          a: [
            "**No.** FormuGuía es un servicio privado de asesoría. No es un sitio del Gobierno de los Estados Unidos ni de ninguna embajada o consulado, y no está afiliado a ellos.",
            "Aquí se prepara y revisa su información. Los pasos del proceso oficial se los indica su asesor cuando corresponda.",
          ],
        },
        {
          q: "¿Qué necesito tener a mano?",
          a: [
            "- Su **pasaporte vigente** (le pediremos una foto de la página de datos).\n- Su cédula (opcional).\n- Fechas de viajes anteriores a EE. UU., si los tiene.\n- Datos de su trabajo o estudios actuales y anteriores.\n- Datos de sus padres, y de su cónyuge si aplica.\n- Si ya la sabe, la dirección donde se quedará en EE. UU.",
            "Si le falta algún dato, no se preocupe: puede avanzar con lo que tenga, guardar y completarlo después, o consultarlo con su asesor.",
          ],
        },
        {
          q: "¿Cómo me vinculo con mi asesor?",
          a: [
            "Con el **enlace o el código** que le comparte su asesor. Si entró con su enlace, ya quedó vinculado automáticamente.",
            "Si comenzó sin código, puede agregarlo después desde su portal.",
          ],
        },
        {
          q: "¿Necesito crear una cuenta o una contraseña?",
          a: [
            "No. Al comenzar recibe un **código de expediente** (por ejemplo DS-XXXX-XXXX-XXXX) y elige una pregunta de seguridad.",
            "Guarde ese código en un lugar seguro: es la llave para volver a su formulario.",
          ],
          link: { href: "/comenzar", label: "Comenzar mi formulario" },
        },
      ],
    },
    {
      title: "Mientras llena el formulario",
      items: [
        {
          q: "¿Puedo llenarlo por partes?",
          a: [
            "Sí. Lo que va respondiendo **se guarda automáticamente**, sección por sección. Puede cerrar la página y continuar más tarde, incluso desde otro dispositivo.",
          ],
        },
        {
          q: "No entiendo una pregunta, ¿qué hago?",
          a: [
            "Cada pregunta trae una explicación y ejemplos. Si aun así tiene dudas, **escríbale a su asesor** desde los mensajes de su portal o por WhatsApp antes de responder: es mejor preguntar que adivinar.",
          ],
        },
        {
          q: "¿Cuánto tiempo tengo para completarlo?",
          a: [
            `Tiene **${validityDays} días** a partir de su primera respuesta. En el portal verá cuánto tiempo le queda.`,
            "Si necesita más tiempo, hable con su asesor: puede extender el plazo.",
          ],
        },
        {
          q: "¿Cómo vuelvo a entrar a mi formulario?",
          a: [
            "Desde «Recuperar», con su código de expediente, su primer apellido, su año de nacimiento y la respuesta a su pregunta de seguridad.",
          ],
          link: { href: "/recuperar", label: "Recuperar mi formulario" },
        },
        {
          q: "Perdí mi código, ¿qué hago?",
          a: [
            "Escríbale a su asesor: él puede ver su expediente y ayudarle a recuperarlo. Por seguridad, nunca lo enviamos a nadie que no pueda confirmar sus datos.",
          ],
        },
      ],
    },
    {
      title: "Envío y revisión",
      items: [
        {
          q: "¿Qué pasa cuando envío el formulario?",
          a: [
            "Su asesor lo recibe y lo revisa. Si todo está bien, lo marca como revisado; si hace falta ajustar algo, le escribe y le habilita las correcciones.",
            "Usted verá el estado en su portal y recibirá los mensajes de su asesor ahí mismo.",
          ],
        },
        {
          q: "¿Puedo cambiar respuestas después de enviarlo?",
          a: [
            "Mientras está en revisión no se puede editar. Si se dio cuenta de un error, avísele a su asesor: él le habilitará las correcciones.",
          ],
        },
        {
          q: "Ya revisaron mi formulario, ¿y ahora?",
          a: [
            "Su asesor le indicará los siguientes pasos de su proceso y le acompañará en ellos. Cualquier duda, consúltela siempre con él antes de hacer algo por su cuenta.",
          ],
        },
      ],
    },
    {
      title: "Documentos y privacidad",
      items: [
        {
          q: "¿Por qué tengo que subir la foto de mi pasaporte?",
          a: [
            "Para que su asesor confirme que nombres, fechas y número de pasaporte coinciden exactamente con el documento; un error en esos datos puede traerle problemas más adelante.",
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
          ],
          link: { href: "/privacidad", label: "Ver política de privacidad" },
        },
      ],
    },
    {
      title: "Su asesor",
      items: [
        {
          q: "¿Cómo me comunico con mi asesor?",
          a: [
            "Desde su portal: por **mensajes** dentro de la plataforma o por **WhatsApp**, con el contacto y el horario de su asesor. Si dejó su correo en el formulario, también le avisaremos por ahí cuando haya novedades.",
          ],
        },
        {
          q: "¿Cómo se acuerda el costo del servicio?",
          a: [
            "Todo lo relacionado con el servicio, incluidos su costo y la forma de pago, se acuerda **directamente con su asesor**. La plataforma no procesa pagos.",
          ],
        },
        {
          q: "¿Me garantizan que me aprueben la visa?",
          a: [
            "**No. Nadie puede garantizarlo.** La decisión la toma únicamente el oficial consular, y la entrevista pesa mucho.",
            "Lo que sí hace su asesor es ayudarle a presentar una información completa, coherente y sin errores, y a llegar mejor preparado.",
          ],
        },
        {
          q: "¿Qué es la autoevaluación de perfil?",
          a: [
            "Un cuestionario corto y gratuito que le muestra los puntos fuertes de su perfil para la visa de turismo y qué conviene reforzar. Puede comentar el resultado con su asesor.",
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

const plain = (text: string) => text.replace(/\*\*/g, "").replace(/^- /gm, "").replace(/\n/g, "; ");

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
      <p className="mt-2 text-muted-foreground">Todo lo que necesita saber para preparar su DS-160 paso a paso, de la mano de su asesor.</p>

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
                    {f.a.map((p, j) =>
                      p.startsWith("- ") ? (
                        <ul key={j} className="list-disc space-y-1 pl-5">
                          {p.split("\n").map((li, k) => <li key={k}>{rich(li.replace(/^- /, ""))}</li>)}
                        </ul>
                      ) : (
                        <p key={j}>{rich(p)}</p>
                      ),
                    )}
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
        <p className="mt-1 text-sm text-muted-foreground">Consúltelo con su asesor. Si todavía no tiene uno, escríbanos y le orientamos.</p>
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
