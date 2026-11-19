import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getClientFileId } from "@/lib/client-session";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { StartWizard } from "./start-wizard";

export const metadata: Metadata = { title: "Comenzar formulario" };
export const dynamic = "force-dynamic";

export default async function StartPage(props: PageProps<"/comenzar">) {
  const sp = await props.searchParams;
  // Si ya tiene una sesión activa, se le lleva a su expediente salvo que pida uno nuevo
  if (!sp.nuevo && (await getClientFileId())) redirect("/portal");
  const [questions, settings] = await Promise.all([
    db.securityQuestion.findMany({ where: { active: true }, orderBy: { order: "asc" }, select: { id: true, text: true } }),
    getSettings(),
  ]);
  return (
    <div className="mx-auto max-w-2xl px-4 py-10 md:py-14">
      <StartWizard questions={questions} welcome={settings.welcomeMessage} validityDays={settings.validityDays} />
    </div>
  );
}
