import "server-only";
import { randomInt } from "node:crypto";

// Alfabeto sin caracteres ambiguos (sin O, I, L, U). 32 símbolos → 12 caracteres ≈ 60 bits.
const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

export function generateUniqueCode(): string {
  let body = "";
  for (let i = 0; i < 12; i++) body += ALPHABET[randomInt(ALPHABET.length)];
  return `DS-${body.slice(0, 4)}-${body.slice(4, 8)}-${body.slice(8, 12)}`;
}
