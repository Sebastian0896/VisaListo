import { LogOut } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { adminLogoutAction } from "@/actions/admin";
import { MobileNav } from "@/components/admin/mobile-nav";
import { SidebarNav } from "@/components/admin/sidebar-nav";
import { BrandMark } from "@/components/shared/brand";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { ThemeToggle } from "@/components/shared/theme";
import { requireAdmin } from "@/server/guards";

export const metadata: Metadata = { title: { default: "Panel", template: "%s · Panel de gestión" }, robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const admin = await requireAdmin();
  const [settings, submitted, unread] = await Promise.all([
    getSettings(),
    db.applicationFile.count({ where: { status: "SUBMITTED" } }),
    db.message.count({ where: { senderType: "CLIENT", readAt: null } }),
  ]);
  const badges = { submitted, unread };
  return (
    <div className="flex min-h-screen">
      <aside className="no-print sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-sidebar p-3 text-sidebar-foreground lg:flex">
        <div className="flex items-center gap-2.5 px-2 py-3">
          <BrandMark className="bg-sidebar-primary text-sidebar-primary-foreground" />
          <div className="leading-tight">
            <p className="text-sm font-semibold">{settings.platformName}</p>
            <p className="text-[11px] text-sidebar-foreground/60">Panel de gestión</p>
          </div>
        </div>
        <div className="mt-4 flex-1">
          <SidebarNav badges={badges} isAdmin={admin.role === "ADMIN"} />
        </div>
        <div className="border-t border-sidebar-border px-2 pt-3">
          <Link href="/admin/cuenta" className="block rounded-md hover:text-white" title="Mi cuenta">
            <p className="truncate text-sm font-medium">{admin.name}</p>
            <p className="truncate text-xs text-sidebar-foreground/60">{admin.role === "ADMIN" ? "Administrador" : "Asesor"} · {admin.email}</p>
          </Link>
          <div className="mt-2 flex items-center gap-1">
            <form action={adminLogoutAction} className="flex-1">
              <Button type="submit" variant="ghost" size="sm" className="w-full justify-start text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground">
                <LogOut /> Cerrar sesión
              </Button>
            </form>
            <ThemeToggle variant="sidebar" />
          </div>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="no-print sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b bg-background/90 px-4 backdrop-blur lg:hidden">
          <div className="flex items-center gap-3">
            <MobileNav badges={badges} title={settings.platformName} isAdmin={admin.role === "ADMIN"} />
            <span className="text-sm font-semibold">Panel de gestión</span>
          </div>
          <div className="flex items-center">
            <ThemeToggle />
            <form action={adminLogoutAction}>
              <Button type="submit" variant="ghost" size="icon" aria-label="Cerrar sesión"><LogOut /></Button>
            </form>
          </div>
        </header>
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
