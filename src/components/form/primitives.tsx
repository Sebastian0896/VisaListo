"use client";

import { AlertTriangle, ChevronDown, CircleHelp, Lightbulb, MinusCircle } from "lucide-react";
import * as React from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { HelpDef } from "@/lib/form-types";
import { cn } from "@/lib/utils";

export function FieldError({ message, id }: { message?: string; id?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="text-[13px] font-medium text-destructive">
      {message}
    </p>
  );
}

export const NativeSelect = React.forwardRef<HTMLSelectElement, React.ComponentProps<"select">>(function NativeSelect({ className, children, ...props }, ref) {
  return (
    <div className="relative">
      <select
        ref={ref}
        className={cn(
          "h-10 w-full appearance-none rounded-lg border border-input bg-white pr-9 pl-3 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-60 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
    </div>
  );
});

/** Ícono de ayuda que abre la orientación contextual de una pregunta. */
export function HelpPopover({ help, label }: { help: HelpDef; label: string }) {
  return (
    <Popover>
      <PopoverTrigger
        className="inline-flex size-6 shrink-0 items-center justify-center rounded-full text-muted-foreground transition hover:bg-secondary hover:text-primary focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        aria-label={`Ayuda: ${label}`}
      >
        <CircleHelp className="size-[18px]" />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[min(22rem,calc(100vw-2rem))] p-0">
        <HelpBody help={help} />
      </PopoverContent>
    </Popover>
  );
}

export function HelpBody({ help, className }: { help: HelpDef; className?: string }) {
  return (
    <div className={cn("space-y-3 p-4 text-sm leading-relaxed", className)}>
      <p>{help.guidance}</p>
      {help.example && (
        <div className="flex gap-2 rounded-lg bg-secondary/70 p-2.5 text-secondary-foreground">
          <Lightbulb className="mt-0.5 size-4 shrink-0" aria-hidden />
          <p className="whitespace-pre-line"><span className="font-medium">Ejemplo: </span>{help.example}</p>
        </div>
      )}
      {help.notApplicable && (
        <div className="flex gap-2 text-muted-foreground">
          <MinusCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <p><span className="font-medium text-foreground">Si no aplica: </span>{help.notApplicable}</p>
        </div>
      )}
      {help.warning && (
        <div className="flex gap-2 rounded-lg bg-amber-50 p-2.5 text-amber-950">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <p>{help.warning}</p>
        </div>
      )}
    </div>
  );
}
