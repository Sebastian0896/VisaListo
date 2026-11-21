"use client";

import { Analytics } from "@vercel/analytics/next";

// Zonas privadas: no se miden (ni el portal del cliente, ni el panel, ni la API).
const PRIVATE = ["/portal", "/admin", "/api"];

/**
 * Vercel Web Analytics solo para las páginas públicas.
 * Sin cookies; además se quita la query (?asesor=…) para no guardar códigos.
 */
export function WebAnalytics() {
  return (
    <Analytics
      beforeSend={(event) => {
        const url = new URL(event.url);
        if (PRIVATE.some((p) => url.pathname === p || url.pathname.startsWith(`${p}/`))) return null;
        url.search = "";
        url.hash = "";
        return { ...event, url: url.toString() };
      }}
    />
  );
}
