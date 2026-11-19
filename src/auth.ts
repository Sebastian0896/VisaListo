import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import { authConfig } from "./auth.config";
import { audit } from "./lib/audit";
import { hashIp } from "./lib/crypto";
import { db } from "./lib/db";
import { verifyPassword } from "./lib/hash";

class RateLimited extends CredentialsSignin {
  code = "rate_limited";
}

const loginSchema = z.object({ email: z.string().email().max(200), password: z.string().min(1).max(200) });

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(raw, request) {
        const parsed = loginSchema.safeParse(raw);
        if (!parsed.success) return null;
        const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
        const ipHash = hashIp(ip);

        const failures = await db.recoveryAttempt.count({
          where: { kind: "admin_login", ipHash, success: false, createdAt: { gte: new Date(Date.now() - 15 * 60 * 1000) } },
        });
        if (failures >= 8) throw new RateLimited();

        const email = parsed.data.email.toLowerCase();
        const user = await db.adminUser.findUnique({ where: { email } });
        const ok = user?.active ? await verifyPassword(user.passwordHash, parsed.data.password) : false;
        await db.recoveryAttempt.create({ data: { kind: "admin_login", ipHash, success: ok } });
        if (!user || !ok) {
          await audit({ action: "admin.login_failed", actorType: "ADMIN", ipHash });
          return null;
        }
        await db.adminUser.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
        await audit({ action: "admin.login", actorType: "ADMIN", actorId: user.id, ipHash });
        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],
});
