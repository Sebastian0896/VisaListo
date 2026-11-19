import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BrandMark } from "@/components/shared/brand";
import { getAdmin } from "@/server/guards";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Acceso del asesor", robots: { index: false } };

export default async function AdminLoginPage() {
  if (await getAdmin()) redirect("/admin");
  return (
    <div className="grid min-h-screen place-items-center bg-[radial-gradient(70%_60%_at_50%_0%,oklch(0.93_0.03_255),transparent)] px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center text-center">
          <BrandMark className="size-11" />
          <h1 className="mt-4 text-xl font-semibold tracking-tight">Panel del asesor</h1>
          <p className="text-sm text-muted-foreground">Acceso restringido al personal autorizado.</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
