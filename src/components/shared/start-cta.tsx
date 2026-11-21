"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";

function useOnStartPage() {
  return usePathname() === "/comenzar";
}

/** Envuelve otros accesos a «Comenzar» (p. ej. en el pie) para ocultarlos en esa misma página. */
export function HideOnStartPage({ children }: { children: React.ReactNode }) {
  return useOnStartPage() ? null : children;
}

/**
 * Botón «Comenzar» del encabezado. Se oculta en la propia página de comenzar:
 * ahí sobra y, si el cliente llegó con el enlace de un asesor (?asesor=…),
 * pulsarlo lo llevaría a /comenzar sin el código y perdería la vinculación.
 */
export function StartCta() {
  if (useOnStartPage()) return null;
  return (
    <Link href="/comenzar" className={buttonVariants()}>
      Comenzar
    </Link>
  );
}
