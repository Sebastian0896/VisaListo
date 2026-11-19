import { requireAdmin } from "@/server/guards";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/page-header";
import { db } from "@/lib/db";
import { loadFormVersion } from "@/server/form";
import { AddQuestion, QuestionEditor } from "./question-editor";

export const metadata: Metadata = { title: "Editar formulario" };

const TYPE_LABELS: Record<string, string> = {
  TEXT: "Texto", TEXTAREA: "Texto largo", EMAIL: "Correo", PHONE: "Teléfono", DATE: "Fecha", NUMBER: "Número",
  SELECT: "Lista", RADIO: "Opción única", YESNO: "Sí / No", COUNTRY: "País", GROUP: "Lista repetible",
};

export default async function VersionPage(props: PageProps<"/admin/formulario/[versionId]">) {
  await requireAdmin("ADMIN");
  const { versionId } = await props.params;
  const version = await db.formTemplateVersion.findUnique({ where: { id: versionId } });
  if (!version) notFound();
  const sections = await loadFormVersion(versionId, true);
  const inactive = new Set((await db.formQuestion.findMany({ where: { section: { templateVersionId: versionId }, active: false }, select: { id: true } })).map((q) => q.id));
  const orders = new Map((await db.formQuestion.findMany({ where: { section: { templateVersionId: versionId } }, select: { id: true, order: true } })).map((q) => [q.id, q.order]));
  const draft = version.status === "DRAFT";

  return (
    <div className="mx-auto max-w-5xl">
      <Link href="/admin/formulario" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /> Versiones</Link>
      <PageHeader
        title={`Versión ${version.version} ${draft ? "(borrador)" : ""}`}
        description={draft ? "Puede editar preguntas, opciones y orientaciones. Publique la versión cuando esté lista." : "Versión en uso o archivada: solo se pueden editar las orientaciones. Para cambiar preguntas, cree un borrador."}
      />
      <div className="space-y-6">
        {sections.map((s) => (
          <section key={s.id} className="rounded-2xl border bg-card shadow-sm">
            <header className="border-b px-5 py-4">
              <h2 className="font-semibold">{s.order}. {s.title}</h2>
              {s.description && <p className="text-sm text-muted-foreground">{s.description}</p>}
            </header>
            <ul className="divide-y">
              {s.questions.map((q) => (
                <li key={q.id} className="px-5 py-3">
                  <QuestionEditor
                    draft={draft}
                    question={{
                      id: q.id,
                      key: q.key,
                      label: q.label,
                      type: q.type,
                      typeLabel: TYPE_LABELS[q.type] ?? q.type,
                      required: q.required,
                      active: !inactive.has(q.id),
                      order: orders.get(q.id) ?? 0,
                      options: q.options.map((o) => `${o.value}|${o.label}`).join("\n"),
                      conditional: q.showIf ? `Visible si «${q.showIf.question}» = ${Array.isArray(q.showIf.equals) ? q.showIf.equals.join(" / ") : q.showIf.equals}` : null,
                      help: { guidance: q.help?.guidance ?? "", example: q.help?.example ?? "", notApplicable: q.help?.notApplicable ?? "", warning: q.help?.warning ?? "" },
                    }}
                  />
                </li>
              ))}
            </ul>
            {draft && <div className="border-t px-5 py-3"><AddQuestion sectionId={s.id} /></div>}
          </section>
        ))}
      </div>
    </div>
  );
}
