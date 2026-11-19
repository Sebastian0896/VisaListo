"use client";

import { Loader2, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { updateSettingsAction, type SettingsInput } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Field = { name: keyof SettingsInput; label: string; hint?: string; type?: "text" | "number" | "textarea"; rows?: number; placeholder?: string };

const GROUPS: { title: string; description: string; fields: Field[] }[] = [
  {
    title: "Identidad",
    description: "Cómo se presenta la plataforma. Evite cualquier elemento que sugiera una relación con el gobierno.",
    fields: [
      { name: "platformName", label: "Nombre de la plataforma" },
      { name: "logoUrl", label: "URL del logotipo", hint: "Imagen cuadrada (PNG/SVG). Vacío = ícono por defecto.", placeholder: "https://…" },
      { name: "aboutText", label: "Presentación del servicio (página de inicio)", type: "textarea", rows: 3 },
    ],
  },
  {
    title: "Vigencia",
    description: "El período empieza cuando el cliente guarda su primera respuesta. Los expedientes ya iniciados conservan su vencimiento.",
    fields: [
      { name: "validityDays", label: "Período de vigencia (días)", type: "number" },
      { name: "expiryWarningDays", label: "Mostrar alerta cuando falten (días)", type: "number" },
      { name: "expiryMessage", label: "Mensaje de vencimiento", type: "textarea", rows: 2 },
    ],
  },
  {
    title: "Contacto y WhatsApp",
    description: "El número de WhatsApp se usa solo en el botón de contacto; no se muestra como texto.",
    fields: [
      { name: "whatsappNumber", label: "Número de WhatsApp", hint: "Con código de país, ej.: +1 809 555 1234", placeholder: "+1 809 000 0000" },
      { name: "whatsappMessage", label: "Mensaje inicial sugerido", hint: "{codigo} se reemplaza por el código del expediente del cliente.", type: "textarea", rows: 2 },
      { name: "contactEmail", label: "Correo de contacto" },
      { name: "contactPhone", label: "Teléfono público de la oficina" },
      { name: "contactAddress", label: "Dirección" },
      { name: "officeHours", label: "Horario de atención", placeholder: "Lunes a viernes, 9:00 a 5:00" },
    ],
  },
  {
    title: "Textos informativos",
    description: "Mensajes que ven los clientes.",
    fields: [
      { name: "welcomeMessage", label: "Mensaje de bienvenida (al crear expediente)", type: "textarea", rows: 2 },
      { name: "privacyVersion", label: "Versión de la política de privacidad", hint: "Cámbiela cuando modifique la política: los nuevos consentimientos registran esta versión." },
      { name: "privacyPolicy", label: "Política de privacidad", hint: "Admite ## títulos, **negrita** y listas con «- ».", type: "textarea", rows: 16 },
    ],
  },
];

export function SettingsForm({ initial }: { initial: SettingsInput }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const form = useForm<SettingsInput>({ defaultValues: initial });

  return (
    <form
      className="space-y-6"
      onSubmit={form.handleSubmit((values) =>
        startTransition(async () => {
          const res = await updateSettingsAction(values);
          if (!res.ok) return void toast.error(res.error);
          toast.success("Configuración guardada");
          form.reset(values);
          router.refresh();
        }),
      )}
    >
      {GROUPS.map((g) => (
        <section key={g.title} className="rounded-2xl border bg-white p-5 shadow-sm sm:p-6">
          <h2 className="font-semibold">{g.title}</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">{g.description}</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {g.fields.map((f) => (
              <div key={f.name} className={f.type === "textarea" ? "space-y-1.5 sm:col-span-2" : "space-y-1.5"}>
                <Label htmlFor={f.name}>{f.label}</Label>
                {f.type === "textarea" ? (
                  <Textarea id={f.name} rows={f.rows} className="bg-white" placeholder={f.placeholder} {...form.register(f.name)} />
                ) : (
                  <Input id={f.name} type={f.type ?? "text"} className="h-10 bg-white" placeholder={f.placeholder} {...form.register(f.name)} />
                )}
                {f.hint && <p className="text-xs text-muted-foreground">{f.hint}</p>}
              </div>
            ))}
          </div>
        </section>
      ))}
      <div className="sticky bottom-4 flex justify-end">
        <Button type="submit" size="lg" className="h-11 px-6 shadow-lg" disabled={pending || !form.formState.isDirty}>
          {pending ? <Loader2 className="animate-spin" /> : <Save />} Guardar cambios
        </Button>
      </div>
    </form>
  );
}
