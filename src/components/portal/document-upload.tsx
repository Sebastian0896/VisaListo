"use client";

import { Camera, CheckCircle2, FileText, Loader2, RefreshCw, ShieldCheck, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export type ExistingDocument = { id: string; mimeType: string | null; createdAt: string } | null;

const MAX_BYTES = 4 * 1024 * 1024;
const MAX_SIDE = 2200;

/** Reduce y convierte la foto a JPG en el navegador (las fotos de celular pesan 3-8 MB). */
async function prepareImage(file: File): Promise<Blob> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error("No pudimos abrir esa imagen. Tome la foto con la cámara o súbala en formato JPG o PNG.");
  }
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Su navegador no permite procesar la imagen.");
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.86));
  if (!blob) throw new Error("No se pudo preparar la imagen.");
  return blob;
}

export function DocumentUpload({
  kind,
  title,
  description,
  tips,
  required,
  existing,
  consentGiven,
  canEdit,
}: {
  kind: "PASSPORT" | "NATIONAL_ID";
  title: string;
  description: string;
  tips: string[];
  required: boolean;
  existing: ExistingDocument;
  consentGiven: boolean;
  canEdit: boolean;
}) {
  const router = useRouter();
  const cameraRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [consent, setConsent] = useState(consentGiven);
  const [busy, setBusy] = useState(false);
  const [version, setVersion] = useState(0); // evita que la miniatura quede en caché tras reemplazar

  const handle = async (file: File | undefined) => {
    if (!file) return;
    if (!consent) {
      toast.error("Primero acepte el tratamiento de la imagen de su documento.");
      return;
    }
    setBusy(true);
    try {
      const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
      const body = isPdf ? file : await prepareImage(file);
      if (body.size > MAX_BYTES) throw new Error("El archivo es demasiado grande (máximo 4 MB). Si es un PDF, envíe solo la página de datos.");
      const fd = new FormData();
      fd.append("kind", kind);
      fd.append("file", body, isPdf ? "documento.pdf" : "documento.jpg");
      if (!consentGiven) fd.append("consent", "1");
      const res = await fetch("/api/documentos", { method: "POST", body: fd });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "No se pudo subir el documento.");
      toast.success(existing ? "Documento reemplazado" : "Documento subido");
      setVersion((v) => v + 1);
      router.refresh();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
      if (cameraRef.current) cameraRef.current.value = "";
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const isImage = existing?.mimeType?.startsWith("image/");

  return (
    <div className={cn("rounded-2xl border bg-card p-5 shadow-sm sm:p-6", required && !existing && "border-amber-300")}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="flex items-center gap-2 font-semibold">
            {existing ? <CheckCircle2 className="size-5 text-emerald-600" /> : <Upload className="size-5 text-primary" />}
            {title}
            {required ? <span className="text-destructive">*</span> : <span className="text-xs font-normal text-muted-foreground">(opcional)</span>}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        {existing && <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800">Subido {formatDateTime(existing.createdAt)}</span>}
      </div>

      {existing && (
        <a href={`/api/documentos/${existing.id}`} target="_blank" rel="noopener noreferrer" className="mt-4 block w-fit rounded-xl border bg-muted/30 p-2 transition hover:bg-muted/60">
          {isImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={`/api/documentos/${existing.id}?v=${version}`} alt={`Vista previa: ${title}`} className="max-h-48 w-auto rounded-lg object-contain" />
          ) : (
            <span className="flex items-center gap-2 px-3 py-2 text-sm"><FileText className="size-5 text-primary" /> Ver PDF subido</span>
          )}
        </a>
      )}

      {canEdit ? (
        <>
          {!existing && (
            <ul className="mt-4 space-y-1 text-[13px] text-muted-foreground">
              {tips.map((t) => <li key={t}>• {t}</li>)}
            </ul>
          )}
          {!consentGiven && (
            <label className="mt-4 flex items-start gap-3 rounded-lg border bg-muted/40 p-3 text-[13px] leading-relaxed">
              <input type="checkbox" className="mt-0.5 size-4 accent-[var(--primary)]" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
              <span>
                Autorizo que la imagen de mi documento se guarde de forma cifrada y privada, solo para que mi asesor verifique mis datos. Se
                eliminará automáticamente después de la revisión.
              </span>
            </label>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => void handle(e.target.files?.[0])} />
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/heic,application/pdf" className="hidden" onChange={(e) => void handle(e.target.files?.[0])} />
            <Button type="button" disabled={busy} onClick={() => cameraRef.current?.click()}>
              {busy ? <Loader2 className="animate-spin" /> : <Camera />} Tomar foto
            </Button>
            <Button type="button" variant="outline" disabled={busy} onClick={() => fileRef.current?.click()}>
              {existing ? <RefreshCw /> : <Upload />} {existing ? "Reemplazar" : "Subir archivo"}
            </Button>
          </div>
        </>
      ) : (
        !existing && <p className="mt-3 text-sm text-muted-foreground">La edición no está disponible en este momento.</p>
      )}
      <p className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground"><ShieldCheck className="size-3.5" /> Se guarda cifrado. Solo usted y su asesor pueden verlo.</p>
    </div>
  );
}
