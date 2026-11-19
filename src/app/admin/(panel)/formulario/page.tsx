import { requireAdmin } from "@/server/guards";
import { AlertTriangle, BadgeCheck, Pencil } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/admin/page-header";
import { buttonVariants } from "@/components/ui/button";
import { db } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { VersionButtons } from "./version-buttons";

export const metadata: Metadata = { title: "Formulario" };

const STATUS = { DRAFT: "Borrador", PUBLISHED: "Publicada", ARCHIVED: "Archivada" } as const;

export default async function TemplatesPage() {
  await requireAdmin("ADMIN");
  const versions = await db.formTemplateVersion.findMany({
    orderBy: { version: "desc" },
    include: { template: true, _count: { select: { files: true, sections: true } } },
  });
  const counts = await db.formQuestion.groupBy({ by: ["sectionId"], _count: { _all: true } });
  const sections = await db.formSection.findMany({ select: { id: true, templateVersionId: true } });
  const qPerVersion = new Map<string, number>();
  for (const s of sections) qPerVersion.set(s.templateVersionId, (qPerVersion.get(s.templateVersionId) ?? 0) + (counts.find((c) => c.sectionId === s.id)?._count._all ?? 0));

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title="Formulario" description="Versiones de la plantilla, preguntas y orientaciones. Cada expediente conserva la versión con la que se creó." />
      <div className="mb-5 flex gap-3 rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-950">
        <AlertTriangle className="mt-0.5 size-4 shrink-0" />
        <p>
          Las preguntas se basan en los temas que aborda el proceso DS-160, con redacción propia. Antes de marcar una versión como
          verificada, compare su contenido con la referencia oficial vigente. Las orientaciones se pueden ajustar en cualquier momento;
          los cambios de estructura (preguntas, opciones) se hacen en un borrador y se publican como nueva versión.
        </p>
      </div>
      <div className="space-y-3">
        {versions.map((v) => (
          <div key={v.id} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border bg-white p-5 shadow-sm">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-semibold">{v.template.name} · versión {v.version}</h2>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-medium ring-1",
                    v.status === "PUBLISHED" ? "bg-emerald-50 text-emerald-800 ring-emerald-200" : v.status === "DRAFT" ? "bg-amber-50 text-amber-900 ring-amber-200" : "bg-slate-100 text-slate-700 ring-slate-200",
                  )}
                >
                  {STATUS[v.status]}
                </span>
                {v.verifiedAt ? (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700"><BadgeCheck className="size-3.5" /> Verificada {formatDateTime(v.verifiedAt)}</span>
                ) : (
                  <span className="text-xs font-medium text-amber-700">Pendiente de verificación</span>
                )}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {v._count.sections} secciones · {qPerVersion.get(v.id) ?? 0} preguntas · {v._count.files} expediente(s) · {v.notes}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href={`/admin/formulario/${v.id}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
                <Pencil /> {v.status === "DRAFT" ? "Editar" : "Ver / orientaciones"}
              </Link>
              <VersionButtons versionId={v.id} status={v.status} verified={!!v.verifiedAt} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
