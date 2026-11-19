import { ChevronLeft, ChevronRight, Eye, Search, X } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/admin/page-header";
import { NativeSelect } from "@/components/form/primitives";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { FileStatus, Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { formatDate, formatDateTime, nowMs } from "@/lib/format";
import { normalizeCode } from "@/lib/normalize";
import { ALL_STATUSES, STATUS_LABELS } from "@/lib/status";
import { cn } from "@/lib/utils";
import { fileScope } from "@/server/advisors";
import { requireAdmin } from "@/server/guards";
import { sweepExpired } from "@/server/files";

export const metadata: Metadata = { title: "Expedientes" };

const PAGE_SIZE = 25;
const DATE_FIELDS = { creado: "createdAt", inicio: "startedAt", envio: "submittedAt", vencimiento: "expiresAt" } as const;
const ORDERS = {
  recientes: { createdAt: "desc" },
  actividad: { lastActivityAt: "desc" },
  vencimiento: { expiresAt: "asc" },
  envio: { submittedAt: "desc" },
} as const satisfies Record<string, Prisma.ApplicationFileOrderByWithRelationInput>;

function str(v: string | string[] | undefined) {
  return typeof v === "string" ? v : "";
}
function parseDay(v: string, endOfDay = false) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return undefined;
  const d = new Date(`${v}T${endOfDay ? "23:59:59" : "00:00:00"}`);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

export default async function FilesPage(props: PageProps<"/admin/expedientes">) {
  const me = await requireAdmin();
  const isAdmin = me.role === "ADMIN";
  await sweepExpired();
  const sp = await props.searchParams;
  const q = str(sp.q).trim().slice(0, 80);
  const estado = str(sp.estado) as FileStatus | "";
  const campo = (str(sp.campo) || "creado") as keyof typeof DATE_FIELDS;
  const desde = str(sp.desde);
  const hasta = str(sp.hasta);
  const orden = (str(sp.orden) || "recientes") as keyof typeof ORDERS;
  const page = Math.max(1, Number.parseInt(str(sp.p) || "1", 10) || 1);
  const asesor = isAdmin ? str(sp.asesor) : "";

  const where: Prisma.ApplicationFileWhereInput = {};
  // Alcance: el asesor solo ve los suyos; el administrador puede filtrar por asesor
  Object.assign(where, fileScope(me));
  if (asesor === "sin") where.advisorId = null;
  else if (asesor) where.advisorId = asesor;
  if (estado && ALL_STATUSES.includes(estado)) where.status = estado;
  if (q) {
    const terms = q.split(/\s+/).filter(Boolean);
    where.AND = terms.map((t) => ({
      OR: [
        { uniqueCode: { contains: t.toUpperCase() } },
        { uniqueCode: normalizeCode(t) },
        { applicant: { firstSurname: { contains: t, mode: "insensitive" } } },
        { applicant: { givenNames: { contains: t, mode: "insensitive" } } },
      ],
    }));
  }
  const field = DATE_FIELDS[campo] ?? "createdAt";
  const from = parseDay(desde);
  const to = parseDay(hasta, true);
  if (from || to) where[field] = { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) };

  const orderBy = ORDERS[orden] ?? ORDERS.recientes;
  const [total, files] = await Promise.all([
    db.applicationFile.count({ where }),
    db.applicationFile.findMany({
      where,
      orderBy: [orderBy, { createdAt: "desc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { applicant: true, advisor: { select: { name: true } }, _count: { select: { messages: { where: { senderType: "CLIENT", readAt: null } } } } },
    }),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const now = nowMs();
  const hasFilters = !!(q || estado || desde || hasta || asesor);
  const advisors = isAdmin ? await db.adminUser.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, active: true } }) : [];

  const pageHref = (p: number) => {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries({ q, estado, campo, desde, hasta, orden, asesor })) if (v) params.set(k, v);
    params.set("p", String(p));
    return `/admin/expedientes?${params.toString()}`;
  };

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader title="Expedientes" description={`${total} expediente${total === 1 ? "" : "s"}${hasFilters ? " con los filtros aplicados" : ""}.`} />

      {/* Filtros */}
      <form className="mb-4 grid gap-3 rounded-2xl border bg-card p-4 shadow-sm md:grid-cols-2 xl:grid-cols-4" role="search">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input name="q" defaultValue={q} placeholder="Código, nombre o apellido" className="h-10 bg-card pl-9" aria-label="Buscar" />
        </div>
        <NativeSelect name="estado" defaultValue={estado} aria-label="Estado">
          <option value="">Todos los estados</option>
          {ALL_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
        </NativeSelect>
        {isAdmin && (
          <NativeSelect name="asesor" defaultValue={asesor} aria-label="Asesor">
            <option value="">Todos los asesores</option>
            <option value="sin">Sin asignar</option>
            {advisors.map((a) => <option key={a.id} value={a.id}>{a.name}{a.active ? "" : " (inactivo)"}</option>)}
          </NativeSelect>
        )}
        <NativeSelect name="campo" defaultValue={campo} aria-label="Filtrar fecha por">
          <option value="creado">Fecha de creación</option>
          <option value="inicio">Fecha de inicio</option>
          <option value="envio">Fecha de envío</option>
          <option value="vencimiento">Fecha de vencimiento</option>
        </NativeSelect>
        <Input type="date" name="desde" defaultValue={desde} className="h-10 bg-card" aria-label="Desde" />
        <Input type="date" name="hasta" defaultValue={hasta} className="h-10 bg-card" aria-label="Hasta" />
        <NativeSelect name="orden" defaultValue={orden} aria-label="Ordenar por">
          <option value="recientes">Más recientes</option>
          <option value="actividad">Última actividad</option>
          <option value="envio">Fecha de envío</option>
          <option value="vencimiento">Próximos a vencer</option>
        </NativeSelect>
        <div className="flex gap-2">
          <Button type="submit" className="h-10 flex-1 px-4">Filtrar</Button>
          {hasFilters && (
            <Link href="/admin/expedientes" className={cn(buttonVariants({ variant: "outline" }), "h-10")} aria-label="Limpiar filtros"><X /></Link>
          )}
        </div>
      </form>

      <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Código</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Primer apellido</TableHead>
              <TableHead>Creado</TableHead>
              <TableHead>Inicio</TableHead>
              <TableHead>Vence</TableHead>
              <TableHead>Estado</TableHead>
              {isAdmin && <TableHead>Asesor</TableHead>}
              <TableHead>Última actividad</TableHead>
              <TableHead className="text-center">Msj.</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {files.length === 0 && (
              <TableRow>
                <TableCell colSpan={isAdmin ? 11 : 10} className="py-14 text-center text-muted-foreground">No se encontraron expedientes.</TableCell>
              </TableRow>
            )}
            {files.map((f) => {
              const left = f.expiresAt ? f.expiresAt.getTime() - now : null;
              const expiringSoon = left !== null && left > 0 && left < 3 * 86400_000;
              return (
                <TableRow key={f.id}>
                  <TableCell className="font-mono text-xs font-medium">{f.uniqueCode}</TableCell>
                  <TableCell className="max-w-48 truncate">{f.applicant.givenNames ?? <span className="text-muted-foreground">—</span>}</TableCell>
                  <TableCell>{f.applicant.firstSurname}</TableCell>
                  <TableCell className="text-xs whitespace-nowrap">{formatDate(f.createdAt)}</TableCell>
                  <TableCell className="text-xs whitespace-nowrap">{formatDate(f.startedAt)}</TableCell>
                  <TableCell className={cn("text-xs whitespace-nowrap", expiringSoon && "font-semibold text-amber-700")}>{formatDate(f.expiresAt)}</TableCell>
                  <TableCell><StatusBadge status={f.status} /></TableCell>
                  {isAdmin && <TableCell className="text-sm whitespace-nowrap">{f.advisor?.name ?? <span className="text-amber-700">Sin asignar</span>}</TableCell>}
                  <TableCell className="text-xs whitespace-nowrap text-muted-foreground">{formatDateTime(f.lastActivityAt)}</TableCell>
                  <TableCell className="text-center">
                    {f._count.messages > 0 ? <span className="rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground">{f._count.messages}</span> : <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/admin/expedientes/${f.id}`} className={buttonVariants({ variant: "outline", size: "sm" })}><Eye /> Ver</Link>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {pages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Página {page} de {pages}</span>
          <div className="flex gap-2">
            {page > 1 && <Link href={pageHref(page - 1)} className={buttonVariants({ variant: "outline", size: "sm" })}><ChevronLeft /> Anterior</Link>}
            {page < pages && <Link href={pageHref(page + 1)} className={buttonVariants({ variant: "outline", size: "sm" })}>Siguiente <ChevronRight /></Link>}
          </div>
        </div>
      )}
    </div>
  );
}
