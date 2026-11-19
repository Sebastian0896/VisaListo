"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { reassignFileAction } from "@/actions/admin";
import { NativeSelect } from "@/components/form/primitives";

/** Selector para que el Administrador asigne o cambie el asesor de un expediente. */
export function ReassignAdvisor({ fileId, current, users }: { fileId: string; current: string | null; users: { id: string; name: string }[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <div className="relative">
      <NativeSelect
        aria-label="Asesor asignado"
        className="h-9 text-sm"
        value={current ?? ""}
        disabled={pending}
        onChange={(e) => {
          const value = e.target.value || null;
          startTransition(async () => {
            const res = await reassignFileAction(fileId, value);
            if (!res.ok) return void toast.error(res.error);
            toast.success(value ? "Asesor asignado" : "Expediente sin asesor");
            router.refresh();
          });
        }}
      >
        <option value="">Sin asignar</option>
        {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
      </NativeSelect>
      {pending && <Loader2 className="absolute top-1/2 right-8 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />}
    </div>
  );
}
