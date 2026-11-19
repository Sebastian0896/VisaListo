import { CheckCircle2, Circle } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SectionForm } from "@/components/form/section-form";
import type { AnswerMap } from "@/lib/form-types";
import { cn } from "@/lib/utils";
import { getPortalData } from "@/server/portal";

export const metadata: Metadata = { title: "Formulario" };

export default async function SectionPage(props: PageProps<"/portal/formulario/[seccion]">) {
  const { seccion } = await props.params;
  const { sections, answers, progress, canEdit } = await getPortalData();
  const index = sections.findIndex((s) => s.key === seccion);
  if (index === -1) notFound();
  const section = sections[index];

  const ownKeys = new Set(section.questions.map((q) => q.key));
  const initial: AnswerMap = {};
  const external: AnswerMap = {};
  for (const q of section.questions) if (answers[q.key] !== undefined) initial[q.key] = answers[q.key];
  for (const q of section.questions) {
    const dep = q.showIf?.question;
    if (dep && !ownKeys.has(dep) && answers[dep] !== undefined) external[dep] = answers[dep];
  }

  const prev = sections[index - 1];
  const next = sections[index + 1];

  return (
    <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 lg:grid-cols-[16rem_1fr] lg:py-8">
      <aside className="hidden lg:block">
        <nav className="sticky top-32 space-y-1 rounded-2xl border bg-white p-2 shadow-sm" aria-label="Secciones">
          <p className="px-3 pt-2 pb-1 text-xs font-semibold text-muted-foreground uppercase">Progreso {progress.percent}%</p>
          {progress.perSection.map((s) => (
            <Link
              key={s.key}
              href={`/portal/formulario/${s.key}`}
              aria-current={s.key === seccion ? "page" : undefined}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition",
                s.key === seccion ? "bg-secondary font-medium text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {s.completed ? <CheckCircle2 className="size-4 shrink-0 text-emerald-600" /> : <Circle className="size-4 shrink-0 opacity-40" />}
              <span className="line-clamp-2">{s.title}</span>
            </Link>
          ))}
          <Link href="/portal/revision" className="mt-1 flex items-center justify-center rounded-lg border px-3 py-2 text-sm font-medium text-primary hover:bg-secondary">
            Revisar y enviar
          </Link>
        </nav>
      </aside>
      <div className="min-w-0">
        {/* Navegación compacta en móvil */}
        <div className="mb-4 flex gap-1.5 overflow-x-auto pb-1 lg:hidden">
          {progress.perSection.map((s) => (
            <Link
              key={s.key}
              href={`/portal/formulario/${s.key}`}
              className={cn(
                "grid size-9 shrink-0 place-items-center rounded-full border text-sm font-medium",
                s.key === seccion ? "border-primary bg-primary text-primary-foreground" : s.completed ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "bg-white text-muted-foreground",
              )}
              aria-label={`Sección ${s.order}: ${s.title}`}
            >
              {s.order}
            </Link>
          ))}
        </div>
        <SectionForm
          key={section.key}
          section={section}
          initial={initial}
          external={external}
          canEdit={canEdit}
          prevHref={prev ? `/portal/formulario/${prev.key}` : null}
          nextHref={next ? `/portal/formulario/${next.key}` : null}
          isLast={!next}
        />
      </div>
    </div>
  );
}
