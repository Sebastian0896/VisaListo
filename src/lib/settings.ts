import "server-only";
import { cache } from "react";
import { db } from "./db";

export const getSettings = cache(async () => {
  const s = await db.platformSettings.findUnique({ where: { id: 1 } });
  if (s) return s;
  return db.platformSettings.create({ data: { id: 1 } });
});

export function whatsappLink(number: string | null | undefined, message: string, code?: string | null) {
  const digits = (number || process.env.NEXT_PUBLIC_DEFAULT_WHATSAPP || "").replace(/\D/g, "");
  if (!digits) return null;
  const text = message.replace("{codigo}", code ?? "______");
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}
