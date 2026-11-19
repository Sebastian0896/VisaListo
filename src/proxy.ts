import NextAuth from "next-auth";
import type { NextFetchEvent, NextRequest } from "next/server";
import { authConfig } from "./auth.config";

// Primera barrera para /admin (callback `authorized` de auth.config.ts).
// Cada página y acción vuelve a verificar la sesión en el servidor.
const { auth } = NextAuth(authConfig);
const authProxy = auth as unknown as (req: NextRequest, event: NextFetchEvent) => Promise<Response | undefined>;

export function proxy(request: NextRequest, event: NextFetchEvent) {
  return authProxy(request, event);
}

export const config = {
  matcher: ["/admin/:path*"],
};
