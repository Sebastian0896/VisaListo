import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const sans = Geist({ variable: "--font-sans", subsets: ["latin"] });
const mono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

// Plataforma privada y 100 % dinámica: ninguna página se genera en el build
// (todas leen la configuración o la sesión desde la base de datos).
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { default: "VisaListo · Preparación de formulario DS-160", template: "%s · VisaListo" },
  description:
    "VisaListo: plataforma privada de preparación y asesoría para el formulario DS-160. No es un sitio del Gobierno de los Estados Unidos.",
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${sans.variable} ${mono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <TooltipProvider>{children}</TooltipProvider>
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
