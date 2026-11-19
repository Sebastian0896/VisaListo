import "server-only";
import { hash, verify } from "@node-rs/argon2";
import { normalizeText } from "./normalize";

// Argon2id con parámetros recomendados por OWASP (m=19 MiB, t=2, p=1).
const OPTIONS = { memoryCost: 19456, timeCost: 2, parallelism: 1 } as const;

export function hashPassword(password: string) {
  return hash(password, OPTIONS);
}

export async function verifyPassword(hashed: string, password: string) {
  try {
    return await verify(hashed, password);
  } catch {
    return false;
  }
}

/** La respuesta de seguridad se normaliza (mayúsculas, tildes, espacios) antes de hashearla. */
export function hashSecurityAnswer(answer: string) {
  return hash(normalizeText(answer), OPTIONS);
}

export async function verifySecurityAnswer(hashed: string, answer: string) {
  try {
    return await verify(hashed, normalizeText(answer));
  } catch {
    return false;
  }
}

/** Hash ficticio para igualar tiempos cuando el expediente no existe. */
let dummyHash: string | null = null;
export async function burnHashTime(answer: string) {
  dummyHash ??= await hash("respuesta-ficticia", OPTIONS);
  await verifySecurityAnswer(dummyHash, answer);
}
