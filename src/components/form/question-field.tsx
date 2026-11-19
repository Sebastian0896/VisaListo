"use client";

import { Plus, Trash2 } from "lucide-react";
import { Controller, useFieldArray, type Control, type FieldValues } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { COUNTRIES } from "@/lib/countries";
import { YES_NO_OPTIONS, type ClientQuestion, type GroupFieldDef, type OptionDef } from "@/lib/form-types";
import { cn } from "@/lib/utils";
import { FieldError, HelpPopover, NativeSelect } from "./primitives";

type Props = {
  question: ClientQuestion;
  control: Control<FieldValues>;
  error?: string;
  disabled?: boolean;
  showRequiredHint?: boolean;
};

const inputCls = "h-10 bg-white";

export function QuestionField({ question: q, control, error, disabled, showRequiredHint }: Props) {
  const id = `q-${q.key}`;
  const errId = `${id}-error`;
  return (
    <div className="print-avoid-break space-y-2 rounded-xl border border-transparent p-1 sm:p-0" data-question={q.key}>
      <div className="flex items-start gap-1.5">
        <label htmlFor={q.type === "GROUP" || q.type === "RADIO" || q.type === "YESNO" ? undefined : id} id={`${id}-label`} className="pt-0.5 text-[15px] leading-snug font-medium">
          {q.label}
          {q.required && <span className="ml-1 text-destructive" aria-hidden>*</span>}
          {q.required && <span className="sr-only"> (obligatoria)</span>}
        </label>
        {q.help && <HelpPopover help={q.help} label={q.label} />}
      </div>
      {q.help?.guidance && <p className="-mt-1 text-[13px] leading-relaxed text-muted-foreground">{q.help.guidance}</p>}

      {q.type === "GROUP" ? (
        <GroupField question={q} control={control} disabled={disabled} />
      ) : (
        <Controller
          name={q.key}
          control={control}
          render={({ field }) => {
            const common = {
              id,
              disabled,
              "aria-invalid": !!error,
              "aria-describedby": error ? errId : undefined,
              value: (field.value as string) ?? "",
              onBlur: field.onBlur,
              name: field.name,
            };
            switch (q.type) {
              case "TEXTAREA":
                return <Textarea {...common} ref={field.ref} rows={q.config.rows ?? 3} maxLength={q.config.maxLength ?? 4000} placeholder={q.placeholder ?? undefined} onChange={(e) => field.onChange(e.target.value)} className="min-h-20 bg-white" />;
              case "DATE":
                return <Input {...common} ref={field.ref} type="date" onChange={(e) => field.onChange(e.target.value)} className={cn(inputCls, "w-full sm:w-56")} />;
              case "NUMBER":
                return <Input {...common} ref={field.ref} inputMode="decimal" placeholder={q.placeholder ?? undefined} onChange={(e) => field.onChange(e.target.value)} className={cn(inputCls, "w-full sm:w-56")} />;
              case "EMAIL":
                return <Input {...common} ref={field.ref} type="email" autoComplete="email" placeholder={q.placeholder ?? "nombre@correo.com"} onChange={(e) => field.onChange(e.target.value)} className={inputCls} />;
              case "PHONE":
                return <Input {...common} ref={field.ref} type="tel" autoComplete="tel" placeholder={q.placeholder ?? "+1 809 000 0000"} onChange={(e) => field.onChange(e.target.value)} className={cn(inputCls, "sm:w-72")} />;
              case "SELECT":
                return <SelectInput {...common} selectRef={field.ref} options={q.options} onChange={field.onChange} />;
              case "COUNTRY":
                return <SelectInput {...common} selectRef={field.ref} options={COUNTRIES.map((c) => ({ value: c, label: c }))} onChange={field.onChange} />;
              case "RADIO":
              case "YESNO":
                return <RadioCards name={field.name} labelledBy={`${id}-label`} value={common.value} options={q.type === "YESNO" ? YES_NO_OPTIONS : q.options} disabled={disabled} onChange={field.onChange} onBlur={field.onBlur} compact={q.type === "YESNO"} />;
              default:
                return <Input {...common} ref={field.ref} maxLength={q.config.maxLength ?? 200} placeholder={q.placeholder ?? undefined} onChange={(e) => field.onChange(e.target.value)} className={inputCls} />;
            }
          }}
        />
      )}
      <FieldError id={errId} message={error} />
      {!error && showRequiredHint && <p className="text-[13px] font-medium text-amber-700">Pregunta obligatoria pendiente</p>}
    </div>
  );
}

