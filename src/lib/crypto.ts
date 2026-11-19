import "server-only";
import { createCipheriv, createDecipheriv, createHmac, randomBytes } from "node:crypto";

/**
 * Cifrado autenticado AES-256-GCM para datos sensibles en reposo.
 * Formato: "v1:<iv b64>:<tag b64>:<ciphertext b64>". El prefijo de versión permite rotar claves.
 */
const VERSION = "v1";

function getKey(): Buffer {
  const raw = process.env.ENCRYPTION_KEY;
  if (!raw) throw new Error("ENCRYPTION_KEY no está configurada");
  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) throw new Error("ENCRYPTION_KEY debe tener 32 bytes en base64");
  return key;
}

export function encrypt(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getKey(), iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [VERSION, iv.toString("base64"), tag.toString("base64"), enc.toString("base64")].join(":");
}

export function decrypt(payload: string): string {
  const [version, ivB64, tagB64, dataB64] = payload.split(":");
  if (version !== VERSION || !ivB64 || !tagB64 || dataB64 === undefined) {
    throw new Error("Formato de dato cifrado no reconocido");
  }
  const decipher = createDecipheriv("aes-256-gcm", getKey(), Buffer.from(ivB64, "base64"));
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(dataB64, "base64")), decipher.final()]).toString("utf8");
}

export function encryptJson(value: unknown): string {
  return encrypt(JSON.stringify(value));
}

export function decryptJson<T = unknown>(payload: string): T | null {
  try {
    return JSON.parse(decrypt(payload)) as T;
  } catch {
    return null;
  }
}

/** Hash con pimienta de la IP: permite limitar intentos sin guardar la IP en claro. */
export function hashIp(ip: string | null | undefined): string {
  const secret = process.env.IP_HASH_SECRET ?? "dev-ip-secret";
  return createHmac("sha256", secret).update(ip || "unknown").digest("hex").slice(0, 32);
}
