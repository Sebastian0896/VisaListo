import "server-only";
import { cache } from "react";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { computeOverallProgress, getAnswers } from "./answers";
import { clientCanEdit } from "./files";
import { loadFormVersion } from "./form";
import { requireClientFile } from "./guards";

/** Datos del portal del cliente autenticado (una sola carga por solicitud). */
export const getPortalData = cache(async () => {
  const file = await requireClientFile();
  const [sections, answers, settings, unread] = await Promise.all([
    loadFormVersion(file.templateVersionId),
    getAnswers(file.id),
    getSettings(),
    db.message.count({ where: { applicationFileId: file.id, senderType: "ADMIN", readAt: null } }),
  ]);
  const progress = computeOverallProgress(sections, answers);
  return { file, sections, answers, settings, progress, unread, canEdit: clientCanEdit(file) };
});
