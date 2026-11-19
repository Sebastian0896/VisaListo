"use client";

import { ClipboardList, FileCog, History, LayoutDashboard, MessageSquare, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/expedientes", label: "Expedientes", icon: ClipboardList, badgeKey: "submitted" as const },
  { href: "/admin/mensajes", label: "Mensajes", icon: MessageSquare, badgeKey: "unread" as const },
  { href: "/admin/formulario", label: "Formulario", icon: FileCog },
  { href: "/admin/auditoria", label: "Auditoría", icon: History },
  { href: "/admin/configuracion", label: "Configuración", icon: Settings },
];

export function SidebarNav({ badges, onNavigate }: { badges: { submitted: number; unread: number }; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="space-y-0.5" aria-label="Panel">
      {ITEMS.map((item) => {
        const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
        const badge = item.badgeKey ? badges[item.badgeKey] : 0;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition",
              active ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground" : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
            )}
          >
            <item.icon className="size-4" />
            <span className="flex-1">{item.label}</span>
            {badge > 0 && (
              <span className="rounded-full bg-white px-1.5 text-[11px] font-semibold text-sidebar tabular-nums" title={item.badgeKey === "submitted" ? "Enviados sin revisar" : "Mensajes sin leer"}>
                {badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
