"use client";

import { Menu } from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { SidebarNav } from "./sidebar-nav";

export function MobileNav({ badges, title, isAdmin }: { badges: { submitted: number; unread: number }; title: string; isAdmin: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger className="inline-flex size-9 items-center justify-center rounded-lg border bg-card" aria-label="Abrir menú">
        <Menu className="size-5" />
      </SheetTrigger>
      <SheetContent side="left" className="w-72 border-sidebar-border bg-sidebar p-3 text-sidebar-foreground">
        <SheetHeader className="px-2">
          <SheetTitle className="text-sidebar-foreground">{title}</SheetTitle>
        </SheetHeader>
        <SidebarNav badges={badges} isAdmin={isAdmin} onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
