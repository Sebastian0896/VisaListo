// Tipos compartidos (cliente y servidor) para la definición dinámica del formulario.

export type QType =
  | "TEXT"
  | "TEXTAREA"
  | "EMAIL"
  | "PHONE"
  | "DATE"
  | "NUMBER"
  | "SELECT"
  | "RADIO"
  | "YESNO"
  | "COUNTRY"
  | "GROUP";

export type OptionDef = { value: string; label: string };

export type GroupFieldDef = {
  key: string;
  label: string;
  type: Exclude<QType, "GROUP" | "TEXTAREA" | "RADIO"> | "TEXTAREA";
  required?: boolean;
  options?: OptionDef[];
  placeholder?: string;
};

export type QuestionConfig = {
  maxLength?: number;
  min?: number;
  max?: number;
  /** La fecha debe ser pasada */
  past?: boolean;
  /** La fecha debe ser futura */
  future?: boolean;
  rows?: number;
  fields?: GroupFieldDef[];
  maxItems?: number;
  addLabel?: string;
};

export type ShowIf = { question: string; equals: string | string[] };

export type HelpDef = {
  guidance: string;
  example?: string | null;
  notApplicable?: string | null;
  warning?: string | null;
};

/** Pregunta tal como la recibe la interfaz del cliente */
export type ClientQuestion = {
  id: string;
  key: string;
  label: string;
  type: QType;
  required: boolean;
  sensitive: boolean;
  placeholder: string | null;
  config: QuestionConfig;
  showIf: ShowIf | null;
  options: OptionDef[];
  help: HelpDef | null;
};

export type ClientSection = {
  id: string;
  key: string;
  order: number;
  title: string;
  description: string | null;
  notice: string | null;
  questions: ClientQuestion[];
};

export type GroupRow = Record<string, string>;
export type AnswerValue = string | GroupRow[];
export type AnswerMap = Record<string, AnswerValue>;

export const YES_NO_OPTIONS: OptionDef[] = [
  { value: "yes", label: "Sí" },
  { value: "no", label: "No" },
];

/** ¿Está visible la pregunta según las respuestas actuales? */
export function isVisible(q: { showIf: ShowIf | null }, answers: AnswerMap, byKey?: Map<string, { showIf: ShowIf | null }>): boolean {
  if (!q.showIf) return true;
  const current = answers[q.showIf.question];
  const expected = Array.isArray(q.showIf.equals) ? q.showIf.equals : [q.showIf.equals];
  const ok = typeof current === "string" && expected.includes(current);
  if (!ok) return false;
  // Si la pregunta de la que depende tampoco es visible, esta tampoco
  const parent = byKey?.get(q.showIf.question);
  return parent ? isVisible(parent, answers, byKey) : true;
}

export function isAnswered(q: Pick<ClientQuestion, "type" | "config">, value: AnswerValue | undefined): boolean {
  if (value === undefined || value === null) return false;
  if (q.type === "GROUP") {
    if (!Array.isArray(value) || value.length === 0) return false;
    const required = (q.config.fields ?? []).filter((f) => f.required);
    return value.every((row) => required.every((f) => (row[f.key] ?? "").toString().trim() !== ""));
  }
  return typeof value === "string" && value.trim() !== "";
}

export type SectionProgress = { answeredRequired: number; totalRequired: number; answeredCount: number; completed: boolean };

export function computeSectionProgress(section: Pick<ClientSection, "questions">, answers: AnswerMap): SectionProgress {
  const byKey = new Map(section.questions.map((q) => [q.key, q] as const));
  let totalRequired = 0;
  let answeredRequired = 0;
  let answeredCount = 0;
  for (const q of section.questions) {
    if (!isVisible(q, answers, byKey)) continue;
    const answered = isAnswered(q, answers[q.key]);
    if (answered) answeredCount++;
    if (q.required) {
      totalRequired++;
      if (answered) answeredRequired++;
    }
  }
  return { answeredRequired, totalRequired, answeredCount, completed: answeredRequired === totalRequired };
}

export function formatAnswer(q: Pick<ClientQuestion, "type" | "options">, value: AnswerValue | undefined): string {
  if (value === undefined || value === "" || (Array.isArray(value) && value.length === 0)) return "";
  if (Array.isArray(value)) return `${value.length} registro(s)`;
  if (q.type === "YESNO") return value === "yes" ? "Sí" : value === "no" ? "No" : value;
  if (q.type === "SELECT" || q.type === "RADIO") return q.options.find((o) => o.value === value)?.label ?? value;
  return value;
}
