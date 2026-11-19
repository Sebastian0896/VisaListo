"use client";

import { Check, Monitor, Moon, Sun } from "lucide-react";
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

/** Tema claro / oscuro / según el sistema. Se guarda en el navegador (localStorage). */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange storageKey="visalisto-theme">
      {children}
    </NextThemesProvider>
  );
}

const OPTIONS = [
  { value: "light", label: "Claro", icon: Sun },
  { value: "dark", label: "Oscuro", icon: Moon },
  { value: "system", label: "Según el dispositivo", icon: Monitor },
] as const;

/**
 * Botón de tema. El ícono se decide con CSS (clase .dark), así el HTML del servidor
 * y el del navegador coinciden y no hay parpadeo ni error de hidratación.
 */
export function ThemeToggle({ className, variant = "default" }: { className?: string; variant?: "default" | "sidebar" }) {
  const { theme, setTheme } = useTheme();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Cambiar tema"
        title="Cambiar tema"
        className={cn(
          "inline-flex size-9 items-center justify-center rounded-lg transition outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
          variant === "sidebar"
            ? "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
            : "text-muted-foreground hover:bg-muted hover:text-foreground",
          className,
        )}
      >
        <Sun className="size-[18px] dark:hidden" />
        <Moon className="hidden size-[18px] dark:block" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        {OPTIONS.map((o) => (
          <DropdownMenuItem key={o.value} onClick={() => setTheme(o.value)}>
            <o.icon /> <span className="flex-1">{o.label}</span>
            {theme === o.value && <Check className="text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
