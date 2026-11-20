import "server-only";
import { db } from "@/lib/db";
import { computeOverallProgress, getAnswers } from "./answers";
import { applyExpiry } from "./files";
import type { AdminRole } from "@/generated/prisma/enums";
import { loadFormVersion } from "./form";

/** Carga completa de un expediente para el panel administrativo. */
export async function getAdminFile(fileId: string, viewer: { id: string; role: AdminRole }) {
  const raw = await db.applicationFile.findUnique({
    where: { id: fileId },
    include: {
      applicant: true,
      advisor: { select: { id: true, name: true, active: true } },
      passportVerifiedBy: { select: { name: true } },
      securityQuestion: true,
      templateVersion: true,
      notes: { orderBy: { createdAt: "desc" }, include: { adminUser: { select: { name: true } } } },
      reviews: { orderBy: { createdAt: "desc" }, include: { adminUser: { select: { name: true } } } },
      messages: { orderBy: { createdAt: "asc" }, include: { adminUser: { select: { name: true } } } },
      auditLogs: { orderBy: { createdAt: "desc" }, take: 80 },
    },
  });
  if (!raw) return null;
  // El asesor solo puede abrir expedientes asignados a él
  if (viewer.role !== "ADMIN" && raw.advisorId !== viewer.id) return null;
  const file = await applyExpiry(raw);
  const [sections, answers] = await Promise.all([loadFormVersion(file.templateVersionId), getAnswers(file.id)]);
  const progress = computeOverallProgress(sections, answers);
  const name = [answers.given_names, answers.surnames].filter((v) => typeof v === "string" && v).join(" ") || file.applicant.firstSurname;
  return { file, sections, answers, progress, name };
}
