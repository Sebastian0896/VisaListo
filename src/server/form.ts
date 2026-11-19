import "server-only";
import { cache } from "react";
import { db } from "@/lib/db";
import type { ClientSection, QuestionConfig, ShowIf } from "@/lib/form-types";

/** Carga la estructura completa de una versión de la plantilla (solo preguntas activas). */
export const loadFormVersion = cache(async (versionId: string, includeInactive = false): Promise<ClientSection[]> => {
  const sections = await db.formSection.findMany({
    where: { templateVersionId: versionId },
    orderBy: { order: "asc" },
    include: {
      questions: {
        where: includeInactive ? {} : { active: true },
        orderBy: { order: "asc" },
        include: { options: { orderBy: { order: "asc" } }, help: true },
      },
    },
  });
  return sections.map((s) => ({
    id: s.id,
    key: s.key,
    order: s.order,
    title: s.title,
    description: s.description,
    notice: s.notice,
    questions: s.questions.map((q) => ({
      id: q.id,
      key: q.key,
      label: q.label,
      type: q.type,
      required: q.required,
      sensitive: q.sensitive,
      placeholder: q.placeholder,
      config: (q.config ?? {}) as QuestionConfig,
      showIf: (q.showIf ?? null) as ShowIf | null,
      options: q.options.map((o) => ({ value: o.value, label: o.label })),
      help: q.help
        ? { guidance: q.help.guidance, example: q.help.example, notApplicable: q.help.notApplicable, warning: q.help.warning }
        : null,
    })),
  }));
});

export async function getPublishedVersion() {
  return db.formTemplateVersion.findFirst({
    where: { status: "PUBLISHED", template: { slug: "ds160-prep" } },
    orderBy: { version: "desc" },
  });
}
