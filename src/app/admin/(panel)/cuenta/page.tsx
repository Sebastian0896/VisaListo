import type { Metadata } from "next";
import { headers } from "next/headers";
import { AccountForm } from "@/components/admin/account-forms";
import { ROLE_LABELS } from "@/lib/roles";
import { AdvisorCodeCard } from "@/components/admin/advisor-code-card";
import { PageHeader } from "@/components/admin/page-header";
import { db } from "@/lib/db";
import { requireAdmin } from "@/server/guards";

export const metadata: Metadata = { title: "Mi cuenta" };

export default async function AccountPage() {
  const me = await requireAdmin();
  const [extra, h] = await Promise.all([
    db.adminUser.findUnique({ where: { id: me.id }, select: { advisorCode: true, whatsappNumber: true, contactHours: true, emailNotifications: true } }),
    headers(),
  ]);
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3002";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const code = extra?.advisorCode ?? "";
  const link = `${proto}://${host}/a/${code}`;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title="Mi cuenta" description={`Datos con los que inicia sesión en el panel · Rol: ${ROLE_LABELS[me.role]}`} />
      <section className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
        <h2 className="font-semibold">Mi código de asesor</h2>
        <p className="mt-0.5 mb-5 text-sm text-muted-foreground">Compártalo con sus clientes para que sus expedientes le lleguen a usted.</p>
        <AdvisorCodeCard code={code} link={link} />
      </section>
      <section className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
        <h2 className="mb-5 font-semibold">Datos de acceso y contacto</h2>
        <AccountForm name={me.name} email={me.email} whatsappNumber={extra?.whatsappNumber ?? ""} contactHours={extra?.contactHours ?? ""} emailNotifications={extra?.emailNotifications ?? true} />
      </section>
    </div>
  );
}
