import type { Metadata } from "next";
import { AccountForm, ROLE_LABELS } from "@/components/admin/account-forms";
import { PageHeader } from "@/components/admin/page-header";
import { requireAdmin } from "@/server/guards";

export const metadata: Metadata = { title: "Mi cuenta" };

export default async function AccountPage() {
  const me = await requireAdmin();
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Mi cuenta" description={`Datos con los que inicia sesión en el panel · Rol: ${ROLE_LABELS[me.role]}`} />
      <section className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
        <AccountForm name={me.name} email={me.email} />
      </section>
    </div>
  );
}
