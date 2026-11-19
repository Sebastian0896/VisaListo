import Link from "next/link";
import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
  return (
    <span className={cn("grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm", className)} aria-hidden>
      <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7 3h7l5 5v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
        <path d="M14 3v5h5" />
        <path d="m9 14 2 2 4-4" />
      </svg>
    </span>
  );
}

export function Brand({ name, logoUrl, href = "/", inverted = false }: { name: string; logoUrl?: string | null; href?: string; inverted?: boolean }) {
  return (
    <Link href={href} className="flex items-center gap-2.5 rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logoUrl} alt="" className="size-9 rounded-xl object-contain" />
      ) : (
        <BrandMark className={inverted ? "bg-card text-primary" : undefined} />
      )}
      <span className="flex flex-col leading-tight">
        <span className={cn("text-[15px] font-semibold tracking-tight", inverted ? "text-white" : "text-foreground")}>{name}</span>
        <span className={cn("text-[11px] font-medium", inverted ? "text-white/70" : "text-muted-foreground")}>Asesoría privada · Preparación DS-160</span>
      </span>
    </Link>
  );
}
