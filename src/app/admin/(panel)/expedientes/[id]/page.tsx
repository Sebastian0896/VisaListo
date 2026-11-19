import { ArrowLeft, CheckCircle2, CircleAlert, Lock, StickyNote } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { sendAdminMessageAction } from "@/actions/admin";
import { FileActions } from "@/components/admin/file-actions";
import { NoteForm } from "@/components/admin/note-form";
import { SectionAnswers } from "@/components/shared/answers-view";
import { ComposeMessage } from "@/components/shared/compose-message";
import { MessageThread } from "@/components/shared/message-thread";
import { StatusBadge } from "@/components/shared/status-badge";
import { AUDIT_LABELS } from "@/lib/audit";
import { db } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { getSettings } from "@/lib/settings";
import { STATUS_LABELS } from "@/lib/status";
import { cn } from "@/lib/utils";
import { getAdminFile } from "@/server/admin-file";
import type { FileStatus } from "@/generated/prisma/enums";

export const metadata: Metadata = { title: "Expediente" };

function describeAudit(action: string, details: unknown): string | null {
  const d = (details ?? {}) as Record<string, unknown>;
  if (action === "file.status_changed" && d.from && d.to) return `${STATUS_LABELS[d.from as FileStatus]} → ${STATUS_LABELS[d.to as FileStatus]}`;
  if (action === "answers.updated" && d.section) return `Sección «${d.section}» · ${(d.keys as string[] | undefined)?.length ?? 0} campo(s) · ${d.saves ?? 1} guardado(s)`;
  if (action === "file.extended") return `+${d.days} días · nuevo vencimiento ${formatDateTime(d.expiresAt as string)}`;
  if (action === "file.reopened") return `Vence ${formatDateTime(d.expiresAt as string)}`;
  if (action === "file.started") return `Vigencia de ${d.validityDays} días`;
  return null;
}

