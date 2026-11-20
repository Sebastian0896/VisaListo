"use client";

import { ExternalLink, FileText, RotateCw, ZoomIn, ZoomOut } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export type ViewerDocument = { id: string; label: string; mimeType: string | null; createdAt: string };

/** Visor de documentos para comparar con las respuestas: zoom, rotación y apertura en pestaña nueva. */
export function DocumentViewer({ documents }: { documents: ViewerDocument[] }) {
  const [active, setActive] = useState(documents[0]?.id ?? null);
  const [zoom, setZoom] = useState(false);
  const [rotation, setRotation] = useState(0);
  const doc = documents.find((d) => d.id === active) ?? documents[0];
  if (!doc) return null;
  const isImage = doc.mimeType?.startsWith("image/");
  const src = `/api/documentos/${doc.id}`;

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-2.5">
        <div className="flex gap-1">
          {documents.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => {
                setActive(d.id);
                setRotation(0);
                setZoom(false);
              }}
              className={cn("rounded-md px-2.5 py-1 text-xs font-medium transition", d.id === doc.id ? "bg-secondary text-primary" : "text-muted-foreground hover:bg-muted")}
            >
              {d.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          {isImage && (
            <>
              <Button type="button" variant="ghost" size="icon-sm" onClick={() => setZoom((z) => !z)} aria-label={zoom ? "Alejar" : "Acercar"}>
                {zoom ? <ZoomOut /> : <ZoomIn />}
              </Button>
              <Button type="button" variant="ghost" size="icon-sm" onClick={() => setRotation((r) => (r + 90) % 360)} aria-label="Rotar">
                <RotateCw />
              </Button>
            </>
          )}
          <a href={src} target="_blank" rel="noopener noreferrer" className="inline-flex size-7 items-center justify-center rounded-md hover:bg-muted" aria-label="Abrir en pestaña nueva">
            <ExternalLink className="size-4" />
          </a>
        </div>
      </div>
      <div className={cn("relative flex-1 bg-muted/40", zoom ? "overflow-auto" : "overflow-hidden")}>
        {isImage ? (
          <div className={cn("flex min-h-72 items-center justify-center p-3", zoom && "w-[200%]")}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={doc.label}
              onClick={() => setZoom((z) => !z)}
              style={{ transform: `rotate(${rotation}deg)` }}
              className={cn("max-w-full cursor-zoom-in rounded-md shadow-sm transition-transform select-none", zoom ? "cursor-zoom-out" : "max-h-[34rem]")}
            />
          </div>
        ) : (
          <div className="flex min-h-72 flex-col items-center justify-center gap-3 p-6 text-center">
            <FileText className="size-10 text-primary" />
            <a href={src} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-primary underline underline-offset-2">Abrir el PDF en una pestaña nueva</a>
          </div>
        )}
      </div>
      <p className="border-t px-4 py-2 text-[11px] text-muted-foreground">Subido {formatDateTime(doc.createdAt)} · Cada consulta queda registrada en la auditoría.</p>
    </div>
  );
}
