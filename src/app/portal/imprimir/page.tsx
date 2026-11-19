import { Download } from "lucide-react";
import type { Metadata } from "next";
import { PrintButton } from "@/components/shared/print-button";
import { PrintDocument } from "@/components/shared/print-document";
import { buttonVariants } from "@/components/ui/button";
import type { AnswerMap } from "@/lib/form-types";
import { getPortalData } from "@/server/portal";

export const metadata: Metadata = { title: "Imprimir formulario" };

export default async function ClientPrintPage() {
  const { file, sections, answers, settings, progress } = await getPortalData();
  const name = [answers.given_names, answers.surnames].filter((v) => typeof v === "string" && v).join(" ") || file.applicant.firstSurname;
  return (
    <div className="mx-auto max-w-4xl space-y-4 px-4 py-8">
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">Vista optimizada para imprimir en tamaño carta o A4.</p>
        <div className="flex gap-2">
          <a href="/api/pdf/cliente" className={buttonVariants({ variant: "outline" })}><Download /> Descargar PDF</a>
          <PrintButton />
        </div>
      </div>
      <PrintDocument
        platformName={settings.platformName}
        code={file.uniqueCode}
        status={file.status}
        applicantName={name}
        createdAt={file.createdAt}
        submittedAt={file.submittedAt}
        sections={sections}
        answers={answers as AnswerMap}
        percent={progress.percent}
      />
    </div>
  );
}
