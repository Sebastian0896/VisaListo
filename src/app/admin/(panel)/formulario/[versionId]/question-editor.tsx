"use client";

import { ChevronDown, Loader2, Plus, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { addQuestionAction, updateHelpAction, updateQuestionAction } from "@/actions/admin";
import { NativeSelect } from "@/components/form/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type Q = {
  id: string;
  key: string;
  label: string;
  type: string;
  typeLabel: string;
  required: boolean;
  active: boolean;
  order: number;
  options: string;
  conditional: string | null;
  help: { guidance: string; example: string; notApplicable: string; warning: string };
};

export function QuestionEditor({ question: q, draft }: { question: Q; draft: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const form = useForm({
    defaultValues: { label: q.label, required: q.required, active: q.active, order: q.order, options: q.options, ...q.help },
  });
  const hasOptions = q.type === "SELECT" || q.type === "RADIO";

  const save = form.handleSubmit((v) =>
    startTransition(async () => {
      const help = await updateHelpAction(q.id, { guidance: v.guidance, example: v.example, notApplicable: v.notApplicable, warning: v.warning });
      if (!help.ok) return void toast.error(help.error);
      if (draft) {
        const res = await updateQuestionAction(q.id, { label: v.label, required: v.required, active: v.active, order: Number(v.order), options: hasOptions ? v.options : undefined });
        if (!res.ok) return void toast.error(res.error);
      }
      toast.success("Pregunta actualizada");
      form.reset(v);
      router.refresh();
    }),
  );

  return (
    <div>
      <button type="button" onClick={() => setOpen((o) => !o)} className="flex w-full items-start justify-between gap-3 text-left">
        <span className="min-w-0">
          <span className={cn("block text-sm font-medium", !q.active && "text-muted-foreground line-through")}>
            {q.label} {q.required && <span className="text-destructive">*</span>}
          </span>
          <span className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
            <span className="font-mono">{q.key}</span>
            <span>{q.typeLabel}</span>
            {q.conditional && <span>{q.conditional}</span>}
            {!q.active && <span className="font-medium text-amber-700">Inactiva</span>}
          </span>
        </span>
        <ChevronDown className={cn("mt-1 size-4 shrink-0 text-muted-foreground transition", open && "rotate-180")} />
      </button>
      {open && (
        <form onSubmit={save} className="mt-4 space-y-4 rounded-xl border bg-muted/30 p-4">
          {draft && (
            <div className="grid gap-3 sm:grid-cols-[1fr_6rem]">
              <div className="space-y-1.5">
                <Label>Texto de la pregunta</Label>
                <Input className="h-9 bg-card" {...form.register("label")} />
              </div>
              <div className="space-y-1.5">
                <Label>Orden</Label>
                <Input type="number" className="h-9 bg-card" {...form.register("order")} />
              </div>
              <div className="flex gap-5 text-sm sm:col-span-2">
                <label className="flex items-center gap-2"><input type="checkbox" className="size-4 accent-[var(--primary)]" {...form.register("required")} /> Obligatoria</label>
                <label className="flex items-center gap-2"><input type="checkbox" className="size-4 accent-[var(--primary)]" {...form.register("active")} /> Activa</label>
              </div>
              {hasOptions && (
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Opciones (una por línea: valor|Etiqueta)</Label>
                  <Textarea rows={5} className="bg-card font-mono text-xs" {...form.register("options")} />
                  <p className="text-xs text-muted-foreground">No cambie los valores de opciones existentes si ya hay respuestas guardadas con ellos.</p>
                </div>
              )}
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Orientación</Label>
              <Textarea rows={2} className="bg-card" {...form.register("guidance")} />
            </div>
            <div className="space-y-1.5">
              <Label>Ejemplo</Label>
              <Textarea rows={2} className="bg-card" {...form.register("example")} />
            </div>
            <div className="space-y-1.5">
              <Label>Cuándo no aplica</Label>
              <Textarea rows={2} className="bg-card" {...form.register("notApplicable")} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Advertencia</Label>
              <Textarea rows={2} className="bg-card" {...form.register("warning")} />
            </div>
          </div>
          <Button type="submit" size="sm" disabled={pending}>{pending ? <Loader2 className="animate-spin" /> : <Save />} Guardar</Button>
        </form>
      )}
    </div>
  );
}

const NEW_TYPES = [
  ["TEXT", "Texto"], ["TEXTAREA", "Texto largo"], ["EMAIL", "Correo"], ["PHONE", "Teléfono"], ["DATE", "Fecha"],
  ["NUMBER", "Número"], ["SELECT", "Lista"], ["RADIO", "Opción única"], ["YESNO", "Sí / No"], ["COUNTRY", "País"],
] as const;

export function AddQuestion({ sectionId }: { sectionId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const form = useForm({ defaultValues: { key: "", label: "", type: "TEXT" as (typeof NEW_TYPES)[number][0], required: false, guidance: "", options: "" } });
  const type = form.watch("type");
  if (!open) {
    return <Button variant="ghost" size="sm" onClick={() => setOpen(true)}><Plus /> Agregar pregunta</Button>;
  }
  return (
    <form
      className="space-y-3 rounded-xl border bg-muted/30 p-4"
      onSubmit={form.handleSubmit((v) =>
        startTransition(async () => {
          const res = await addQuestionAction(sectionId, v);
          if (!res.ok) return void toast.error(res.error);
          toast.success("Pregunta agregada");
          form.reset();
          setOpen(false);
          router.refresh();
        }),
      )}
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1.5"><Label>Clave interna</Label><Input className="h-9 bg-card font-mono" placeholder="ej. hobby_details" {...form.register("key")} /></div>
        <div className="space-y-1.5 sm:col-span-2"><Label>Texto de la pregunta</Label><Input className="h-9 bg-card" {...form.register("label")} /></div>
        <div className="space-y-1.5">
          <Label>Tipo</Label>
          <NativeSelect className="h-9" {...form.register("type")}>
            {NEW_TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </NativeSelect>
        </div>
        <label className="flex items-end gap-2 pb-2 text-sm"><input type="checkbox" className="size-4 accent-[var(--primary)]" {...form.register("required")} /> Obligatoria</label>
        <div className="space-y-1.5 sm:col-span-3"><Label>Orientación</Label><Textarea rows={2} className="bg-card" {...form.register("guidance")} /></div>
        {(type === "SELECT" || type === "RADIO") && (
          <div className="space-y-1.5 sm:col-span-3"><Label>Opciones (una por línea: valor|Etiqueta)</Label><Textarea rows={4} className="bg-card font-mono text-xs" {...form.register("options")} /></div>
        )}
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={pending}>{pending ? <Loader2 className="animate-spin" /> : <Plus />} Agregar</Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
      </div>
    </form>
  );
}
