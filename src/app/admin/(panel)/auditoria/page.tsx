import { requireAdmin } from "@/server/guards";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/admin/page-header";
import { NativeSelect } from "@/components/form/primitives";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Prisma } from "@/generated/prisma/client";
import { AUDIT_LABELS } from "@/lib/audit";
import { db } from "@/lib/db";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Auditoría" };

export default async function AuditPage(props: PageProps<"/admin/auditoria">) {
  await requireAdmin("ADMIN");
  const sp = await props.searchParams;
  const action = typeof sp.accion === "string" ? sp.accion : "";
  const where: Prisma.AuditLogWhereInput = action && AUDIT_LABELS[action] ? { action } : {};
  const logs = await db.auditLog.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    take: 200,
    include: { applicationFile: { select: { id: true, uniqueCode: true } } },
  });
  const adminIds = [...new Set(logs.filter((l) => l.actorType === "ADMIN" && l.actorId).map((l) => l.actorId!))];
  const admins = await db.adminUser.findMany({ where: { id: { in: adminIds } }, select: { id: true, name: true } });
  const adminName = new Map(admins.map((a) => [a.id, a.name]));

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader title="Auditoría" description="Registro de eventos importantes (últimos 200). Nunca incluye valores de respuestas." />
      <form className="mb-4 flex max-w-md gap-2">
        <NativeSelect name="accion" defaultValue={action} aria-label="Tipo de evento">
          <option value="">Todos los eventos</option>
          {Object.entries(AUDIT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </NativeSelect>
        <Button type="submit" className="h-10">Filtrar</Button>
      </form>
      <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Fecha</TableHead>
              <TableHead>Evento</TableHead>
              <TableHead>Actor</TableHead>
              <TableHead>Expediente</TableHead>
              <TableHead>Detalles</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((l) => (
              <TableRow key={l.id}>
                <TableCell className="text-xs whitespace-nowrap">{formatDateTime(l.updatedAt)}</TableCell>
                <TableCell className="font-medium">{AUDIT_LABELS[l.action] ?? l.action}</TableCell>
                <TableCell className="text-sm">{l.actorType === "ADMIN" ? (adminName.get(l.actorId ?? "") ?? "Asesor") : l.actorType === "SYSTEM" ? "Sistema" : "Solicitante"}</TableCell>
                <TableCell>
                  {l.applicationFile ? <Link href={`/admin/expedientes/${l.applicationFile.id}`} className="font-mono text-xs text-primary hover:underline">{l.applicationFile.uniqueCode}</Link> : <span className="text-muted-foreground">—</span>}
                </TableCell>
                <TableCell className="max-w-md truncate font-mono text-[11px] text-muted-foreground">{l.details ? JSON.stringify(l.details) : ""}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
