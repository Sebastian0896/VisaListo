"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";

/**
 * Botón «Comenzar» del encabezado. Se oculta en la propia página de comenzar:
 * ahí sobra y, si el cliente llegó con el enlace de un asesor (?asesor=…),
 * pulsarlo lo llevaría a /comenzar sin el código y perdería la vinculación.
 */
export function StartCta() {
  const pathname = usePathname();
  if (pathname === "/comenzar") return null;
  return (
    <Link href="/comenzar" className={buttonVariants()}>
      Comenzar
    </Link>
  );
}