export default async function AdminFilePage(props: PageProps<"/admin/expedientes/[id]">) {
  const { id } = await props.params;
  const data = await getAdminFile(id);
  if (!data) notFound();
  const { file, sections, answers, progress, name } = data;
  const settings = await getSettings();

  // Al abrir el expediente, los mensajes del cliente quedan como leídos
  const unreadIds = file.messages.filter((m) => m.senderType === "CLIENT" && !m.readAt).map((m) => m.id);
  if (unreadIds.length) await db.message.updateMany({ where: { id: { in: unreadIds } }, data: { readAt: new Date() } });

  const sendMessage = sendAdminMessageAction.bind(null, file.id);
  const submissionNote = file.messages.filter((m) => m.isSubmissionNote).at(-1);

  return (
    <div className="mx-auto max-w-7xl">
      <Link href="/admin/expedientes" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Expedientes
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">{name}</h1>
            <StatusBadge status={file.status} />
          </div>
          <p className="mt-1 font-mono text-sm text-muted-foreground">{file.uniqueCode}</p>
        </div>
        <FileActions fileId={file.id} status={file.status} started={!!file.startedAt} validityDays={settings.validityDays} />
      </div>

      {unreadIds.length > 0 && (
        <a href="#mensajes" className="mb-4 block rounded-xl border border-primary/20 bg-secondary px-4 py-3 text-sm font-medium text-primary">
          {unreadIds.length} mensaje(s) nuevo(s) del solicitante · ver conversación
        </a>
      )}
      {submissionNote && (
        <div className="mb-4 rounded-xl border bg-white p-4 text-sm shadow-sm">
          <p className="text-xs font-semibold text-muted-foreground uppercase">Mensaje al enviar el formulario · {formatDateTime(submissionNote.createdAt)}</p>
          <p className="mt-1 whitespace-pre-line">{submissionNote.message}</p>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
        <div className="min-w-0 space-y-6">
          {/* Respuestas */}
          <section className="space-y-3">
            <div className="flex items-baseline justify-between">
              <h2 className="text-lg font-semibold">Respuestas</h2>
              <span className="text-sm text-muted-foreground">Formulario v{file.templateVersion.version} · {progress.percent}% completo</span>
            </div>
            {sections.map((s) => {
              const p = progress.perSection.find((x) => x.key === s.key)!;
              return (
                <details key={s.key} className="group rounded-2xl border bg-white shadow-sm" open={p.answeredCount > 0}>
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-3.5">
                    <span className="flex items-center gap-2.5">
                      {p.completed ? <CheckCircle2 className="size-5 text-emerald-600" /> : <CircleAlert className="size-5 text-amber-600" />}
                      <span className="font-semibold">{s.order}. {s.title}</span>
                    </span>
                    <span className="text-xs text-muted-foreground tabular-nums">{p.answeredRequired}/{p.totalRequired} obligatorias</span>
                  </summary>
                  <div className="border-t px-5 py-2">
                    <SectionAnswers section={s} answers={answers} />
                  </div>
                </details>
              );
            })}
          </section>

          {/* Conversación */}
          <section id="mensajes" className="scroll-mt-20 rounded-2xl border bg-white shadow-sm">
            <h2 className="border-b px-5 py-3.5 font-semibold">Conversación con el solicitante</h2>
            <div className="max-h-[32rem] overflow-y-auto bg-muted/30 p-4 sm:p-5">
              <MessageThread messages={file.messages.map((m) => ({ ...m, authorName: m.adminUser?.name }))} viewer="ADMIN" />
            </div>
            <div className="border-t p-4 sm:p-5">
              <ComposeMessage send={sendMessage} placeholder="Responder al solicitante… (lo verá en su portal)" />
            </div>
          </section>
        </div>

        <aside className="space-y-4">
          <section className="rounded-2xl border bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold">Información general</h2>
            <div className="mt-3">
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Progreso</span><span className="font-semibold">{progress.percent}%</span></div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${progress.percent}%` }} /></div>
            </div>
            <dl className="mt-4 space-y-2 text-sm">
              {[
                ["Primer apellido (verificación)", file.applicant.firstSurname],
                ["Año de nacimiento", String(file.applicant.birthYear)],
                ["Creado", formatDateTime(file.createdAt)],
                ["Inicio", formatDateTime(file.startedAt)],
                ["Vencimiento", formatDateTime(file.expiresAt)],
                ["Enviado", formatDateTime(file.submittedAt)],
                ["Revisado", formatDateTime(file.reviewedAt)],
                ["Última actividad", formatDateTime(file.lastActivityAt)],
                ["Vigencia aplicada", file.validityDays ? `${file.validityDays} días` : "—"],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3"><dt className="text-muted-foreground">{k}</dt><dd className="text-right">{v}</dd></div>
              ))}
            </dl>
            {file.lockedUntil && file.lockedUntil > new Date() && (
              <p className="mt-3 flex items-center gap-1.5 rounded-lg bg-rose-50 px-2.5 py-1.5 text-xs text-rose-800"><Lock className="size-3.5" /> Recuperación bloqueada hasta {formatDateTime(file.lockedUntil)} por intentos fallidos</p>
            )}
            {file.correctionRequest && (
              <div className="mt-3 rounded-lg bg-amber-50 p-2.5 text-xs text-amber-950">
                <p className="font-semibold">Correcciones solicitadas</p>
                <p className="mt-0.5 whitespace-pre-line">{file.correctionRequest}</p>
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-amber-200 bg-amber-50/40 p-5 shadow-sm">
            <h2 className="flex items-center gap-2 text-sm font-semibold"><StickyNote className="size-4" /> Notas internas</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">Privadas. Nunca se muestran al cliente ni en su PDF.</p>
            <div className="mt-3"><NoteForm fileId={file.id} /></div>
            <ul className="mt-4 space-y-3">
              {file.notes.map((n) => (
                <li key={n.id} className="rounded-lg border bg-white p-3 text-sm">
                  <p className="whitespace-pre-line">{n.body}</p>
                  <p className="mt-1.5 text-xs text-muted-foreground">{n.adminUser?.name ?? "Asesor"} · {formatDateTime(n.createdAt)}</p>
                </li>
              ))}
            </ul>
          </section>

          {file.reviews.length > 0 && (
            <section className="rounded-2xl border bg-white p-5 shadow-sm">
              <h2 className="text-sm font-semibold">Revisiones</h2>
              <ul className="mt-3 space-y-2.5 text-sm">
                {file.reviews.map((r) => (
                  <li key={r.id} className="border-l-2 pl-3" style={{ borderColor: r.outcome === "APPROVED" ? "#059669" : "#d97706" }}>
                    <p className="font-medium">{r.outcome === "APPROVED" ? "Revisado" : "Correcciones solicitadas"}</p>
                    {r.comments && <p className="text-muted-foreground whitespace-pre-line">{r.comments}</p>}
                    <p className="text-xs text-muted-foreground">{r.adminUser?.name ?? "Asesor"} · {formatDateTime(r.createdAt)}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="rounded-2xl border bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold">Historial de actividad</h2>
            <ol className="mt-3 space-y-3">
              {file.auditLogs.map((l) => {
                const extra = describeAudit(l.action, l.details);
                return (
                  <li key={l.id} className="relative pl-4 text-sm">
                    <span className={cn("absolute top-1.5 left-0 size-2 rounded-full", l.actorType === "ADMIN" ? "bg-primary" : l.actorType === "SYSTEM" ? "bg-slate-400" : "bg-sky-500")} />
                    <p className="font-medium">{AUDIT_LABELS[l.action] ?? l.action}</p>
                    {extra && <p className="text-xs text-muted-foreground">{extra}</p>}
                    <p className="text-xs text-muted-foreground">{l.actorType === "ADMIN" ? "Asesor" : l.actorType === "SYSTEM" ? "Sistema" : "Solicitante"} · {formatDateTime(l.updatedAt)}</p>
                  </li>
                );
              })}
            </ol>
          </section>
        </aside>
      </div>
    </div>
  );
}
