import { CheckCircle2, CircleAlert, Pencil } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { SectionAnswers } from "@/components/shared/answers-view";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getPortalData } from "@/server/portal";
import { SubmitPanel } from "./submit-panel";

export const metadata: Metadata = { title: "Revisar y enviar" };

export default async function ReviewPage() {
  const { file, sections, answers, progress, canEdit } = await getPortalData();
  const pending = progress.perSection.filter((s) => !s.completed);
  const canSubmit = canEdit && file.status !== "PENDING_START" && progress.percent === 100;

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Revisar y enviar</h1>
        <p className="mt-1 text-muted-foreground">Verifique que su información sea correcta antes de enviarla a su asesor.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border bg-white p-4">
          <p className="text-sm text-muted-foreground">Progreso</p>
          <p className="text-2xl font-semibold">{progress.percent}%</p>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <p className="text-sm text-muted-foreground">Secciones completas</p>
          <p className="text-2xl font-semibold">{progress.perSection.length - pending.length}/{progress.perSection.length}</p>
        </div>
        <div className={cn("rounded-xl border p-4", pending.length ? "border-amber-200 bg-amber-50" : "border-emerald-200 bg-emerald-50")}>
          <p className="text-sm text-muted-foreground">Obligatorias pendientes</p>
          <p className="text-2xl font-semibold">{progress.total - progress.done}</p>
        </div>
      </div>

      <div className="space-y-4">
        {sections.map((s) => {
          const p = progress.perSection.find((x) => x.key === s.key)!;
          return (
            <section key={s.key} className="rounded-2xl border bg-white shadow-sm">
              <header className="flex flex-wrap items-center justify-between gap-2 border-b px-5 py-3.5">
                <div className="flex items-center gap-2.5">
                  {p.completed ? <CheckCircle2 className="size-5 text-emerald-600" /> : <CircleAlert className="size-5 text-amber-600" />}
                  <h2 className="font-semibold">{s.order}. {s.title}</h2>
                  {!p.completed && <span className="text-xs text-amber-800">{p.totalRequired - p.answeredRequired} pendiente(s)</span>}
                </div>
                {canEdit && (
                  <Link href={`/portal/formulario/${s.key}`} className={buttonVariants({ variant: "ghost", size: "sm" })}>
                    <Pencil /> Editar
                  </Link>
                )}
              </header>
              <div className="px-5 py-2">
                <SectionAnswers section={s} answers={answers} />
              </div>
            </section>
          );
        })}
      </div>

      <SubmitPanel canSubmit={canSubmit} canEdit={canEdit} status={file.status} pendingCount={progress.total - progress.done} />
    </div>
  );
}
