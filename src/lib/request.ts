import "server-only";
import { headers } from "next/headers";
import { hashIp } from "./crypto";

export async function getClientIpHash() {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwarded || h.get("x-real-ip") || "local";
  return hashIp(ip);
}