function SelectInput({
  options,
  onChange,
  selectRef,
  ...rest
}: { options: OptionDef[]; onChange: (v: string) => void; selectRef: React.Ref<HTMLSelectElement>; id: string; value: string; disabled?: boolean; name: string; onBlur: () => void; "aria-invalid": boolean; "aria-describedby"?: string }) {
  return (
    <NativeSelect ref={selectRef} {...rest} onChange={(e) => onChange(e.target.value)} className="sm:max-w-md">
      <option value="">Seleccione…</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </NativeSelect>
  );
}

function RadioCards({
  name,
  value,
  options,
  disabled,
  onChange,
  onBlur,
  labelledBy,
  compact,
}: {
  name: string;
  value: string;
  options: OptionDef[];
  disabled?: boolean;
  onChange: (v: string) => void;
  onBlur: () => void;
  labelledBy: string;
  compact?: boolean;
}) {
  return (
    <div role="radiogroup" aria-labelledby={labelledBy} className={cn("flex flex-wrap gap-2", !compact && "sm:max-w-xl")}>
      {options.map((o) => {
        const checked = value === o.value;
        return (
          <label
            key={o.value}
            className={cn(
              "flex cursor-pointer items-center gap-2.5 rounded-lg border bg-white px-4 py-2.5 text-sm transition select-none has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50",
              checked ? "border-primary bg-secondary font-medium text-primary" : "hover:border-foreground/25",
              compact ? "min-w-24" : "",
              disabled && "cursor-not-allowed opacity-60",
            )}
          >
            <input type="radio" className="size-4 accent-[var(--primary)]" name={name} value={o.value} checked={checked} disabled={disabled} onChange={() => onChange(o.value)} onBlur={onBlur} />
            {o.label}
          </label>
        );
      })}
      {value && !disabled && (
        <button type="button" onClick={() => onChange("")} className="px-2 text-xs text-muted-foreground underline-offset-2 hover:underline">
          Borrar
        </button>
      )}
    </div>
  );
}

function GroupField({ question: q, control, disabled }: { question: ClientQuestion; control: Control<FieldValues>; disabled?: boolean }) {
  const { fields, append, remove } = useFieldArray({ control, name: q.key });
  const defs = q.config.fields ?? [];
  const max = q.config.maxItems ?? 20;
  const empty = Object.fromEntries(defs.map((f) => [f.key, ""]));
  return (
    <div className="space-y-3">
      {fields.length === 0 && <p className="rounded-lg border border-dashed bg-white/60 px-4 py-3 text-sm text-muted-foreground">No hay registros agregados.</p>}
      {fields.map((row, i) => (
        <fieldset key={row.id} className="print-avoid-break rounded-xl border bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <legend className="text-sm font-semibold text-muted-foreground">Registro {i + 1}</legend>
            {!disabled && (
              <Button type="button" variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => remove(i)}>
                <Trash2 /> Quitar
              </Button>
            )}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {defs.map((f) => (
              <GroupSubField key={f.key} def={f} name={`${q.key}.${i}.${f.key}`} control={control} disabled={disabled} />
            ))}
          </div>
        </fieldset>
      ))}
      {!disabled && fields.length < max && (
        <Button type="button" variant="outline" onClick={() => append(empty)}>
          <Plus /> {q.config.addLabel ?? "Agregar"}
        </Button>
      )}
    </div>
  );
}

function GroupSubField({ def, name, control, disabled }: { def: GroupFieldDef; name: string; control: Control<FieldValues>; disabled?: boolean }) {
  const id = name.replace(/\./g, "-");
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => {
        const value = (field.value as string) ?? "";
        const label = (
          <label htmlFor={id} className="text-[13px] font-medium">
            {def.label}
            {def.required && <span className="ml-0.5 text-destructive">*</span>}
          </label>
        );
        let input: React.ReactNode;
        if (def.type === "SELECT" || def.type === "COUNTRY" || def.type === "YESNO") {
          const options = def.type === "COUNTRY" ? COUNTRIES.map((c) => ({ value: c, label: c })) : def.type === "YESNO" ? YES_NO_OPTIONS : def.options ?? [];
          input = (
            <NativeSelect id={id} ref={field.ref} value={value} disabled={disabled} onBlur={field.onBlur} onChange={(e) => field.onChange(e.target.value)}>
              <option value="">Seleccione…</option>
              {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </NativeSelect>
          );
        } else {
          input = (
            <Input
              id={id}
              ref={field.ref}
              value={value}
              disabled={disabled}
              type={def.type === "DATE" ? "date" : def.type === "EMAIL" ? "email" : def.type === "PHONE" ? "tel" : "text"}
              placeholder={def.placeholder}
              onBlur={field.onBlur}
              onChange={(e) => field.onChange(e.target.value)}
              className={inputCls}
            />
          );
        }
        return (
          <div className="space-y-1">
            {label}
            {input}
          </div>
        );
      }}
    />
  );
}
