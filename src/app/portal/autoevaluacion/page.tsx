import { ClipboardCheck } from "lucide-react";
import type { Metadata } from "next";
import { AssessmentWizard } from "@/components/assessment/assessment-wizard";
import { formatDateTime } from "@/lib/format";
import { latestAssessment, prefillFromForm } from "@/server/assessment";
import { getPortalData } from "@/server/portal";

export const metadata: Metadata = { title: "Autoevaluación de su perfil" };

export default async function PortalAssessmentPage() {
  const { file, answers } = await getPortalData();
  const latest = await latestAssessment(file.id);
  const prefill = latest ? latest.answers : prefillFromForm(answers);

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <div>
        <span className="inline-flex items-center gap-2 text-sm font-medium text-primary"><ClipboardCheck className="size-4" /> Autoevaluación</span>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Fortaleza de su perfil para la visa de turismo</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Le ayuda a identificar qué reforzar antes de la entrevista. Su asesor podrá ver el resultado para prepararle mejor.
          {latest && <> Última evaluación: {formatDateTime(latest.createdAt)}.</>}
        </p>
      </div>
      <AssessmentWizard mode="portal" initialAnswers={prefill} prefilledKeys={latest ? [] : Object.keys(prefill)} initialResult={latest?.result ?? null} />
    </div>
  );
}
