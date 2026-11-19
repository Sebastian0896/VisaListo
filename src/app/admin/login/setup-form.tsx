"use client";

import { Loader2, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { createFirstAdminAction, type SetupInput } from "@/actions/account";
import { PASSWORD_HINT } from "@/components/admin/account-forms";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SetupForm({ tokenRequired, tokenConfigured }: { tokenRequired: boolean; tokenConfigured: boolean }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const form = useForm<SetupInput>({ defaultValues: { name: "", email: "", password: "", confirmPassword: "", token: "" } });

  if (tokenRequired && !tokenConfigured) {
    return (
      <div className="space-y-2 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950">
        <p className="font-semibold">Configuración inicial bloqueada</p>
        <p>
          Para crear el primer administrador en este servidor, defina la variable de entorno <code className="font-mono">ADMIN_SETUP_TOKEN</code> con un
          código secreto y vuelva a desplegar. Luego ingrese aquí ese código.
        </p>
      </div>
    );
  }

  return (
    <form
      className="space-y-4 rounded-2xl border bg-white p-6 shadow-sm"
      onSubmit={form.handleSubmit((v) => {
        setError(null);
        startTransition(async () => {
          const res = await createFirstAdminAction(v);
          if (!res.ok) return setError(res.error);
          router.replace("/admin");
          router.refresh();
        });
      })}
    >
      <div className="flex gap-2.5 rounded-xl bg-secondary p-3 text-sm text-secondary-foreground">
        <ShieldCheck className="mt-0.5 size-4 shrink-0" />
        <p>Todavía no existe ningún administrador. Cree la cuenta principal; luego podrá agregar asesores desde «Usuarios».</p>
      </div>
      {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
      <div className="space-y-1.5">
        <Label htmlFor="su-name">Nombre</Label>
        <Input id="su-name" autoComplete="name" className="h-10 bg-white" {...form.register("name")} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="su-email">Correo</Label>
        <Input id="su-email" type="email" autoComplete="username" className="h-10 bg-white" {...form.register("email")} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="su-pass">Contraseña</Label>
        <Input id="su-pass" type="password" autoComplete="new-password" className="h-10 bg-white" {...form.register("password")} />
        <p className="text-xs text-muted-foreground">{PASSWORD_HINT}</p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="su-confirm">Repita la contraseña</Label>
        <Input id="su-confirm" type="password" autoComplete="new-password" className="h-10 bg-white" {...form.register("confirmPassword")} />
      </div>
      {tokenRequired && (
        <div className="space-y-1.5">
          <Label htmlFor="su-token">Código de instalación</Label>
          <Input id="su-token" type="password" autoComplete="off" className="h-10 bg-white" {...form.register("token")} />
          <p className="text-xs text-muted-foreground">El valor de ADMIN_SETUP_TOKEN configurado en el servidor.</p>
        </div>
      )}
      <Button type="submit" size="lg" className="h-10 w-full" disabled={pending}>
        {pending ? <Loader2 className="animate-spin" /> : <ShieldCheck />} Crear administrador
      </Button>
    </form>
  );
}
