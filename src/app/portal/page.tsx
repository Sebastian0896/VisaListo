import { AlertTriangle, ArrowRight, CheckCircle2, Circle, Download, MessageSquare, Printer, Send } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { ExpiryCountdown } from "@/components/portal/expiry-countdown";
import { StatusBadge } from "@/components/shared/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { formatDateTime } from "@/lib/format";
import { STATUS_DESCRIPTIONS } from "@/lib/status";
import { cn } from "@/lib/utils";
import { getPortalData } from "@/server/portal";

export const metadata: Metadata = { title: "Mi expediente" };

export default async function PortalHome() {
  const { file, progress, settings, unread, canEdit } = await getPortalData();
  const nextSection = progress.perSection.find((s) => !s.completed) ?? progress.perSection[0];
  const expired = file.status === "EXPIRED";

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      {file.status === "NEEDS_CORRECTIONS" && file.correctionRequest && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-5 text-amber-950">
          <p className="flex items-center gap-2 font-semibold"><AlertTriangle className="size-5" /> Su asesor solicitó correcciones</p>
          <p className="mt-2 text-sm leading-relaxed whitespace-pre-line">{file.correctionRequest}</p>
          <p className="mt-3 text-sm">Realice los cambios indicados y vuelva a enviar el formulario desde «Revisar y enviar».</p>
        </div>
      )}
      {expired && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-rose-950">
          <p className="font-semibold">Vigencia terminada</p>
          <p className="mt-1 text-sm">{settings.expiryMessage}</p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <section className="space-y-6">
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Expediente {file.uniqueCode}</p>
                <h1 className="mt-1 text-2xl font-semibold tracking-tight">
                  {file.applicant.givenNames ? `Hola, ${file.applicant.givenNames.split(" ")[0].charAt(0)}${file.applicant.givenNames.split(" ")[0].slice(1).toLowerCase()}` : "Su formulario de preparación"}
                </h1>
              </div>
              <StatusBadge status={file.status} />
            </div>
            <p className="mt-3 max-w-2xl text-sm text-muted-foreground">{STATUS_DESCRIPTIONS[file.status]}</p>

            <div className="mt-6">
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-medium">Progreso general</span>
                <span className="text-2xl font-semibold tabular-nums">{progress.percent}%</span>
              </div>
              <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={progress.percent} aria-valuemin={0} aria-valuemax={100}>
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress.percent}%` }} />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{progress.done} de {progress.total} preguntas obligatorias respondidas</p>
            </div>

            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              {canEdit && nextSection && (
                <Link href={`/portal/formulario/${nextSection.key}`} className={cn(buttonVariants({ size: "lg" }), "h-11 px-5")}>
                  {file.status === "PENDING_START" ? "Comenzar a completar" : "Continuar formulario"} <ArrowRight />
                </Link>
              )}
              {canEdit && file.status !== "PENDING_START" && (
                <Link href="/portal/revision" className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-11 px-5")}>
                  <Send /> Revisar y enviar
                </Link>
              )}
            </div>
          </div>

          <div className="rounded-2xl border bg-white shadow-sm">
            <h2 className="border-b px-6 py-4 font-semibold">Secciones del formulario</h2>
            <ul className="divide-y">
              {progress.perSection.map((s) => (
                <li key={s.key}>
                  <Link href={`/portal/formulario/${s.key}`} className="flex items-center gap-4 px-6 py-3.5 transition hover:bg-muted/50">
                    {s.completed ? <CheckCircle2 className="size-5 shrink-0 text-emerald-600" /> : <Circle className="size-5 shrink-0 text-muted-foreground/50" />}
                    <span className="flex-1">
                      <span className="text-xs text-muted-foreground">Sección {s.order}</span>
                      <span className="block font-medium">{s.title}</span>
                    </span>
                    <span className={cn("text-xs font-medium tabular-nums", s.completed ? "text-emerald-700" : "text-muted-foreground")}>
                      {s.completed ? "Completa" : `${s.answeredRequired}/${s.totalRequired}`}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <aside className="space-y-4">
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold">Vigencia</h2>
            <div className="mt-2"><ExpiryCountdown paused={["SUBMITTED", "IN_REVIEW", "REVIEWED"].includes(file.status)} expiresAt={file.expiresAt?.toISOString() ?? null} warningDays={settings.expiryWarningDays} /></div>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between gap-2"><dt className="text-muted-foreground">Creado</dt><dd>{formatDateTime(file.createdAt)}</dd></div>
              <div className="flex justify-between gap-2"><dt className="text-muted-foreground">Iniciado</dt><dd>{formatDateTime(file.startedAt)}</dd></div>
              <div className="flex justify-between gap-2"><dt className="text-muted-foreground">Vence</dt><dd>{formatDateTime(file.expiresAt)}</dd></div>
              {file.submittedAt && <div className="flex justify-between gap-2"><dt className="text-muted-foreground">Enviado</dt><dd>{formatDateTime(file.submittedAt)}</dd></div>}
            </dl>
          </div>
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold">Su asesor</h2>
            <Link href="/portal/mensajes" className="mt-3 flex items-center justify-between rounded-lg border px-3 py-2.5 text-sm transition hover:bg-muted/50">
              <span className="flex items-center gap-2"><MessageSquare className="size-4 text-primary" /> Mensajes</span>
              {unread > 0 ? <span className="rounded-full bg-primary px-2 text-xs font-semibold text-primary-foreground">{unread} nuevo{unread > 1 ? "s" : ""}</span> : <ArrowRight className="size-4 text-muted-foreground" />}
            </Link>
          </div>
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold">Su copia</h2>
            <div className="mt-3 grid gap-2">
              <Link href="/portal/imprimir" className={cn(buttonVariants({ variant: "outline" }), "justify-start")}><Printer /> Vista para imprimir</Link>
              <a href="/api/pdf/cliente" className={cn(buttonVariants({ variant: "outline" }), "justify-start")}><Download /> Descargar PDF</a>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
