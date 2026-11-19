import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BrandMark } from "@/components/shared/brand";
import { getAdmin } from "@/server/guards";
import { setupStatus } from "@/server/setup";
import { LoginForm } from "./login-form";
import { SetupForm } from "./setup-form";

export const metadata: Metadata = { title: "Acceso al panel", robots: { index: false } };

export default async function AdminLoginPage() {
  if (await getAdmin()) redirect("/admin");
  const setup = await setupStatus();
  return (
    <div className="grid min-h-screen place-items-center bg-[radial-gradient(70%_60%_at_50%_0%,oklch(0.93_0.03_255),transparent)] px-4 py-10">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center text-center">
          <BrandMark className="size-11" />
          <h1 className="mt-4 text-xl font-semibold tracking-tight">{setup.needsSetup ? "Configuración inicial" : "Panel de gestión"}</h1>
          <p className="text-sm text-muted-foreground">
            {setup.needsSetup ? "Cree la cuenta del administrador principal." : "Acceso restringido al personal autorizado."}
          </p>
        </div>
        {setup.needsSetup ? <SetupForm tokenRequired={setup.tokenRequired} tokenConfigured={setup.tokenConfigured} /> : <LoginForm />}
      </div>
    </div>
  );
}
