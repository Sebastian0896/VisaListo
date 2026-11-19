"use client";

import { KeyRound, Loader2, Plus, Save, ShieldCheck, UserCheck, UserX } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { createUserAction, setUserActiveAction, setUserRoleAction, updateAccountAction, type AccountInput, type NewUserInput } from "@/actions/account";
import { NativeSelect } from "@/components/form/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PASSWORD_HINT, ROLE_LABELS } from "@/lib/roles";
import { cn } from "@/lib/utils";

type Role = keyof typeof ROLE_LABELS;

export function AccountForm({ name, email, whatsappNumber, contactHours }: { name: string; email: string; whatsappNumber: string; contactHours: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const form = useForm<AccountInput>({ defaultValues: { name, email, whatsappNumber, contactHours, currentPassword: "", newPassword: "", confirmPassword: "" } });

  return (
    <form
      className="space-y-4"
      onSubmit={form.handleSubmit((v) =>
        startTransition(async () => {
          const res = await updateAccountAction(v);
          if (!res.ok) return void toast.error(res.error);
          toast.success(v.newPassword ? "Cuenta y contraseña actualizadas" : "Cuenta actualizada");
          form.reset({ name: v.name, email: v.email.trim().toLowerCase(), whatsappNumber: v.whatsappNumber, contactHours: v.contactHours, currentPassword: "", newPassword: "", confirmPassword: "" });
          router.refresh();
        }),
      )}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="acc-name">Nombre</Label>
          <Input id="acc-name" className="h-10 bg-card" autoComplete="name" {...form.register("name")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="acc-email">Correo de acceso</Label>
          <Input id="acc-email" type="email" className="h-10 bg-card" autoComplete="username" {...form.register("email")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="acc-wa">Mi WhatsApp (opcional)</Label>
          <Input id="acc-wa" type="tel" className="h-10 bg-card" placeholder="+1 809 000 0000" {...form.register("whatsappNumber")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="acc-hours">Horario de atención (opcional)</Label>
          <Input id="acc-hours" className="h-10 bg-card" maxLength={120} placeholder="Lunes a viernes, 9:00 a 6:00" {...form.register("contactHours")} />
        </div>
        <p className="text-xs text-muted-foreground sm:col-span-2">
          Sus clientes vinculados verán su WhatsApp y su horario dentro de su portal (nunca en páginas públicas). Si no pone un número, verán el WhatsApp general de la oficina.
        </p>
      </div>

      <fieldset className="space-y-3 rounded-xl border bg-muted/30 p-4">
        <legend className="flex items-center gap-1.5 px-1 text-sm font-semibold"><KeyRound className="size-4" /> Cambiar contraseña</legend>
        <p className="text-xs text-muted-foreground">Déjelo vacío si no quiere cambiarla. {PASSWORD_HINT}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="acc-new">Nueva contraseña</Label>
            <Input id="acc-new" type="password" className="h-10 bg-card" autoComplete="new-password" {...form.register("newPassword")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="acc-confirm">Repita la nueva contraseña</Label>
            <Input id="acc-confirm" type="password" className="h-10 bg-card" autoComplete="new-password" {...form.register("confirmPassword")} />
          </div>
        </div>
      </fieldset>

      <div className="flex flex-wrap items-end gap-3 border-t pt-4">
        <div className="min-w-56 flex-1 space-y-1.5 sm:max-w-xs">
          <Label htmlFor="acc-current">Contraseña actual (obligatoria para guardar)</Label>
          <Input id="acc-current" type="password" className="h-10 bg-card" autoComplete="current-password" {...form.register("currentPassword")} />
        </div>
        <Button type="submit" className="h-10 px-4" disabled={pending}>
          {pending ? <Loader2 className="animate-spin" /> : <Save />} Guardar cuenta
        </Button>
      </div>
    </form>
  );
}

type UserRow = { id: string; name: string; email: string; role: Role; active: boolean; lastLoginAt: string | null; advisorCode: string; files: number };

export function UsersManager({ users, currentId }: { users: UserRow[]; currentId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [adding, setAdding] = useState(false);
  const form = useForm<NewUserInput>({ defaultValues: { name: "", email: "", password: "", role: "ADVISOR" } });

  const run = (fn: () => Promise<{ ok: true } | { ok: false; error: string }>, msg: string) =>
    startTransition(async () => {
      const res = await fn();
      if (!res.ok) return void toast.error(res.error);
      toast.success(msg);
      router.refresh();
    });

  return (
    <div className="space-y-4">
      <ul className="divide-y rounded-xl border bg-card">
        {users.map((u) => {
          const me = u.id === currentId;
          return (
            <li key={u.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className={cn("flex flex-wrap items-center gap-1.5 text-sm font-medium", !u.active && "text-muted-foreground")}>
                  <span className={cn(!u.active && "line-through")}>{u.name}</span>
                  <span className={cn("rounded px-1.5 py-0.5 text-[11px] font-semibold", u.role === "ADMIN" ? "bg-primary text-primary-foreground" : "bg-secondary text-primary")}>{ROLE_LABELS[u.role]}</span>
                  {me && <span className="rounded bg-muted px-1.5 py-0.5 text-[11px] font-semibold text-muted-foreground">Usted</span>}
                  {!u.active && <span className="text-[11px] font-semibold text-rose-700">Inactivo</span>}
                </p>
                <p className="truncate text-xs text-muted-foreground">{u.email} · Código <span className="font-mono font-semibold text-foreground">{u.advisorCode}</span> · {u.files} expediente{u.files === 1 ? "" : "s"} · Último acceso: {u.lastLoginAt ?? "nunca"}</p>
              </div>
              {!me && (
                <div className="flex flex-wrap gap-2">
                  <NativeSelect
                    aria-label={`Rol de ${u.name}`}
                    className="h-8 w-40 text-xs"
                    value={u.role}
                    disabled={pending}
                    onChange={(e) => run(() => setUserRoleAction(u.id, e.target.value as Role), "Rol actualizado")}
                  >
                    <option value="ADVISOR">Asesor</option>
                    <option value="ADMIN">Administrador</option>
                  </NativeSelect>
                  <Button variant="outline" size="sm" disabled={pending} onClick={() => run(() => setUserActiveAction(u.id, !u.active), u.active ? "Usuario desactivado" : "Usuario activado")}>
                    {u.active ? <><UserX /> Desactivar</> : <><UserCheck /> Activar</>}
                  </Button>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {adding ? (
        <form
          className="space-y-3 rounded-xl border bg-muted/30 p-4"
          onSubmit={form.handleSubmit((v) =>
            startTransition(async () => {
              const res = await createUserAction(v);
              if (!res.ok) return void toast.error(res.error);
              toast.success(`${ROLE_LABELS[v.role as Role]} creado`);
              form.reset();
              setAdding(false);
              router.refresh();
            }),
          )}
        >
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5"><Label htmlFor="nu-name">Nombre</Label><Input id="nu-name" className="h-9 bg-card" {...form.register("name")} /></div>
            <div className="space-y-1.5"><Label htmlFor="nu-email">Correo</Label><Input id="nu-email" type="email" className="h-9 bg-card" autoComplete="off" {...form.register("email")} /></div>
            <div className="space-y-1.5"><Label htmlFor="nu-pass">Contraseña inicial</Label><Input id="nu-pass" type="password" className="h-9 bg-card" autoComplete="new-password" {...form.register("password")} /></div>
            <div className="space-y-1.5">
              <Label htmlFor="nu-role">Rol</Label>
              <NativeSelect id="nu-role" className="h-9" {...form.register("role")}>
                <option value="ADVISOR">Asesor</option>
                <option value="ADMIN">Administrador</option>
              </NativeSelect>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">{PASSWORD_HINT} Comuníquela por un canal seguro y pida que la cambie en «Mi cuenta» al entrar.</p>
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={pending}>{pending ? <Loader2 className="animate-spin" /> : <Plus />} Crear usuario</Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setAdding(false)}>Cancelar</Button>
          </div>
        </form>
      ) : (
        <Button variant="outline" size="sm" onClick={() => setAdding(true)}><Plus /> Agregar usuario</Button>
      )}

      <div className="flex gap-2.5 rounded-xl border bg-muted/30 p-3.5 text-xs leading-relaxed text-muted-foreground">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
        <p>
          <strong className="text-foreground">Administrador:</strong> todo el panel, incluidos usuarios, configuración, formulario y auditoría.{" "}
          <strong className="text-foreground">Asesor:</strong> dashboard, expedientes, mensajes, notas internas y documentos.
        </p>
      </div>
    </div>
  );
}
