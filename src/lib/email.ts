import "server-only";

/**
 * Envío de correos transaccionales con Resend (API REST, sin SDK).
 * - Nunca lanza errores: un fallo de correo no debe romper la operación principal.
 * - EMAIL_DRY_RUN=1 escribe el correo en la consola/archivo en vez de enviarlo (pruebas locales).
 */
export type EmailMessage = {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string | null;
  fromName?: string;
};

export function emailConfigured() {
  return !!process.env.RESEND_API_KEY?.trim() || process.env.EMAIL_DRY_RUN === "1";
}

export function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://formuguia.com").replace(/\/$/, "");
}

export async function sendEmail(msg: EmailMessage): Promise<{ ok: boolean; id?: string; error?: string }> {
  const fromAddress = process.env.EMAIL_FROM_ADDRESS || "avisos@formuguia.com";
  const from = `${(msg.fromName || "FormuGuía").replace(/[<>"]/g, "")} <${fromAddress}>`;

  if (process.env.EMAIL_DRY_RUN === "1") {
    console.info(`[correo de prueba] Para: ${msg.to} | Asunto: ${msg.subject}`);
    if (process.env.EMAIL_DRY_RUN_DIR) {
      const { writeFile, mkdir } = await import("node:fs/promises");
      await mkdir(process.env.EMAIL_DRY_RUN_DIR, { recursive: true });
      const name = `${Date.now()}-${msg.subject.replace(/[^a-z0-9]+/gi, "-").slice(0, 40)}.html`;
      await writeFile(`${process.env.EMAIL_DRY_RUN_DIR}/${name}`, `<!-- Para: ${msg.to} | De: ${from} | Asunto: ${msg.subject} -->\n${msg.html}`);
    }
    return { ok: true, id: "dry-run" };
  }

  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) return { ok: false, error: "RESEND_API_KEY no configurada" };
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: [msg.to],
        subject: msg.subject,
        html: msg.html,
        text: msg.text,
        ...(msg.replyTo ? { reply_to: msg.replyTo } : {}),
      }),
    });
    const json = (await res.json().catch(() => ({}))) as { id?: string; message?: string };
    if (!res.ok) return { ok: false, error: `Resend ${res.status}: ${json.message ?? "error"}` };
    return { ok: true, id: json.id };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
