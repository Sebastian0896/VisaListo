import { MessageSquare } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/admin/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { db } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { fileScope } from "@/server/advisors";
import { requireAdmin } from "@/server/guards";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Mensajes" };

export default async function AdminMessagesPage() {
  // Conversaciones ordenadas por último mensaje
  const me = await requireAdmin();
  const threads = await db.message.groupBy({
    by: ["applicationFileId"],
    where: { applicationFile: fileScope(me) },
    _max: { createdAt: true },
    orderBy: { _max: { createdAt: "desc" } },
    take: 100,
  });
  const ids = threads.map((t) => t.applicationFileId);
  const [files, unread, lastMessages] = await Promise.all([
    db.applicationFile.findMany({ where: { id: { in: ids } }, include: { applicant: true } }),
    db.message.groupBy({ by: ["applicationFileId"], where: { applicationFileId: { in: ids }, senderType: "CLIENT", readAt: null }, _count: { _all: true } }),
    Promise.all(ids.map((id) => db.message.findFirst({ where: { applicationFileId: id }, orderBy: { createdAt: "desc" } }))),
  ]);
  const fileById = new Map(files.map((f) => [f.id, f]));
  const unreadById = new Map(unread.map((u) => [u.applicationFileId, u._count._all]));

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title="Mensajes" description="Conversaciones con los solicitantes. Las no leídas aparecen resaltadas." />
      <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        {threads.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-16 text-center text-muted-foreground">
            <MessageSquare className="size-8 opacity-40" />
            <p className="text-sm">Todavía no hay conversaciones.</p>
          </div>
        )}
        <ul className="divide-y">
          {ids.map((id, i) => {
            const f = fileById.get(id);
            const last = lastMessages[i];
            if (!f || !last) return null;
            const count = unreadById.get(id) ?? 0;
            return (
              <li key={id}>
                <Link href={`/admin/expedientes/${id}#mensajes`} className={cn("flex items-start gap-4 px-5 py-4 transition hover:bg-muted/40", count > 0 && "bg-secondary/40")}>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={cn("font-medium", count > 0 && "font-semibold")}>{[f.applicant.givenNames, f.applicant.firstSurname].filter(Boolean).join(" ")}</span>
                      <span className="font-mono text-xs text-muted-foreground">{f.uniqueCode}</span>
                      <StatusBadge status={f.status} />
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      <span className="font-medium text-foreground/80">{last.senderType === "ADMIN" ? "Usted: " : ""}</span>
                      {last.message}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <span className="text-xs text-muted-foreground">{formatDateTime(last.createdAt)}</span>
                    {count > 0 && <span className="rounded-full bg-primary px-2 text-xs font-semibold text-primary-foreground">{count}</span>}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
