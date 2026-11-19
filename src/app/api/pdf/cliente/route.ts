import { NextResponse, type NextRequest } from "next/server";
import { audit } from "@/lib/audit";
import { getClientFileId } from "@/lib/client-session";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { computeOverallProgress, getAnswers } from "@/server/answers";
import { getClientFile } from "@/server/files";
import { loadFormVersion } from "@/server/form";
import { renderPreparationPdf } from "@/server/pdf/document";

export const runtime = "nodejs";

/** PDF del cliente: identifica el expediente solo por la cookie de sesión. Nunca incluye notas internas. */
export async function GET(req: NextRequest) {
  const fileId = await getClientFileId();
  if (!fileId) return NextResponse.redirect(new URL("/recuperar?sesion=expirada", req.url));
  const file = await getClientFile(fileId);
  if (!file) return NextResponse.redirect(new URL("/recuperar?sesion=expirada", req.url));

  const [sections, answers, settings] = await Promise.all([loadFormVersion(file.templateVersionId), getAnswers(file.id), getSettings()]);
  const progress = computeOverallProgress(sections, answers);
  const size = req.nextUrl.searchParams.get("tam") === "A4" ? "A4" : "LETTER";
  const name = [answers.given_names, answers.surnames].filter((v) => typeof v === "string" && v).join(" ") || file.applicant.firstSurname;

  const pdf = await renderPreparationPdf({
    platformName: settings.platformName,
    code: file.uniqueCode,
    status: file.status,
    applicantName: name,
    createdAt: file.createdAt,
    submittedAt: file.submittedAt,
    percent: progress.percent,
    sections,
    answers,
    size,
  });
  await db.document.create({ data: { applicationFileId: file.id, kind: "CLIENT_PDF", fileName: `preparacion-${file.uniqueCode}.pdf`, mimeType: "application/pdf", sizeBytes: pdf.length, createdByType: "CLIENT" } });
  await audit({ action: "pdf.client_downloaded", actorType: "CLIENT", fileId: file.id, details: { size } });

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="preparacion-${file.uniqueCode}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
