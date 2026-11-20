import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { storageConfigured } from "@/lib/storage";
import { purgeExpiredDocuments } from "@/server/documents";
import { sendExpiryWarnings } from "@/server/notifications";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Tarea diaria (Vercel Cron), protegida con CRON_SECRET:
 * 1. Elimina fotos de documentos pasado el plazo de conservación.
 * 2. Avisa por correo a los clientes cuyo formulario está por vencer.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET ?? "";
  const given = Buffer.from(req.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  if (!secret || given.length !== expected.length || !timingSafeEqual(given, expected)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const result: Record<string, unknown> = { ok: true };
  try {
    result.documentsPurged = storageConfigured() ? await purgeExpiredDocuments() : "almacenamiento no configurado";
  } catch (e) {
    result.documentsError = (e as Error).message;
  }
  try {
    result.expiryWarningsSent = await sendExpiryWarnings();
  } catch (e) {
    result.expiryError = (e as Error).message;
  }
  return NextResponse.json(result);
}
