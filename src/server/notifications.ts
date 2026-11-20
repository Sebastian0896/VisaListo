import "server-only";
import { audit } from "@/lib/audit";
import { db } from "@/lib/db";
import { emailConfigured, sendEmail, siteUrl } from "@/lib/email";
import { formatDateTime } from "@/lib/format";
import { getSettings } from "@/lib/settings";
import { EXPIRABLE } from "@/lib/status";
import { getAnswers } from "./answers";

/**
 * Avisos por correo. Reglas:
 * - Nunca incluyen datos del formulario, del pasaporte ni el código del expediente completo.
 * - Solo avisan que hay algo nuevo e invitan a entrar a la plataforma.
 * - Nunca lanzan errores (se llaman desde after(), cuando la respuesta ya se envió).
 */

const LOGO_URL = "https://formuguia.com/brand/formuguia-icono-1024.png";

function esc(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

function titleCase(s: string) {
  return s.toLowerCase().replace(/(^|\s)\S/g, (m) => m.toUpperCase());
}

/** "María G." a partir de los datos de visualización del solicitante */
function shortName(givenNames: string | null, surname: string) {
  const first = givenNames?.trim().split(/\s+/)[0];
  return first ? `${titleCase(first)} ${surname.trim().charAt(0).toUpperCase()}.` : "Un solicitante";
}

type Template = { heading: string; intro: string; lines?: string[]; cta: { label: string; url: string }; note?: string };

function render(platformName: string, t: Template) {
  const lines = (t.lines ?? []).map((l) => `<p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#33405e">${l}</p>`).join("");
  const html = `<!doctype html><html lang="es"><body style="margin:0;padding:0;background:#f3f5fa">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f5fa;padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e3e8f2;border-radius:14px;font-family:Arial,Helvetica,sans-serif">
<tr><td style="padding:24px 28px 8px"><table role="presentation" cellpadding="0" cellspacing="0"><tr>
<td><img src="${LOGO_URL}" width="36" height="36" alt="" style="display:block;border:0"></td>
<td style="padding-left:10px;font-size:18px;font-weight:bold;color:#1e2f5c">${esc(platformName)}</td></tr></table></td></tr>
<tr><td style="padding:12px 28px 4px"><h1 style="margin:0 0 12px;font-size:20px;line-height:1.35;color:#1e2f5c">${t.heading}</h1>
<p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#33405e">${t.intro}</p>${lines}</td></tr>
<tr><td style="padding:8px 28px 24px"><a href="${t.cta.url}" style="display:inline-block;background:#1e2f5c;color:#ffffff;text-decoration:none;font-size:15px;font-weight:bold;padding:12px 22px;border-radius:9px">${t.cta.label}</a>
${t.note ? `<p style="margin:16px 0 0;font-size:13px;line-height:1.5;color:#6b7590">${t.note}</p>` : ""}</td></tr>
<tr><td style="padding:16px 28px;border-top:1px solid #e3e8f2;font-size:12px;line-height:1.5;color:#8a93ab">
Aviso automático de ${esc(platformName)}. Por seguridad, nunca incluimos datos de los formularios en los correos.<br>
Plataforma privada de preparación y asesoría. No es un sitio del Gobierno de los Estados Unidos.</td></tr>
</table></td></tr></table></body></html>`;
  const strip = (s: string) => s.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&");
  const text = [t.heading, "", strip(t.intro), ...(t.lines ?? []).map(strip), "", `${t.cta.label}: ${t.cta.url}`, t.note ? `\n${strip(t.note)}` : "", "", `— ${platformName}. No es un sitio del Gobierno de los Estados Unidos.`].join("\n");
  return { html, text };
}

async function deliver(input: { to: string; subject: string; template: Template; fileId: string; kind: string; recipient: "advisor" | "admin" | "client" }) {
  const settings = await getSettings();
  const { html, text } = render(settings.platformName, input.template);
  const res = await sendEmail({ to: input.to, subject: input.subject, html, text, replyTo: settings.contactEmail, fromName: settings.platformName });
  await audit({
    action: res.ok ? "email.sent" : "email.failed",
    actorType: "SYSTEM",
    fileId: input.fileId,
    details: { kind: input.kind, recipient: input.recipient, ...(res.ok ? {} : { error: res.error?.slice(0, 160) }) },
  }).catch(() => {});
  if (!res.ok) console.error(`Aviso por correo no enviado (${input.kind}):`, res.error);
}

// ───────────── Avisos al asesor ─────────────

export type AdvisorEvent = "submitted" | "message" | "linked";

export async function notifyAdvisors(fileId: string, event: AdvisorEvent) {
  try {
    if (!emailConfigured()) return;
    const file = await db.applicationFile.findUnique({
      where: { id: fileId },
      include: { applicant: true, advisor: { select: { id: true, email: true, name: true, active: true, emailNotifications: true } } },
    });
    if (!file) return;

    // Destinatarios: su asesor; si no tiene (o está inactivo), los administradores. «linked» solo al asesor.
    let recipients: { email: string; role: "advisor" | "admin" }[] = [];
    if (file.advisor?.active) {
      if (file.advisor.emailNotifications) recipients = [{ email: file.advisor.email, role: "advisor" }];
    } else if (event !== "linked") {
      const admins = await db.adminUser.findMany({ where: { role: "ADMIN", active: true, emailNotifications: true }, select: { email: true } });
      recipients = admins.map((a) => ({ email: a.email, role: "admin" as const }));
    }
    if (!recipients.length) return;

    const who = esc(shortName(file.applicant.givenNames, file.applicant.firstSurname));
    const url = `${siteUrl()}/admin/expedientes/${file.id}${event === "message" ? "#mensajes" : ""}`;
    const unassigned = !file.advisor?.active ? "<br><em>Este expediente no tiene asesor asignado.</em>" : "";
    const map: Record<AdvisorEvent, { subject: string; template: Template }> = {
      submitted: {
        subject: `Formulario enviado para revisión: ${shortName(file.applicant.givenNames, file.applicant.firstSurname)}`,
        template: { heading: "Un formulario está listo para revisar", intro: `${who} completó y envió su formulario.${unassigned}`, cta: { label: "Abrir el expediente", url } },
      },
      message: {
        subject: `Mensaje nuevo de ${shortName(file.applicant.givenNames, file.applicant.firstSurname)}`,
        template: { heading: "Tiene un mensaje nuevo", intro: `${who} le escribió en la plataforma.${unassigned}`, cta: { label: "Leer y responder", url } },
      },
      linked: {
        subject: "Un cliente nuevo se vinculó con su código",
        template: { heading: "Tiene un cliente nuevo", intro: `${who} comenzó su formulario con su código de asesor.`, cta: { label: "Ver el expediente", url } },
      },
    };
    const { subject, template } = map[event];
    for (const r of recipients) await deliver({ to: r.email, subject, template, fileId, kind: `advisor.${event}`, recipient: r.role });
  } catch (e) {
    console.error("notifyAdvisors:", (e as Error).message);
  }
}

// ───────────── Avisos al cliente ─────────────

export type ClientEvent = "reply" | "corrections" | "reviewed" | "expiry";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function notifyClient(fileId: string, event: ClientEvent) {
  try {
    if (!emailConfigured()) return false;
    const file = await db.applicationFile.findUnique({
      where: { id: fileId },
      include: { applicant: true, advisor: { select: { name: true, active: true } } },
    });
    if (!file) return false;
    const answers = await getAnswers(fileId);
    const to = typeof answers.email === "string" ? answers.email.trim() : "";
    if (!EMAIL_RE.test(to)) return false; // el cliente no dejó un correo válido en su formulario

    const first = file.applicant.givenNames?.trim().split(/\s+/)[0];
    const hello = first ? `Hola, ${esc(titleCase(first))}:` : "Hola:";
    const advisor = file.advisor?.active ? esc(titleCase(file.advisor.name)) : "su asesor";
    const url = `${siteUrl()}/recuperar`;
    const howTo = "Para entrar necesitará su código de expediente, su primer apellido, su año de nacimiento y su respuesta de seguridad.";
    const map: Record<ClientEvent, { subject: string; template: Template }> = {
      reply: {
        subject: "Tiene un mensaje nuevo de su asesor",
        template: { heading: "Su asesor le respondió", intro: `${hello} ${advisor} le escribió sobre su formulario de preparación.`, lines: ["Entre a la plataforma para leer el mensaje."], cta: { label: "Ir a mi formulario", url }, note: howTo },
      },
      corrections: {
        subject: "Su asesor solicitó correcciones en su formulario",
        template: { heading: "Hay correcciones pendientes", intro: `${hello} ${advisor} revisó su formulario y le pide corregir o aclarar algunos datos.`, lines: ["Entre a la plataforma para ver las indicaciones, haga los cambios y vuelva a enviar el formulario."], cta: { label: "Ver las correcciones", url }, note: howTo },
      },
      reviewed: {
        subject: "Su formulario fue revisado",
        template: { heading: "Revisión terminada", intro: `${hello} ${advisor} terminó de revisar su formulario de preparación.`, lines: ["Puede entrar a la plataforma para consultar el estado y descargar su copia."], cta: { label: "Ir a mi formulario", url }, note: howTo },
      },
      expiry: {
        subject: "Su formulario está por vencer",
        template: {
          heading: "Le queda poco tiempo",
          intro: `${hello} el plazo para completar su formulario de preparación vence el <strong>${esc(formatDateTime(file.expiresAt))}</strong>`,
          lines: ["Complete las secciones pendientes y envíelo a su asesor antes de esa fecha. Si necesita más tiempo, comuníquese con su asesor."],
          cta: { label: "Continuar mi formulario", url },
          note: howTo,
        },
      },
    };
    const { subject, template } = map[event];
    await deliver({ to, subject, template, fileId, kind: `client.${event}`, recipient: "client" });
    return true;
  } catch (e) {
    console.error("notifyClient:", (e as Error).message);
    return false;
  }
}

/** Tarea diaria: avisa a los clientes cuyo expediente vence dentro del período de alerta (una sola vez). */
export async function sendExpiryWarnings() {
  if (!emailConfigured()) return 0;
  const settings = await getSettings();
  const now = new Date();
  const until = new Date(now.getTime() + Math.max(1, settings.expiryWarningDays) * 86400_000);
  const due = await db.applicationFile.findMany({
    where: { status: { in: EXPIRABLE }, expiresAt: { gt: now, lte: until }, expiryWarningSentAt: null },
    select: { id: true },
    take: 100,
  });
  let sent = 0;
  for (const f of due) {
    // Se marca aunque el cliente no tenga correo, para no reintentar todos los días
    await db.applicationFile.update({ where: { id: f.id }, data: { expiryWarningSentAt: now } });
    if (await notifyClient(f.id, "expiry")) sent++;
  }
  return sent;
}
