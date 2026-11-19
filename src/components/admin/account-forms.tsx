"use client";

import { KeyRound, Loader2, Plus, Save, UserCheck, UserX } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { createAdminAction, setAdminActiveAction, updateAccountAction, type AccountInput, type NewAdminInput } from "@/actions/account";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const PASSWORD_HINT = "Mínimo 10 caracteres, con letras y al menos un número.";

export function AccountForm({ name, email }: { name: string; email: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const form = useForm<AccountInput>({ defaultValues: { name, email, currentPassword: "", newPassword: "", confirmPassword: "" } });

  return (
    <form
      className="space-y-4"
      onSubmit={form.handleSubmit((v) =>
        startTransition(async () => {
          const res = await updateAccountAction(v);
          if (!res.ok) return void toast.error(res.error);
          toast.success(v.newPassword ? "Cuenta y contraseña actualizadas" : "Cuenta actualizada");
          form.reset({ name: v.name, email: v.email.trim().toLowerCase(), currentPassword: "", newPassword: "", confirmPassword: "" });
          router.refresh();
        }),
      )}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="acc-name">Nombre</Label>
          <Input id="acc-name" className="h-10 bg-white" autoComplete="name" {...form.register("name")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="acc-email">Correo de acceso</Label>
          <Input id="acc-email" type="email" className="h-10 bg-white" autoComplete="username" {...form.register("email")} />
        </div>
      </div>

      <fieldset className="space-y-3 rounded-xl border bg-muted/30 p-4">
        <legend className="flex items-center gap-1.5 px-1 text-sm font-semibold"><KeyRound className="size-4" /> Cambiar contraseña</legend>
        <p className="text-xs text-muted-foreground">Déjelo vacío si no quiere cambiarla. {PASSWORD_HINT}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="acc-new">Nueva contraseña</Label>
            <Input id="acc-new" type="password" className="h-10 bg-white" autoComplete="new-password" {...form.register("newPassword")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="acc-confirm">Repita la nueva contraseña</Label>
            <Input id="acc-confirm" type="password" className="h-10 bg-white" autoComplete="new-password" {...form.register("confirmPassword")} />
          </div>
        </div>
      </fieldset>

      <div className="flex flex-wrap items-end gap-3 border-t pt-4">
        <div className="min-w-56 flex-1 space-y-1.5 sm:max-w-xs">
          <Label htmlFor="acc-current">Contraseña actual (obligatoria para guardar)</Label>
          <Input id="acc-current" type="password" className="h-10 bg-white" autoComplete="current-password" {...form.register("currentPassword")} />
        </div>
        <Button type="submit" className="h-10 px-4" disabled={pending}>
          {pending ? <Loader2 className="animate-spin" /> : <Save />} Guardar cuenta
        </Button>
      </div>
    </form>
  );
}

type AdminRow = { id: string; name: string; email: string; active: boolean; lastLoginAt: string | null };

export function AdminsManager({ admins, currentId }: { admins: AdminRow[]; currentId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [adding, setAdding] = useState(false);
  const form = useForm<NewAdminInput>({ defaultValues: { name: "", email: "", password: "" } });

  const toggle = (a: AdminRow) =>
    startTransition(async () => {
      const res = await setAdminActiveAction(a.id, !a.active);
      if (!res.ok) return void toast.error(res.error);
      toast.success(a.active ? "Asesor desactivado" : "Asesor activado");
      router.refresh();
    });

  return (
    <div className="space-y-4">
      <ul className="divide-y rounded-xl border bg-white">
        {admins.map((a) => (
          <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
            <div className="min-w-0">
              <p className={cn("text-sm font-medium", !a.active && "text-muted-foreground line-through")}>
                {a.name} {a.id === currentId && <span className="ml-1 rounded bg-secondary px-1.5 py-0.5 text-[11px] font-semibold text-primary no-underline">Usted</span>}
              </p>
              <p className="truncate text-xs text-muted-foreground">{a.email} · Último acceso: {a.lastLoginAt ?? "nunca"}</p>
            </div>
            {a.id !== currentId && (
              <Button variant="outline" size="sm" disabled={pending} onClick={() => toggle(a)}>
                {a.active ? <><UserX /> Desactivar</> : <><UserCheck /> Activar</>}
              </Button>
            )}
          </li>
        ))}
      </ul>

      {adding ? (
        <form
          className="space-y-3 rounded-xl border bg-muted/30 p-4"
          onSubmit={form.handleSubmit((v) =>
            startTransition(async () => {
              const res = await createAdminAction(v);
              if (!res.ok) return void toast.error(res.error);
              toast.success("Asesor creado");
              form.reset();
              setAdding(false);
              router.refresh();
            }),
          )}
        >
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1.5"><Label htmlFor="na-name">Nombre</Label><Input id="na-name" className="h-9 bg-white" {...form.register("name")} /></div>
            <div className="space-y-1.5"><Label htmlFor="na-email">Correo</Label><Input id="na-email" type="email" className="h-9 bg-white" autoComplete="off" {...form.register("email")} /></div>
            <div className="space-y-1.5"><Label htmlFor="na-pass">Contraseña inicial</Label><Input id="na-pass" type="password" className="h-9 bg-white" autoComplete="new-password" {...form.register("password")} /></div>
          </div>
          <p className="text-xs text-muted-foreground">{PASSWORD_HINT} Comuníquesela por un canal seguro y pídale que la cambie al entrar.</p>
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={pending}>{pending ? <Loader2 className="animate-spin" /> : <Plus />} Crear asesor</Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setAdding(false)}>Cancelar</Button>
          </div>
        </form>
      ) : (
        <Button variant="outline" size="sm" onClick={() => setAdding(true)}><Plus /> Agregar asesor</Button>
      )}
    </div>
  );
}
