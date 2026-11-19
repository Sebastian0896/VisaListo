import "server-only";
import { createHash } from "node:crypto";
import { cookies } from "next/headers";
import { EncryptJWT, jwtDecrypt } from "jose";

/**
 * Sesión del solicitante: cookie httpOnly con un JWT cifrado (JWE, A256GCM).
 * El identificador interno del expediente nunca viaja legible al navegador.
 */
const COOKIE = "ds_client";
const MAX_AGE_SECONDS = 60 * 60 * 2; // 2 horas de inactividad

function key() {
  const secret = process.env.CLIENT_SESSION_SECRET;
  if (!secret) throw new Error("CLIENT_SESSION_SECRET no está configurada");
  return createHash("sha256").update(secret).digest();
}

export async function setClientSession(fileId: string) {
  const token = await new EncryptJWT({ fid: fileId })
    .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .encrypt(key());
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function getClientFileId(): Promise<string | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtDecrypt(token, key());
    return typeof payload.fid === "string" ? payload.fid : null;
  } catch {
    return null;
  }
}

export async function clearClientSession() {
  const jar = await cookies();
  jar.delete(COOKIE);
}
