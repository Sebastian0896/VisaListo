"use client";

import { AlertTriangle, Clock, Hourglass } from "lucide-react";
import { useSyncExternalStore } from "react";
import { formatRemaining } from "@/lib/format";
import { cn } from "@/lib/utils";

// Reloj compartido que avanza cada 30 s (null durante el render del servidor)
const TICK = 30_000;
const subscribe = (cb: () => void) => {
  const t = setInterval(cb, TICK);
  return () => clearInterval(t);
};
const getSnapshot = () => Math.floor(Date.now() / TICK) * TICK;
const getServerSnapshot = () => null;

export function ExpiryCountdown({ expiresAt, warningDays, compact = false }: { expiresAt: string | null; warningDays: number; compact?: boolean }) {
  const now = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  if (!expiresAt) {
    return (
      <span className={cn("inline-flex items-center gap-1.5 text-muted-foreground", compact ? "text-xs" : "text-sm")}>
        <Hourglass className="size-3.5" /> La vigencia comienza con su primera respuesta
      </span>
    );
  }
  if (now === null) return <span className="text-xs text-muted-foreground">…</span>;
  const ms = new Date(expiresAt).getTime() - now;
  const warning = ms > 0 && ms < warningDays * 86400_000;
  const expired = ms <= 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-medium",
        compact ? "text-xs" : "text-sm",
        expired ? "text-rose-700" : warning ? "text-amber-700" : "text-foreground/80",
      )}
    >
      {expired || warning ? <AlertTriangle className="size-3.5" /> : <Clock className="size-3.5" />}
      {expired ? "Vigencia terminada" : `Quedan ${formatRemaining(ms)}`}
    </span>
  );
}
