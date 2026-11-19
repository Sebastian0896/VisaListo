export function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91A9.85 9.85 0 0 0 12.04 2Zm5.8 14.16c-.24.68-1.42 1.3-1.95 1.35-.5.05-.97.23-3.27-.68-2.77-1.09-4.52-3.92-4.66-4.1-.13-.18-1.11-1.48-1.11-2.82 0-1.34.7-2 .95-2.27.25-.27.54-.34.72-.34h.52c.17 0 .39-.06.61.47.24.55.79 1.89.86 2.03.07.14.11.3.02.48-.09.18-.14.3-.27.46l-.41.48c-.14.14-.28.29-.12.56.16.27.71 1.17 1.52 1.9 1.05.93 1.93 1.22 2.2 1.36.27.14.43.11.59-.07.16-.18.68-.79.86-1.06.18-.27.36-.23.61-.14.25.09 1.59.75 1.86.89.27.14.45.2.52.32.07.11.07.66-.17 1.34Z" />
    </svg>
  );
}

export function WhatsAppFloat({ href, label = "¿Necesita ayuda?" }: { href: string | null; label?: string }) {
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="no-print fixed right-4 bottom-4 z-40 flex items-center gap-2 rounded-full bg-[#1f9d55] py-3 pr-4 pl-3 text-sm font-medium text-white shadow-lg shadow-black/15 transition hover:bg-[#188a49] focus-visible:ring-4 focus-visible:ring-[#1f9d55]/30 focus-visible:outline-none sm:right-6 sm:bottom-6"
      aria-label={`WhatsApp: ${label}`}
    >
      <WhatsAppIcon className="size-6" />
      <span className="hidden sm:inline">{label}</span>
    </a>
  );
}
