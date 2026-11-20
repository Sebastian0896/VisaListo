import { NextResponse, type NextRequest } from "next/server";
import { getClientFileId } from "@/lib/client-session";
import { db } from "@/lib/db";
import { getClientIpHash } from "@/lib/request";
import { getSettings } from "@/lib/settings";
import { StorageNotConfigured } from "@/lib/storage";
import { MAX_UPLOAD_BYTES, UPLOAD_KINDS, uploadDocument, type UploadKind } from "@/server/documents";
import { clientCanEdit, getClientFile, isRateLimited, recordAttempt } from "@/server/files";

export const runtime = "nodejs";

/** Subida de documentos por el cliente (su expediente se identifica solo por la cookie de sesión). */
export async function POST(req: NextRequest) {
  const fileId = await getClientFileId();
  if (!fileId) return NextResponse.json({ error: "Su sesión expiró. Vuelva a ingresar con su código." }, { status: 401 });
  const file = await getClientFile(fileId);
  if (!file) return NextResponse.json({ error: "Sesión no válida." }, { status: 401 });
  if (!clientCanEdit(file)) return NextResponse.json({ error: "Su formulario no se puede modificar en este momento." }, { status: 403 });

  const ipHash = await getClientIpHash();
  if (await isRateLimited("upload", ipHash, 20, 60 * 60 * 1000, false)) {
    return NextResponse.json({ error: "Ha subido demasiados archivos. Espere un momento." }, { status: 429 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "No se pudo leer el archivo. Intente con una imagen más pequeña." }, { status: 400 });
  }
  const kind = form.get("kind");
  const upload = form.get("file");
  if (typeof kind !== "string" || !UPLOAD_KINDS.includes(kind as UploadKind)) return NextResponse.json({ error: "Tipo de documento no válido." }, { status: 400 });
  if (!(upload instanceof File)) return NextResponse.json({ error: "Seleccione un archivo." }, { status: 400 });
  if (upload.size > MAX_UPLOAD_BYTES) return NextResponse.json({ error: "El archivo es demasiado grande (máximo 4 MB)." }, { status: 413 });

  // Consentimiento específico para el tratamiento de la imagen del documento (una vez por expediente)
  const consented = await db.consentRecord.findFirst({ where: { applicationFileId: fileId, kind: "document_processing" }, select: { id: true } });
  if (!consented) {
    if (form.get("consent") !== "1") return NextResponse.json({ error: "Debe aceptar el tratamiento de la imagen de su documento." }, { status: 400 });
    const settings = await getSettings();
    await db.consentRecord.create({ data: { applicationFileId: fileId, kind: "document_processing", version: settings.privacyVersion, ipHash } });
  }

  try {
    const res = await uploadDocument({ fileId, kind: kind as UploadKind, data: Buffer.from(await upload.arrayBuffer()), actorType: "CLIENT", ipHash });
    await recordAttempt("upload", ipHash, res.ok);
    if (!res.ok) return NextResponse.json({ error: res.error }, { status: 400 });
    return NextResponse.json({ ok: true, id: res.document.id, createdAt: res.document.createdAt });
  } catch (e) {
    if (e instanceof StorageNotConfigured) return NextResponse.json({ error: "La carga de documentos no está disponible en este momento." }, { status: 503 });
    console.error("Error al subir documento", (e as Error).message);
    return NextResponse.json({ error: "No se pudo guardar el documento. Inténtelo de nuevo." }, { status: 500 });
  }
}
