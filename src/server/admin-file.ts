import "server-only";
import { db } from "@/lib/db";
import { computeOverallProgress, getAnswers } from "./answers";
import { applyExpiry } from "./files";
import { loadFormVersion } from "./form";

/** Carga completa de un expediente para el panel administrativo. */
export async function getAdminFile(fileId: string) {
  const raw = await db.applicationFile.findUnique({
    where: { id: fileId },
    include: {
      applicant: true,
      securityQuestion: true,
      templateVersion: true,
      notes: { orderBy: { createdAt: "desc" }, include: { adminUser: { select: { name: true } } } },
      reviews: { orderBy: { createdAt: "desc" }, include: { adminUser: { select: { name: true } } } },
      messages: { orderBy: { createdAt: "asc" }, include: { adminUser: { select: { name: true } } } },
      auditLogs: { orderBy: { createdAt: "desc" }, take: 80 },
    },
  });
  if (!raw) return null;
  const file = await applyExpiry(raw);
  const [sections, answers] = await Promise.all([loadFormVersion(file.templateVersionId), getAnswers(file.id)]);
  const progress = computeOverallProgress(sections, answers);
  const name = [answers.given_names, answers.surnames].filter((v) => typeof v === "string" && v).join(" ") || file.applicant.firstSurname;
  return { file, sections, answers, progress, name };
}
