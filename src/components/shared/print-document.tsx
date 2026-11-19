import type { AnswerMap, ClientSection } from "@/lib/form-types";
import { formatDateTime } from "@/lib/format";
import { STATUS_LABELS } from "@/lib/status";
import type { FileStatus } from "@/generated/prisma/enums";
import { SectionAnswers } from "./answers-view";

export const PRIVATE_MARK =
  "DOCUMENTO PRIVADO DE PREPARACIÓN. NO ES EL FORMULARIO DS-160 OFICIAL. NO CONSTITUYE UNA SOLICITUD PRESENTADA AL GOBIERNO DE LOS ESTADOS UNIDOS.";

export function PrintDocument({
  platformName,
  code,
  status,
  applicantName,
  createdAt,
  submittedAt,
  sections,
  answers,
  percent,
  adminExtra,
}: {
  platformName: string;
  code: string;
  status: FileStatus;
  applicantName: string;
  createdAt: Date;
  submittedAt: Date | null;
  sections: ClientSection[];
  answers: AnswerMap;
  percent: number;
  adminExtra?: React.ReactNode;
}) {
  return (
    <article className="print-page mx-auto max-w-4xl rounded-2xl border bg-card p-6 shadow-sm sm:p-10">
      <div className="rounded-lg border-2 border-rose-300 bg-rose-50 px-4 py-2.5 text-center text-[11px] font-bold tracking-wide text-rose-900">{PRIVATE_MARK}</div>
      <header className="mt-6 flex flex-wrap items-start justify-between gap-4 border-b pb-5">
        <div>
          <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">{platformName}</p>
          <h1 className="mt-1 text-2xl font-semibold">Formulario de preparación</h1>
          <p className="mt-1 text-sm text-muted-foreground">{applicantName}</p>
        </div>
        <dl className="grid grid-cols-[auto_auto] gap-x-4 gap-y-1 text-sm">
          <dt className="text-muted-foreground">Expediente</dt><dd className="font-mono font-semibold">{code}</dd>
          <dt className="text-muted-foreground">Estado</dt><dd>{STATUS_LABELS[status]}</dd>
          <dt className="text-muted-foreground">Creado</dt><dd>{formatDateTime(createdAt)}</dd>
          {submittedAt && <><dt className="text-muted-foreground">Enviado</dt><dd>{formatDateTime(submittedAt)}</dd></>}
          <dt className="text-muted-foreground">Generado</dt><dd>{formatDateTime(new Date())}</dd>
          <dt className="text-muted-foreground">Completado</dt><dd>{percent}%</dd>
        </dl>
      </header>
      <div className="mt-6 space-y-7">
        {sections.map((s) => (
          <section key={s.key} className="break-inside-auto">
            <h2 className="mb-1 border-b-2 border-primary/20 pb-1.5 text-base font-semibold text-primary">{s.order}. {s.title}</h2>
            <SectionAnswers section={s} answers={answers} dense />
          </section>
        ))}
      </div>
      {adminExtra}
      <footer className="mt-10 border-t pt-4 text-center text-[11px] text-muted-foreground">{PRIVATE_MARK}</footer>
    </article>
  );
}
