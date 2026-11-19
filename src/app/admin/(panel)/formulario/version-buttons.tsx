"use client";

import { BadgeCheck, Copy, Rocket } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { cloneVersionAction, publishVersionAction, toggleVerifiedAction } from "@/actions/admin";
import { Button } from "@/components/ui/button";

export function VersionButtons({ versionId, status, verified }: { versionId: string; status: "DRAFT" | "PUBLISHED" | "ARCHIVED"; verified: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const res = await toggleVerifiedAction(versionId, !verified);
            if (!res.ok) return void toast.error(res.error);
            router.refresh();
          })
        }
      >
        <BadgeCheck /> {verified ? "Quitar verificación" : "Marcar verificada"}
      </Button>
      {status !== "DRAFT" && (
        <Button
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const res = await cloneVersionAction(versionId);
              if (!res.ok) return void toast.error(res.error);
              toast.success("Borrador creado");
              router.push(`/admin/formulario/${res.id}`);
            })
          }
        >
          <Copy /> Crear borrador
        </Button>
      )}
      {status === "DRAFT" && (
        <Button
          size="sm"
          disabled={pending}
          onClick={() => {
            if (!confirm("¿Publicar esta versión? Los expedientes nuevos la usarán; los existentes conservan su versión.")) return;
            startTransition(async () => {
              const res = await publishVersionAction(versionId);
              if (!res.ok) return void toast.error(res.error);
              toast.success("Versión publicada");
              router.refresh();
            });
          }}
        >
          <Rocket /> Publicar
        </Button>
      )}
    </>
  );
}
