import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

export const DISCLAIMER_SHORT =
  "Plataforma privada de preparación y asesoría. No es el formulario DS-160 oficial ni un sitio del Gobierno de los Estados Unidos, y no está afiliada al Departamento de Estado.";

export function DisclaimerBar({ className }: { className?: string }) {
  return (
    <div className={cn("border-b border-amber-200/70 bg-amber-50 text-amber-950", className)}>
      <p className="mx-auto flex max-w-6xl items-start gap-2 px-4 py-2 text-xs leading-relaxed sm:items-center">
        <Info className="mt-0.5 size-3.5 shrink-0 sm:mt-0" aria-hidden />
        <span>{DISCLAIMER_SHORT}</span>
      </p>
    </div>
  );
}

export function DisclaimerBox({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950", className)}>
      <p className="font-medium">Aviso importante</p>
      <p className="mt-1 leading-relaxed">
        {DISCLAIMER_SHORT} Aquí solo se recopila y organiza su información para la asesoría; ninguna solicitud se envía a
        instituciones gubernamentales. La solicitud oficial se completa por separado en el portal oficial.
      </p>
    </div>
  );
}
