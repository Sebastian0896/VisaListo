import type { Metadata } from "next";
import { getClientFileId } from "@/lib/client-session";
import { db } from "@/lib/db";
import { normalizeAdvisorCode } from "@/lib/normalize";
import { getSettings } from "@/lib/settings";
import { findAdvisorByCode } from "@/server/advisors";
import { StartWizard } from "./start-wizard";

export const metadata: Metadata = { title: "Comenzar formulario" };
export const dynamic = "force-dynamic";

export default async function StartPage(props: PageProps<"/comenzar">) {
  const sp = await props.searchParams;
  // No se redirige si ya hay sesión: tras crear el expediente, la página se vuelve a
  // renderizar con la cookie nueva y debe seguir mostrando el código al cliente.
  const hasSession = !!(await getClientFileId());

  // Llegó por el enlace de un asesor (/a/CODIGO → /comenzar?asesor=CODIGO)
  const rawCode = typeof sp.asesor === "string" ? normalizeAdvisorCode(sp.asesor) : "";
  const advisor = rawCode ? await findAdvisorByCode(rawCode) : null;

  const [questions, settings] = await Promise.all([
    db.securityQuestion.findMany({ where: { active: true }, orderBy: { order: "asc" }, select: { id: true, text: true } }),
    getSettings(),
  ]);
  return (
    <div className="mx-auto max-w-2xl px-4 py-10 md:py-14">
      <StartWizard
        questions={questions}
        welcome={settings.welcomeMessage}
        validityDays={settings.validityDays}
        hasSession={hasSession}
        initialAdvisor={advisor ? { code: rawCode, name: advisor.name } : null}
      />
    </div>
  );
}
