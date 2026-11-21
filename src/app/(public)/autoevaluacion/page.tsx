import { ClipboardCheck } from "lucide-react";
import type { Metadata } from "next";
import { AssessmentWizard } from "@/components/assessment/assessment-wizard";

export const metadata: Metadata = {
  title: "Autoevaluación de su perfil para visa de turismo",
  description: "Conozca en 3 minutos los puntos fuertes y débiles de su perfil para la visa de turismo y cómo prepararse. Orientativo: la decisión es del cónsul.",
};

export default function PublicAssessmentPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 md:py-14">
      <div className="mb-8">
        <span className="inline-flex items-center gap-2 text-sm font-medium text-primary"><ClipboardCheck className="size-4" /> Autoevaluación gratuita</span>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-balance">¿Qué tan preparado está su perfil para la visa de turismo?</h1>
        <p className="mt-3 leading-relaxed text-muted-foreground">
          Responda 14 preguntas sencillas (unos 3 minutos) y conozca los puntos fuertes de su perfil, lo que conviene reforzar y cómo
          prepararse para la entrevista. No necesita registrarse y sus respuestas no se guardan.
        </p>
        <p className="mt-3 text-sm text-muted-foreground">
          Es una guía orientativa: no predice el resultado. La decisión depende del cónsul y de la entrevista.
        </p>
      </div>
      <AssessmentWizard mode="public" />
    </div>
  );
}
