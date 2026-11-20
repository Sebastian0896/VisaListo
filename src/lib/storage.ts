import "server-only";

/**
 * Almacenamiento privado de documentos en Supabase Storage (API REST, solo desde el servidor).
 * - Bucket privado: no existen enlaces públicos.
 * - Los archivos llegan ya cifrados (ver encryptBuffer); el proveedor nunca ve el contenido.
 */
const BUCKET = "documentos";

function config() {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new StorageNotConfigured();
  return { url, key };
}

export class StorageNotConfigured extends Error {
  constructor() {
    super("El almacenamiento de documentos no está configurado (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).");
  }
}

export function storageConfigured() {
  return !!process.env.SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY;
}

function headers(key: string, extra: Record<string, string> = {}) {
  return { Authorization: `Bearer ${key}`, apikey: key, ...extra };
}

let bucketReady = false;

/** Crea el bucket privado si no existe (idempotente). */
async function ensureBucket() {
  if (bucketReady) return;
  const { url, key } = config();
  const res = await fetch(`${url}/storage/v1/bucket`, {
    method: "POST",
    headers: headers(key, { "Content-Type": "application/json" }),
    body: JSON.stringify({ id: BUCKET, name: BUCKET, public: false, file_size_limit: 6 * 1024 * 1024 }),
  });
  // 200 = creado; 400/409 con "already exists" = ya existía
  if (!res.ok) {
    const text = await res.text();
    if (!/already exists|Duplicate/i.test(text)) throw new Error(`No se pudo preparar el almacenamiento (${res.status})`);
  }
  bucketReady = true;
}

export async function putObject(path: string, data: Buffer) {
  await ensureBucket();
  const { url, key } = config();
  const res = await fetch(`${url}/storage/v1/object/${BUCKET}/${path}`, {
    method: "POST",
    headers: headers(key, { "Content-Type": "application/octet-stream", "x-upsert": "true" }),
    body: new Uint8Array(data),
  });
  if (!res.ok) throw new Error(`No se pudo guardar el documento (${res.status})`);
}

export async function getObject(path: string): Promise<Buffer> {
  const { url, key } = config();
  const res = await fetch(`${url}/storage/v1/object/authenticated/${BUCKET}/${path}`, { headers: headers(key), cache: "no-store" });
  if (!res.ok) throw new Error(`No se pudo leer el documento (${res.status})`);
  return Buffer.from(await res.arrayBuffer());
}

export async function removeObjects(paths: string[]) {
  if (!paths.length) return;
  const { url, key } = config();
  const res = await fetch(`${url}/storage/v1/object/${BUCKET}`, {
    method: "DELETE",
    headers: headers(key, { "Content-Type": "application/json" }),
    body: JSON.stringify({ prefixes: paths }),
  });
  if (!res.ok) throw new Error(`No se pudieron eliminar documentos (${res.status})`);
}
