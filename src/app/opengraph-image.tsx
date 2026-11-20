import { ImageResponse } from "next/og";

// Tarjeta que aparece al compartir formuguia.com en WhatsApp, Facebook, LinkedIn, etc.
export const alt = "FormuGuía · Preparación guiada del formulario DS-160 con asesoría en español";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const LOGO = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-33 -30 64 64"><path d="M-30 30 q4 -12 14 -16" fill="none" stroke="#2bc4b1" stroke-width="3.5" stroke-linecap="round" stroke-dasharray="1 7"/><polygon points="28,-28 -26,4 -4,4" fill="#1e2f5c"/><polygon points="28,-28 -4,4 -4,26" fill="#14998a"/><circle cx="-4" cy="4" r="4" fill="#ffffff" stroke="#1e2f5c" stroke-width="2"/></svg>`;

export default function OpenGraphImage() {
  const logo = `data:image/svg+xml;base64,${Buffer.from(LOGO).toString("base64")}`;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", background: "#f6f8fc", padding: "0 80px", gap: 56 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logo} width={260} height={260} alt="" />
        <div style={{ display: "flex", flexDirection: "column", width: 720 }}>
          <div style={{ display: "flex", fontSize: 104, letterSpacing: -3 }}>
            <span style={{ color: "#1e2f5c" }}>Formu</span>
            <span style={{ color: "#14998a", marginLeft: -14 }}>Guía</span>
          </div>
          <div style={{ fontSize: 40, color: "#33405e", marginTop: 12 }}>Preparación guiada del formulario DS-160</div>
          <div style={{ fontSize: 27, color: "#6b7590", marginTop: 26, lineHeight: 1.4 }}>Asesoría privada en español. No es un sitio del Gobierno de los Estados Unidos.</div>
        </div>
      </div>
    ),
    size,
  );
}
