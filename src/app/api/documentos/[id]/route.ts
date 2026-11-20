import { NextResponse, type NextRequest } from "next/server";
import { audit } from "@/lib/audit";
import { getClientFileId } from "@/lib/client-session";
import { db } from "@/lib/db";
import { canAccessFile } from "@/server/advisors";
import { readDocument } from "@/server/documents";
import { getAdmin } from "@/server/guards";

export const runtime = "nodejs";

/**
 * Muestra un documento descifrado. Acceso: el cliente dueño del expediente (por cookie)
 * o un usuario del panel con acceso a ese expediente. Nunca hay enlaces públicos ni caché.
 */
export async function GET(_req: NextRequest, ctx: RouteContext<"/api/documentos/[id]">) {
  const { id } = await ctx.params;
  const meta = await db.document.findUnique({ where: { id }, select: { applicationFileId: true, kind: true, deletedAt: true } });
  if (!meta || meta.deletedAt) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const admin = await getAdmin();
  const clientFileId = admin ? null : await getClientFileId();
  const allowed = admin ? await canAccessFile(admin, meta.applicationFileId) : clientFileId === meta.applicationFileId;
  if (!allowed) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  try {
    const result = await readDocument(id);
    if (!result) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    if (admin) {
      await audit({ action: "document.viewed", actorType: "ADMIN", actorId: admin.id, fileId: meta.applicationFileId, details: { kind: meta.kind } });
    }
    return new NextResponse(new Uint8Array(result.data), {
      headers: {
        "Content-Type": result.doc.mimeType ?? "application/octet-stream",
        "Content-Disposition": `inline; filename="${result.doc.fileName}"`,
        "Cache-Control": "private, no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; sandbox",
      },
    });
  } catch (e) {
    console.error("Error al leer documento", (e as Error).message);
    return NextResponse.json({ error: "No se pudo abrir el documento." }, { status: 500 });
  }
}
