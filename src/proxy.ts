import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

// Primera barrera para /admin. Cada página y acción vuelve a verificar la sesión en el servidor.
export const { auth: proxy } = NextAuth(authConfig);

export const config = {
  matcher: ["/admin/:path*"],
};
