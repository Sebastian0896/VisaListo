import "server-only";
import { randomUUID } from "node:crypto";
import type { ActorType, DocumentKind } from "@/generated/prisma/enums";
import { audit } from "@/lib/audit";
import { decryptBuffer, encryptBuffer } from "@/lib/crypto";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { getObject, putObject, removeObjects } from "@/lib/storage";

export const UPLOAD_KINDS = ["PASSPORT", "NATIONAL_ID"] as const;
export type UploadKind = (typeof UPLOAD_KINDS)[number];
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024; // límite de Vercel para el cuerpo de la solicitud: 4,5 MB

export const KIND_LABELS: Record<UploadKind, string> = {
  PASSPORT: "Pasaporte (página de datos)",
  NATIONAL_ID: "Cédula / documento de identidad",
};

/** Tipo real del archivo según sus primeros bytes (no se confía en la extensión ni en el navegador). */
export function detectMime(buf: Buffer): "image/jpeg" | "image/png" | "image/webp" | "application/pdf" | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (buf.subarray(0, 4).toString("ascii") === "RIFF" && buf.subarray(8, 12).toString("ascii") === "WEBP") return "image/webp";
  if (buf.subarray(0, 5).toString("ascii") === "%PDF-") return "application/pdf";
  return null;
}

const EXT: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "application/pdf": "pdf" };

/** Sube (o reemplaza) un documento del expediente: cifra, guarda y registra. */
export async function uploadDocument(input: { fileId: string; kind: UploadKind; data: Buffer; actorType: ActorType; actorId?: string | null; ipHash?: string | null }) {
  const mime = detectMime(input.data);
  if (!mime) return { ok: false as const, error: "Formato no admitido. Suba una foto (JPG o PNG) o un PDF." };
  if (input.data.length > MAX_UPLOAD_BYTES) return { ok: false as const, error: "El archivo es demasiado grande (máximo 4 MB)." };

  const storageKey = `${input.fileId}/${input.kind.toLowerCase()}-${randomUUID()}.bin`;
  await putObject(storageKey, encryptBuffer(input.data));

  const previous = await db.document.findMany({
    where: { applicationFileId: input.fileId, kind: input.kind, deletedAt: null },
    select: { id: true, storageKey: true },
  });
  const now = new Date();
  const doc = await db.$transaction(async (tx) => {
    if (previous.length) await tx.document.updateMany({ where: { id: { in: previous.map((p) => p.id) } }, data: { deletedAt: now } });
    const created = await tx.document.create({
      data: {
        applicationFileId: input.fileId,
        kind: input.kind,
        fileName: `${input.kind.toLowerCase()}.${EXT[mime]}`,
        storageKey,
        mimeType: mime,
        sizeBytes: input.data.length,
        createdByType: input.actorType,
      },
    });
    // Un pasaporte nuevo invalida la verificación anterior del asesor
    if (input.kind === "PASSPORT") {
      await tx.applicationFile.update({ where: { id: input.fileId }, data: { passportVerifiedAt: null, passportVerifiedById: null, lastActivityAt: now } });
    }
    await audit(
      { action: "document.uploaded", actorType: input.actorType, actorId: input.actorId, fileId: input.fileId, ipHash: input.ipHash, details: { kind: input.kind, mime, bytes: input.data.length, replaced: previous.length > 0 } },
      tx,
    );
    return created;
  });

  // El archivo anterior se elimina del almacenamiento (si falla, lo recogerá el borrado programado)
  const oldKeys = previous.map((p) => p.storageKey).filter((k): k is string => !!k);
  await removeObjects(oldKeys).catch(() => {});
  return { ok: true as const, document: doc };
}

/** Documentos vigentes (no eliminados) del expediente. */
export function activeDocuments(fileId: string) {
  return db.document.findMany({
    where: { applicationFileId: fileId, kind: { in: [...UPLOAD_KINDS] as DocumentKind[] }, deletedAt: null },
    orderBy: { createdAt: "desc" },
    select: { id: true, kind: true, mimeType: true, sizeBytes: true, createdAt: true, createdByType: true },
  });
}

/** Descifra el contenido de un documento vigente. La autorización se valida antes de llamar. */
export async function readDocument(docId: string) {
  const doc = await db.document.findUnique({ where: { id: docId } });
  if (!doc || doc.deletedAt || !doc.storageKey || !UPLOAD_KINDS.includes(doc.kind as UploadKind)) return null;
  const data = decryptBuffer(await getObject(doc.storageKey));
  return { doc, data };
}

/**
 * Borrado por retención: elimina del almacenamiento las imágenes de expedientes «Revisados»
 * hace más de N días (configurable). Los registros se conservan con deletedAt para auditoría.
 */
export async function purgeExpiredDocuments() {
  const settings = await getSettings();
  const cutoff = new Date(Date.now() - settings.documentRetentionDays * 86400_000);
  const due = await db.document.findMany({
    where: {
      kind: { in: [...UPLOAD_KINDS] as DocumentKind[] },
      deletedAt: null,
      applicationFile: { status: "REVIEWED", reviewedAt: { lte: cutoff } },
    },
    select: { id: true, storageKey: true, applicationFileId: true, kind: true },
    take: 200,
  });
  if (!due.length) return 0;
  await removeObjects(due.map((d) => d.storageKey).filter((k): k is string => !!k));
  const now = new Date();
  await db.document.updateMany({ where: { id: { in: due.map((d) => d.id) } }, data: { deletedAt: now } });
  for (const d of due) {
    await audit({ action: "document.purged", actorType: "SYSTEM", fileId: d.applicationFileId, details: { kind: d.kind, retentionDays: settings.documentRetentionDays } });
  }
  return due.length;
}
