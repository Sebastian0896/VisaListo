import type { Metadata } from "next";
import { AccountForm, AdminsManager } from "@/components/admin/account-forms";
import { PageHeader } from "@/components/admin/page-header";
import { db } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { getSettings } from "@/lib/settings";
import { requireAdmin } from "@/server/guards";
import { SettingsForm } from "./settings-form";

export const metadata: Metadata = { title: "Configuración" };

export default async function SettingsPage() {
  const me = await requireAdmin();
  const [s, admins] = await Promise.all([
    getSettings(),
    db.adminUser.findMany({ orderBy: { createdAt: "asc" }, select: { id: true, name: true, email: true, active: true, lastLoginAt: true } }),
  ]);
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader title="Configuración" description="Su cuenta, los asesores, y los datos de la plataforma, vigencia, contacto y textos informativos." />

      <section id="cuenta" className="scroll-mt-20 rounded-2xl border bg-white p-5 shadow-sm sm:p-6">
        <h2 className="font-semibold">Mi cuenta</h2>
        <p className="mt-0.5 mb-5 text-sm text-muted-foreground">Datos con los que inicia sesión en el panel.</p>
        <AccountForm name={me.name} email={me.email} />
      </section>

      <section className="rounded-2xl border bg-white p-5 shadow-sm sm:p-6">
        <h2 className="font-semibold">Asesores</h2>
        <p className="mt-0.5 mb-5 text-sm text-muted-foreground">Personas con acceso al panel. Un asesor desactivado pierde el acceso de inmediato.</p>
        <AdminsManager
          currentId={me.id}
          admins={admins.map((a) => ({ ...a, lastLoginAt: a.lastLoginAt ? formatDateTime(a.lastLoginAt) : null }))}
        />
      </section>

      <SettingsForm
        initial={{
          platformName: s.platformName,
          logoUrl: s.logoUrl ?? "",
          whatsappNumber: s.whatsappNumber ?? "",
          whatsappMessage: s.whatsappMessage,
          validityDays: s.validityDays,
          expiryWarningDays: s.expiryWarningDays,
          welcomeMessage: s.welcomeMessage,
          expiryMessage: s.expiryMessage,
          contactEmail: s.contactEmail ?? "",
          contactPhone: s.contactPhone ?? "",
          contactAddress: s.contactAddress ?? "",
          officeHours: s.officeHours ?? "",
          aboutText: s.aboutText,
          privacyPolicy: s.privacyPolicy,
          privacyVersion: s.privacyVersion,
        }}
      />
    </div>
  );
}
