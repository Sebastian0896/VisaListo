import { COUNTRIES } from "@/lib/countries";
import { formatIsoDay } from "@/lib/format";
import { isAnswered, isVisible, YES_NO_OPTIONS, type AnswerMap, type ClientQuestion, type ClientSection, type GroupRow } from "@/lib/form-types";
import { cn } from "@/lib/utils";

export function displayValue(q: ClientQuestion, value: string): string {
  if (!value) return "";
  if (q.type === "YESNO") return YES_NO_OPTIONS.find((o) => o.value === value)?.label ?? value;
  if (q.type === "SELECT" || q.type === "RADIO") return q.options.find((o) => o.value === value)?.label ?? value;
  if (q.type === "DATE") return formatIsoDay(value);
  if (q.type === "COUNTRY") return COUNTRIES.includes(value) ? value : value;
  return value;
}

function groupCell(q: ClientQuestion, fieldKey: string, value: string) {
  const def = q.config.fields?.find((f) => f.key === fieldKey);
  if (!def || !value) return value || "—";
  if (def.type === "YESNO") return value === "yes" ? "Sí" : value === "no" ? "No" : value;
  if (def.type === "SELECT") return def.options?.find((o) => o.value === value)?.label ?? value;
  if (def.type === "DATE") return formatIsoDay(value);
  return value;
}

export function visibleQuestions(section: ClientSection, answers: AnswerMap) {
  const byKey = new Map(section.questions.map((q) => [q.key, q] as const));
  return section.questions.filter((q) => isVisible(q, answers, byKey));
}

/** Lista de preguntas/respuestas de una sección (para revisión, impresión y panel). */
export function SectionAnswers({ section, answers, dense = false }: { section: ClientSection; answers: AnswerMap; dense?: boolean }) {
  const qs = visibleQuestions(section, answers);
  return (
    <dl className={cn("divide-y", dense ? "text-[13px]" : "text-sm")}>
      {qs.map((q) => {
        const v = answers[q.key];
        const answered = isAnswered(q, v);
        return (
          <div key={q.key} className={cn("print-avoid-break grid gap-1 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] sm:gap-4", dense ? "py-1.5" : "py-2.5")}>
            <dt className="text-muted-foreground">
              {q.label}
              {q.required && !answered && <span className="ml-1.5 rounded bg-amber-100 px-1.5 py-0.5 text-[11px] font-medium text-amber-900">Pendiente</span>}
            </dt>
            <dd className="font-medium break-words whitespace-pre-line">
              {q.type === "GROUP" ? (
                Array.isArray(v) && v.length ? (
                  <GroupTable q={q} rows={v} />
                ) : (
                  <span className="font-normal text-muted-foreground">—</span>
                )
              ) : typeof v === "string" && v ? (
                displayValue(q, v)
              ) : (
                <span className="font-normal text-muted-foreground">—</span>
              )}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}

function GroupTable({ q, rows }: { q: ClientQuestion; rows: GroupRow[] }) {
  const fields = q.config.fields ?? [];
  return (
    <ol className="space-y-1.5">
      {rows.map((r, i) => (
        <li key={i} className="rounded-md bg-muted/60 px-2.5 py-1.5 font-normal">
          {fields
            .filter((f) => r[f.key])
            .map((f) => (
              <span key={f.key} className="mr-3 inline-block">
                <span className="text-muted-foreground">{f.label}: </span>
                <span className="font-medium">{groupCell(q, f.key, r[f.key])}</span>
              </span>
            ))}
        </li>
      ))}
    </ol>
  );
}
