import "server-only";
import { cache } from "react";
import { db } from "@/lib/db";
import { getSettings, whatsappLink } from "@/lib/settings";
import { computeOverallProgress, getAnswers } from "./answers";
import { clientCanEdit } from "./files";
import { loadFormVersion } from "./form";
import { requireClientFile } from "./guards";

export type PortalContact = {
  /** Nombre del asesor vinculado (null si el expediente no tiene asesor activo) */
  advisorName: string | null;
  /** true si el WhatsApp es el del asesor; false si es el general de la oficina */
  isAdvisorNumber: boolean;
  whatsappHref: string | null;
  phoneDisplay: string | null;
  telHref: string | null;
  hours: string | null;
};

/**
 * Contacto que ve el cliente: su asesor vinculado (si está activo y configuró WhatsApp)
 * o, en su defecto, la oficina. Solo se usa dentro del portal autenticado.
 */
function buildContact(
  advisor: { name: string; whatsappNumber: string | null; contactHours: string | null; active: boolean } | null,
  settings: { whatsappNumber: string | null; whatsappMessage: string; officeHours: string | null },
  code: string,
): PortalContact {
  const activeAdvisor = advisor?.active ? advisor : null;
  const advisorNumber = activeAdvisor?.whatsappNumber?.trim() || null;
  const number = advisorNumber ?? settings.whatsappNumber?.trim() ?? null;
  const digits = number?.replace(/\D/g, "") ?? "";
  const greeting = activeAdvisor && advisorNumber ? settings.whatsappMessage.replace(/^Hola,?/i, `Hola ${titleCase(activeAdvisor.name.split(" ")[0])},`) : settings.whatsappMessage;
  return {
    advisorName: activeAdvisor?.name ?? null,
    isAdvisorNumber: !!advisorNumber,
    whatsappHref: whatsappLink(number, greeting, code),
    phoneDisplay: number || null,
    telHref: digits ? `tel:+${digits}` : null,
    hours: (advisorNumber ? activeAdvisor?.contactHours : settings.officeHours) || null,
  };
}

function titleCase(word: string) {
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

/** Datos del portal del cliente autenticado (una sola carga por solicitud). */
export const getPortalData = cache(async () => {
  const file = await requireClientFile();
  const [sections, answers, settings, unread] = await Promise.all([
    loadFormVersion(file.templateVersionId),
    getAnswers(file.id),
    getSettings(),
    db.message.count({ where: { applicationFileId: file.id, senderType: "ADMIN", readAt: null } }),
  ]);
  const progress = computeOverallProgress(sections, answers);
  const contact = buildContact(file.advisor, settings, file.uniqueCode);
  return { file, sections, answers, settings, progress, unread, contact, canEdit: clientCanEdit(file) };
});
