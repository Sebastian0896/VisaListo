"use client";

import { Loader2, LogIn } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { adminLoginAction } from "@/actions/admin";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  return (
    <form
      className="space-y-4 rounded-2xl border bg-card p-6 shadow-sm"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        setError(null);
        startTransition(async () => {
          const res = await adminLoginAction({ email: String(fd.get("email") ?? ""), password: String(fd.get("password") ?? "") });
          if (!res.ok) {
            setError(res.error);
            return;
          }
          router.replace("/admin");
          router.refresh();
        });
      }}
    >
      {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
      <div className="space-y-1.5">
        <Label htmlFor="email">Correo</Label>
        <Input id="email" name="email" type="email" autoComplete="username" required className="h-10 bg-card" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password">Contraseña</Label>
        <Input id="password" name="password" type="password" autoComplete="current-password" required className="h-10 bg-card" />
      </div>
      <Button type="submit" size="lg" className="h-10 w-full" disabled={pending}>
        {pending ? <Loader2 className="animate-spin" /> : <LogIn />} Ingresar
      </Button>
    </form>
  );
}
