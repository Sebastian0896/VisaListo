"use client";

import { ChartColumn, ClipboardList, FileCog, History, LayoutDashboard, MessageSquare, Settings, UserRound, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type Item = { href: string; label: string; icon: typeof LayoutDashboard; exact?: boolean; badgeKey?: "submitted" | "unread"; adminOnly?: boolean };

const ITEMS: Item[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/expedientes", label: "Expedientes", icon: ClipboardList, badgeKey: "submitted" },
  { href: "/admin/mensajes", label: "Mensajes", icon: MessageSquare, badgeKey: "unread" },
  { href: "/admin/estadisticas", label: "Estadísticas", icon: ChartColumn },
  { href: "/admin/formulario", label: "Formulario", icon: FileCog, adminOnly: true },
  { href: "/admin/usuarios", label: "Usuarios", icon: Users, adminOnly: true },
  { href: "/admin/auditoria", label: "Auditoría", icon: History, adminOnly: true },
  { href: "/admin/configuracion", label: "Configuración", icon: Settings, adminOnly: true },
  { href: "/admin/cuenta", label: "Mi cuenta", icon: UserRound },
];

export function SidebarNav({
  badges,
  isAdmin,
  onNavigate,
}: {
  badges: { submitted: number; unread: number };
  isAdmin: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  return (
    <nav className="space-y-0.5" aria-label="Panel">
      {ITEMS.filter((i) => isAdmin || !i.adminOnly).map((item) => {
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
              <span className="rounded-full bg-sidebar-primary px-1.5 text-[11px] font-semibold text-sidebar-primary-foreground tabular-nums" title={item.badgeKey === "submitted" ? "Enviados sin revisar" : "Mensajes sin leer"}>
                {badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
