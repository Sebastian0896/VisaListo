import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { storageConfigured } from "@/lib/storage";
import { purgeExpiredDocuments } from "@/server/documents";

export const runtime = "nodejs";

/** Tarea diaria (Vercel Cron): elimina fotos de documentos pasado el plazo de conservación. */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET ?? "";
  const given = Buffer.from(req.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  if (!secret || given.length !== expected.length || !timingSafeEqual(given, expected)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (!storageConfigured()) return NextResponse.json({ ok: true, purged: 0, note: "almacenamiento no configurado" });
  const purged = await purgeExpiredDocuments();
  return NextResponse.json({ ok: true, purged });
}
