import { CheckCircle2, CircleAlert, XCircle } from "lucide-react";
import { storageDiagnostics } from "@/lib/storage";

/** Estado del almacenamiento de documentos (solo administradores). Nunca muestra valores secretos. */
export async function StorageStatus() {
  const d = await storageDiagnostics();
  const rows: { ok: boolean | "warn"; label: string; help?: string }[] = [
    { ok: d.urlPresent, label: "SUPABASE_URL definida", help: d.urlPresent ? undefined : "Agréguela en Vercel → Settings → Environment Variables y haga Redeploy." },
    ...(d.urlPresent ? [{ ok: d.urlLooksValid, label: "SUPABASE_URL con formato https://xxxx.supabase.co", help: d.urlLooksValid ? undefined : "Use la Project URL de Supabase (Settings → API)." }] : []),
    { ok: d.keyPresent, label: "SUPABASE_SERVICE_ROLE_KEY definida", help: d.keyPresent ? undefined : "Pegue la Secret key «default» (sb_secret_…) y haga Redeploy." },
    ...(d.keyPresent
      ? [{ ok: d.keyFormat === "secret" || d.keyFormat === "legacy", label: `Tipo de clave: ${d.keyFormat}`, help: d.keyFormat === "publishable" ? "Esa es la clave pública. Use la Secret key." : undefined }]
      : []),
    ...(d.urlHasQuotes || d.keyHasQuotes ? [{ ok: "warn" as const, label: "Algún valor tiene comillas", help: "Se ignoran automáticamente, pero conviene quitarlas en Vercel." }] : []),
    { ok: d.cronSecretPresent ? true : "warn", label: "CRON_SECRET definida (borrado automático diario)", help: d.cronSecretPresent ? undefined : "Sin ella, el borrado se hace solo al abrir el dashboard." },
    { ok: d.connection.ok, label: "Prueba de conexión", help: d.connection.detail },
  ];
  const allOk = d.urlPresent && d.keyPresent && d.connection.ok;

  return (
    <section className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-semibold">Almacenamiento de documentos</h2>
        <span className={allOk ? "rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800" : "rounded-full bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-800"}>
          {allOk ? "Funcionando" : "Requiere atención"}
        </span>
      </div>
      <p className="mt-0.5 text-sm text-muted-foreground">Entorno: {d.environment}. Diagnóstico sin mostrar valores secretos.</p>
      <ul className="mt-4 space-y-2.5">
        {rows.map((r) => (
          <li key={r.label} className="flex gap-2.5 text-sm">
            {r.ok === true ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" /> : r.ok === "warn" ? <CircleAlert className="mt-0.5 size-4 shrink-0 text-amber-600" /> : <XCircle className="mt-0.5 size-4 shrink-0 text-rose-600" />}
            <span>
              <span className="font-medium">{r.label}</span>
              {r.help && <span className="block text-xs text-muted-foreground">{r.help}</span>}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
