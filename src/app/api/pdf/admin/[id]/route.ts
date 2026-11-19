import { NextResponse, type NextRequest } from "next/server";
import { audit } from "@/lib/audit";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { getAdminFile } from "@/server/admin-file";
import { getAdmin } from "@/server/guards";
import { renderPreparationPdf } from "@/server/pdf/document";

export const runtime = "nodejs";

/** PDF administrativo. ?interno=1 agrega las notas internas (versión de uso interno). */
export async function GET(req: NextRequest, ctx: RouteContext<"/api/pdf/admin/[id]">) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { id } = await ctx.params;
  const data = await getAdminFile(id);
  if (!data) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  const settings = await getSettings();
  const internal = req.nextUrl.searchParams.get("interno") === "1";
  const size = req.nextUrl.searchParams.get("tam") === "A4" ? "A4" : "LETTER";
  const { file } = data;

  const pdf = await renderPreparationPdf({
    platformName: settings.platformName,
    code: file.uniqueCode,
    status: file.status,
    applicantName: data.name,
    createdAt: file.createdAt,
    submittedAt: file.submittedAt,
    percent: data.progress.percent,
    sections: data.sections,
    answers: data.answers,
    size,
    internalNotes: internal ? file.notes.map((n) => ({ body: n.body, author: n.adminUser?.name ?? "Asesor", createdAt: n.createdAt })) : undefined,
  });
  await db.document.create({ data: { applicationFileId: file.id, kind: "ADMIN_PDF", fileName: `expediente-${file.uniqueCode}.pdf`, mimeType: "application/pdf", sizeBytes: pdf.length, createdByType: "ADMIN" } });
  await audit({ action: "pdf.admin_downloaded", actorType: "ADMIN", actorId: admin.id, fileId: file.id, details: { internal, size } });

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="expediente-${file.uniqueCode}${internal ? "-interno" : ""}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
