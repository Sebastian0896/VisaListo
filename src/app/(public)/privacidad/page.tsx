import type { Metadata } from "next";
import { DisclaimerBox } from "@/components/shared/disclaimer";
import { SimpleMarkdown } from "@/components/shared/markdown";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = { title: "Política de privacidad" };
export const dynamic = "force-dynamic";

export default async function PrivacyPage() {
  const s = await getSettings();
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">Política de privacidad</h1>
      <p className="mt-1 text-sm text-muted-foreground">Versión {s.privacyVersion}</p>
      <DisclaimerBox className="my-6" />
      <div className="rounded-2xl border bg-white p-6 md:p-8">
        <SimpleMarkdown text={s.privacyPolicy || "La política de privacidad se publicará próximamente."} />
      </div>
    </div>
  );
}
