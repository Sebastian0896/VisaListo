import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Logo de FormuGuía: avión de papel cuyas alas forman la aguja de una brújula (formulario + viaje + guía).
 * - El ala azul usa currentColor (azul marino en claro, azul claro en oscuro o en la barra lateral).
 * - El centro toma el color del fondo mediante --brand-hole (por defecto, var(--background)).
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="-33 -30 64 64"
      className={cn("size-9 shrink-0 text-[#1e2f5c] dark:text-[#c9d6f5]", className)}
      aria-hidden
      focusable="false"
    >
      <path d="M-30 30 q4 -12 14 -16" fill="none" stroke="#2bc4b1" strokeWidth="3.5" strokeLinecap="round" strokeDasharray="1 7" />
      <polygon points="28,-28 -26,4 -4,4" fill="currentColor" />
      <polygon points="28,-28 -4,4 -4,26" className="fill-[#14998a] dark:fill-[#2bc4b1]" />
      <circle cx="-4" cy="4" r="4" stroke="currentColor" strokeWidth="2" style={{ fill: "var(--brand-hole, var(--background))" }} />
    </svg>
  );
}

export function Brand({ name, logoUrl, href = "/" }: { name: string; logoUrl?: string | null; href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2.5 rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logoUrl} alt="" className="size-9 rounded-xl object-contain" />
      ) : (
        <BrandMark />
      )}
      <span className="flex flex-col leading-tight">
        <span className="text-[15px] font-semibold tracking-tight text-foreground">
          {name === "FormuGuía" ? (
            <>
              Formu<span className="text-[#14998a] dark:text-[#2bc4b1]">Guía</span>
            </>
          ) : (
            name
          )}
        </span>
        <span className="text-[11px] font-medium text-muted-foreground">Asesoría privada · Preparación DS-160</span>
      </span>
    </Link>
  );
}
