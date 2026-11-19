import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/page-header";
import { getSettings } from "@/lib/settings";
import { SettingsForm } from "./settings-form";

export const metadata: Metadata = { title: "Configuración" };

export default async function SettingsPage() {
  const s = await getSettings();
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="Configuración" description="Datos de la plataforma, vigencia, contacto y textos informativos." />
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
