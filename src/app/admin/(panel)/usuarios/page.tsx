import type { Metadata } from "next";
import { UsersManager } from "@/components/admin/account-forms";
import { PageHeader } from "@/components/admin/page-header";
import { db } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { requireAdmin } from "@/server/guards";

export const metadata: Metadata = { title: "Usuarios" };

export default async function UsersPage() {
  const me = await requireAdmin("ADMIN");
  const users = await db.adminUser.findMany({
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    select: { id: true, name: true, email: true, role: true, active: true, lastLoginAt: true },
  });
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="Usuarios" description="Administradores y asesores con acceso al panel. Un usuario desactivado pierde el acceso de inmediato." />
      <section className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
        <UsersManager currentId={me.id} users={users.map((u) => ({ ...u, lastLoginAt: u.lastLoginAt ? formatDateTime(u.lastLoginAt) : null }))} />
      </section>
    </div>
  );
}
