import { AlarmClock, ArrowRight, MessageSquare, Send } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/admin/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import type { FileStatus } from "@/generated/prisma/enums";
import { db } from "@/lib/db";
import { formatDateTime, nowMs } from "@/lib/format";
import { EXPIRABLE, STATUS_LABELS } from "@/lib/status";
import { cn } from "@/lib/utils";
import { sweepExpired } from "@/server/files";

export const metadata: Metadata = { title: "Dashboard" };

const CARDS: { status: FileStatus | "ALL"; label: string; tone: string }[] = [
  { status: "ALL", label: "Total de expedientes", tone: "border-primary/20 bg-primary text-primary-foreground" },
  { status: "PENDING_START", label: STATUS_LABELS.PENDING_START, tone: "bg-white" },
  { status: "IN_PROGRESS", label: STATUS_LABELS.IN_PROGRESS, tone: "bg-white" },
  { status: "SUBMITTED", label: STATUS_LABELS.SUBMITTED, tone: "bg-white" },
  { status: "IN_REVIEW", label: STATUS_LABELS.IN_REVIEW, tone: "bg-white" },
  { status: "NEEDS_CORRECTIONS", label: STATUS_LABELS.NEEDS_CORRECTIONS, tone: "bg-white" },
  { status: "REVIEWED", label: STATUS_LABELS.REVIEWED, tone: "bg-white" },
  { status: "EXPIRED", label: STATUS_LABELS.EXPIRED, tone: "bg-white" },
];

export default async function AdminDashboard() {
  await sweepExpired();
  const soon = new Date(nowMs() + 5 * 86400_000);
  const [grouped, total, recentSubmitted, unreadThreads, expiringSoon] = await Promise.all([
    db.applicationFile.groupBy({ by: ["status"], _count: { _all: true } }),
    db.applicationFile.count(),
    db.applicationFile.findMany({
      where: { status: "SUBMITTED" },
      orderBy: { submittedAt: "desc" },
      take: 6,
      include: { applicant: true, _count: { select: { messages: { where: { senderType: "CLIENT", readAt: null } } } } },
    }),
    db.message.groupBy({ by: ["applicationFileId"], where: { senderType: "CLIENT", readAt: null }, _count: { _all: true }, _max: { createdAt: true }, orderBy: { _max: { createdAt: "desc" } }, take: 6 }),
    db.applicationFile.findMany({
      where: { status: { in: EXPIRABLE }, expiresAt: { gt: new Date(), lte: soon } },
      orderBy: { expiresAt: "asc" },
      take: 6,
      include: { applicant: true },
    }),
  ]);
  const counts = Object.fromEntries(grouped.map((g) => [g.status, g._count._all])) as Partial<Record<FileStatus, number>>;
  const reopened = counts.REOPENED ?? 0;
  const threadFiles = await db.applicationFile.findMany({ where: { id: { in: unreadThreads.map((t) => t.applicationFileId) } }, include: { applicant: true } });
  const fileById = new Map(threadFiles.map((f) => [f.id, f]));

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader title="Dashboard" description="Resumen de los expedientes y la actividad reciente." />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {CARDS.map((c) => {
          const value = c.status === "ALL" ? total : (counts[c.status] ?? 0);
          return (
            <Link
              key={c.status}
              href={c.status === "ALL" ? "/admin/expedientes" : `/admin/expedientes?estado=${c.status}`}
              className={cn("group rounded-2xl border p-4 shadow-sm transition hover:shadow-md", c.tone)}
            >
              <p className={cn("text-xs font-medium", c.status === "ALL" ? "text-primary-foreground/75" : "text-muted-foreground")}>{c.label}</p>
              <p className="mt-1 text-3xl font-semibold tabular-nums">{value}</p>
              {c.status === "IN_PROGRESS" && reopened > 0 && <p className="text-xs text-muted-foreground">+{reopened} reabiertos</p>}
            </Link>
          );
        })}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Panel title="Nuevos envíos" icon={<Send className="size-4" />} href="/admin/expedientes?estado=SUBMITTED">
          {recentSubmitted.length === 0 && <Empty text="No hay formularios enviados pendientes de revisión." />}
          {recentSubmitted.map((f) => (
            <Row key={f.id} href={`/admin/expedientes/${f.id}`} title={[f.applicant.givenNames, f.applicant.firstSurname].filter(Boolean).join(" ")} sub={`${f.uniqueCode} · ${formatDateTime(f.submittedAt)}`}>
              {f._count.messages > 0 && <span className="rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground">{f._count.messages}</span>}
            </Row>
          ))}
        </Panel>

        <Panel title="Mensajes sin leer" icon={<MessageSquare className="size-4" />} href="/admin/mensajes">
          {unreadThreads.length === 0 && <Empty text="No hay mensajes pendientes." />}
          {unreadThreads.map((t) => {
            const f = fileById.get(t.applicationFileId);
            if (!f) return null;
            return (
              <Row key={t.applicationFileId} href={`/admin/expedientes/${f.id}#mensajes`} title={[f.applicant.givenNames, f.applicant.firstSurname].filter(Boolean).join(" ")} sub={`${f.uniqueCode} · ${formatDateTime(t._max.createdAt)}`}>
                <span className="rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground">{t._count._all}</span>
              </Row>
            );
          })}
        </Panel>

        <Panel title="Vencen en los próximos 5 días" icon={<AlarmClock className="size-4" />} href="/admin/expedientes?orden=vencimiento">
          {expiringSoon.length === 0 && <Empty text="Ningún expediente vence pronto." />}
          {expiringSoon.map((f) => (
            <Row key={f.id} href={`/admin/expedientes/${f.id}`} title={[f.applicant.givenNames, f.applicant.firstSurname].filter(Boolean).join(" ")} sub={`${f.uniqueCode} · vence ${formatDateTime(f.expiresAt)}`}>
              <StatusBadge status={f.status} />
            </Row>
          ))}
        </Panel>
      </div>
    </div>
  );
}

function Panel({ title, icon, href, children }: { title: string; icon: React.ReactNode; href: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border bg-white shadow-sm">
      <header className="flex items-center justify-between border-b px-4 py-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold">{icon} {title}</h2>
        <Link href={href} className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">Ver todo <ArrowRight className="size-3" /></Link>
      </header>
      <ul className="divide-y">{children}</ul>
    </section>
  );
}

function Row({ href, title, sub, children }: { href: string; title: string; sub: string; children?: React.ReactNode }) {
  return (
    <li>
      <Link href={href} className="flex items-center justify-between gap-3 px-4 py-3 transition hover:bg-muted/50">
        <span className="min-w-0">
          <span className="block truncate text-sm font-medium">{title || "Sin nombre"}</span>
          <span className="block truncate font-mono text-xs text-muted-foreground">{sub}</span>
        </span>
        {children}
      </Link>
    </li>
  );
}

function Empty({ text }: { text: string }) {
  return <li className="px-4 py-8 text-center text-sm text-muted-foreground">{text}</li>;
}
