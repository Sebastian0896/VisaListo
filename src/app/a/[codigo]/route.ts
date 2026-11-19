import { NextResponse, type NextRequest } from "next/server";
import { normalizeAdvisorCode } from "@/lib/normalize";

/** Enlace corto para compartir: /a/K7M2QX → /comenzar?asesor=K7M2QX */
export async function GET(req: NextRequest, ctx: RouteContext<"/a/[codigo]">) {
  const { codigo } = await ctx.params;
  const code = normalizeAdvisorCode(codigo);
  const url = new URL("/comenzar", req.url);
  if (code) url.searchParams.set("asesor", code);
  return NextResponse.redirect(url);
}
