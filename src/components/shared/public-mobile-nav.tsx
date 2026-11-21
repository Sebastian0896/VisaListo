"use client";

import { Menu } from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { NavLink } from "./nav-link";

export type PublicNavItem = { href: string; label: string; exact?: boolean };

/** Menú de las páginas públicas en móviles y tabletas (en pantallas grandes va en la barra). */
export function PublicMobileNav({ items, title }: { items: PublicNavItem[]; title: string }) {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger className="inline-flex size-9 items-center justify-center rounded-lg border bg-card xl:hidden" aria-label="Abrir menú">
        <Menu className="size-5" />
      </SheetTrigger>
      <SheetContent side="right" className="w-72 p-3">
        <SheetHeader className="px-2">
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>
        <nav className="space-y-0.5" aria-label="Menú">
          {items.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              exact={item.exact}
              onClick={() => setOpen(false)}
              className="block rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground"
              activeClassName="bg-secondary font-medium text-primary"
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
