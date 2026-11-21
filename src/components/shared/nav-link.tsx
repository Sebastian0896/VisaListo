"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

/**
 * Enlace de menú que se resalta cuando estamos en su sección.
 * - exact: solo cuando la ruta coincide exactamente.
 * - match: prefijos adicionales que también cuentan como «esta sección».
 */
export function NavLink({
  href,
  exact = false,
  match = [],
  className,
  activeClassName,
  children,
}: {
  href: string;
  exact?: boolean;
  match?: string[];
  className?: string;
  activeClassName?: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const base = href.split("#")[0] || "/";
  const active = exact ? pathname === base : [base, ...match].some((p) => pathname === p || pathname.startsWith(`${p}/`));
  return (
    <Link href={href} aria-current={active ? "page" : undefined} className={cn(className, active && activeClassName)}>
      {children}
    </Link>
  );
}
