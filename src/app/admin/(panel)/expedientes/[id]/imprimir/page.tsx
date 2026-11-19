import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PrintButton } from "@/components/shared/print-button";
import { PrintDocument } from "@/components/shared/print-document";
import { buttonVariants } from "@/components/ui/button";
import { audit } from "@/lib/audit";
import { formatDateTime } from "@/lib/format";
import { getSettings } from "@/lib/settings";
import { getAdminFile } from "@/server/admin-file";
import { requireAdmin } from "@/server/guards";

export const metadata: Metadata = { title: "Imprimir expediente" };

export default async function AdminPrintPage(props: PageProps<"/admin/expedientes/[id]/imprimir">) {
  const admin = await requireAdmin();
  const { id } = await props.params;
  const sp = await props.searchParams;
  const internal = sp.interno === "1";
  const data = await getAdminFile(id, admin);
  if (!data) notFound();
  const settings = await getSettings();
  await audit({ action: "pdf.admin_downloaded", actorType: "ADMIN", actorId: admin.id, fileId: id, details: { format: "print", internal } });
  const { file } = data;

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <Link href={`/admin/expedientes/${id}`} className={buttonVariants({ variant: "ghost" })}><ArrowLeft /> Volver</Link>
        <div className="flex gap-2">
          <Link href={internal ? "?" : "?interno=1"} className={buttonVariants({ variant: "outline" })}>
            {internal ? "Versión cliente (sin notas)" : "Versión administrativa (con notas)"}
          </Link>
          <PrintButton />
        </div>
      </div>
      <PrintDocument
        platformName={settings.platformName}
        code={file.uniqueCode}
        status={file.status}
        applicantName={data.name}
        createdAt={file.createdAt}
        submittedAt={file.submittedAt}
        sections={data.sections}
        answers={data.answers}
        percent={data.progress.percent}
        adminExtra={
          internal && file.notes.length > 0 ? (
            <section className="mt-8 rounded-lg border-2 border-dashed border-amber-300 p-4">
              <h2 className="text-base font-semibold">Notas internas del asesor (uso interno)</h2>
              <ul className="mt-2 space-y-2 text-sm">
                {file.notes.map((n) => (
                  <li key={n.id}>
                    <p className="whitespace-pre-line">{n.body}</p>
                    <p className="text-xs text-muted-foreground">{n.adminUser?.name ?? "Asesor"} · {formatDateTime(n.createdAt)}</p>
                  </li>
                ))}
              </ul>
            </section>
          ) : null
        }
      />
    </div>
  );
}
