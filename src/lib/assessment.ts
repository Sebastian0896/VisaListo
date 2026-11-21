/**
 * Autoevaluación del perfil para visa de turismo/negocios (B1/B2).
 *
 * NO es una predicción ni una probabilidad de aprobación: la decisión es del cónsul tras la entrevista.
 * Evalúa la FORTALEZA del perfil según los factores que suelen pesar en la entrevista
 * (sobre todo, los lazos con el país de residencia). Solo usa factores que el solicitante
 * puede demostrar o mejorar; no usa sexo, religión, edad ni datos de ese tipo.
 * Módulo compartido cliente/servidor (sin dependencias de servidor).
 */

export type AreaKey = "work" | "family" | "travel" | "history" | "purpose";
export type Level = "strong" | "moderate" | "weak";
export type FlagSeverity = "high" | "medium";

export type Option = { value: string; label: string; points: number; flag?: { severity: FlagSeverity; message: string } };
export type AssessmentQuestion = { key: string; area: AreaKey; label: string; help?: string; options: Option[] };

export const AREAS: Record<AreaKey, { title: string; weight: number }> = {
  work: { title: "Empleo e ingresos", weight: 35 },
  family: { title: "Arraigo familiar y bienes", weight: 20 },
  travel: { title: "Historial de viajes", weight: 20 },
  purpose: { title: "Propósito y financiamiento del viaje", weight: 15 },
  history: { title: "Antecedentes migratorios", weight: 10 },
};

export const ASSESSMENT_QUESTIONS: AssessmentQuestion[] = [
  {
    key: "occupation",
    area: "work",
    label: "¿Cuál es su situación laboral actual?",
    options: [
      { value: "employed", label: "Empleado(a) con contrato o en nómina", points: 4 },
      { value: "business", label: "Negocio propio formal (con RNC o registro)", points: 4 },
      { value: "retired", label: "Jubilado(a) o pensionado(a)", points: 3 },
      { value: "informal", label: "Trabajo independiente o informal", points: 2 },
      { value: "student", label: "Estudiante", points: 2 },
      { value: "none", label: "Sin empleo actualmente", points: 0 },
    ],
  },
  {
    key: "tenure",
    area: "work",
    label: "¿Cuánto tiempo lleva en ese trabajo, negocio o actividad?",
    options: [
      { value: "3y", label: "Más de 3 años", points: 3 },
      { value: "1y", label: "Entre 1 y 3 años", points: 2 },
      { value: "6m", label: "Entre 6 meses y 1 año", points: 1 },
      { value: "lt6m", label: "Menos de 6 meses", points: 0 },
      { value: "na", label: "No aplica (estudiante, jubilado o sin empleo)", points: 1 },
    ],
  },
  {
    key: "income",
    area: "work",
    label: "¿Cuál es su ingreso mensual aproximado (en pesos dominicanos)?",
    help: "Sume todos sus ingresos regulares: salario, negocio, pensión, alquileres.",
    options: [
      { value: "gt100", label: "Más de RD$100,000", points: 4 },
      { value: "50to100", label: "Entre RD$50,000 y RD$100,000", points: 3 },
      { value: "25to50", label: "Entre RD$25,000 y RD$50,000", points: 2 },
      { value: "lt25", label: "Menos de RD$25,000", points: 1 },
      { value: "none", label: "No tengo ingresos propios", points: 0 },
    ],
  },
  {
    key: "proof",
    area: "work",
    label: "¿Puede demostrar sus ingresos con documentos?",
    help: "Carta de trabajo, estados de cuenta, declaraciones de impuestos, documentos del negocio.",
    options: [
      { value: "yes", label: "Sí, con documentos formales", points: 3 },
      { value: "partial", label: "Solo en parte", points: 1 },
      { value: "no", label: "No", points: 0 },
    ],
  },
  {
    key: "dependents",
    area: "family",
    label: "¿Tiene cónyuge, hijos u otras personas que dependen de usted y que se quedarán en su país?",
    options: [
      { value: "yes", label: "Sí", points: 3 },
      { value: "no", label: "No", points: 1 },
    ],
  },
  {
    key: "assets",
    area: "family",
    label: "¿Tiene bienes a su nombre en su país (vivienda, vehículo, terreno, negocio)?",
    options: [
      { value: "several", label: "Sí, varios", points: 3 },
      { value: "one", label: "Sí, uno", points: 2 },
      { value: "none", label: "No", points: 0 },
    ],
  },
  {
    key: "usRelatives",
    area: "family",
    label: "¿Tiene familiares cercanos (padres, hijos, hermanos, cónyuge) viviendo en EE. UU.?",
    help: "Tener familia en EE. UU. no impide obtener la visa, pero el cónsul puede preguntar por ella.",
    options: [
      { value: "no", label: "No", points: 2 },
      { value: "legal", label: "Sí, con estatus legal (ciudadanos, residentes o con visa)", points: 1 },
      { value: "irregular", label: "Sí, sin estatus legal o no lo sé", points: 0 },
    ],
  },
  {
    key: "trips",
    area: "travel",
    label: "¿A cuántos países ha viajado en los últimos 5 años?",
    options: [
      { value: "3plus", label: "A 3 países o más", points: 3 },
      { value: "1to2", label: "A 1 o 2 países", points: 2 },
      { value: "none", label: "No he viajado fuera de mi país", points: 0 },
    ],
  },
  {
    key: "otherVisas",
    area: "travel",
    label: "¿Tiene o ha tenido visas de Canadá, Reino Unido, Europa (Schengen) u otros países exigentes?",
    options: [
      { value: "several", label: "Sí, más de una", points: 3 },
      { value: "one", label: "Sí, una", points: 2 },
      { value: "none", label: "No", points: 0 },
    ],
  },
  {
    key: "prevUsVisa",
    area: "history",
    label: "¿Ha tenido antes una visa de EE. UU.?",
    options: [
      { value: "usedWell", label: "Sí, y siempre respeté el tiempo permitido", points: 4 },
      { value: "never", label: "No, nunca", points: 2 },
      {
        value: "overstay",
        label: "Sí, y alguna vez me quedé más tiempo del permitido",
        points: 0,
        flag: { severity: "high", message: "Una permanencia mayor a la autorizada puede afectar seriamente una nueva solicitud. Hable con su asesor antes de aplicar." },
      },
    ],
  },
  {
    key: "refusals",
    area: "history",
    label: "¿Le han negado alguna vez una visa de EE. UU.?",
    options: [
      { value: "never", label: "Nunca", points: 3 },
      { value: "old", label: "Sí, una vez, hace más de un año", points: 2 },
      {
        value: "recent",
        label: "Sí, en el último año",
        points: 1,
        flag: { severity: "medium", message: "Si le negaron la visa hace poco y su situación no ha cambiado, el resultado suele repetirse. Conviene aplicar cuando su perfil haya mejorado." },
      },
      {
        value: "several",
        label: "Sí, varias veces",
        points: 0,
        flag: { severity: "medium", message: "Varias negaciones indican que algo de su perfil no convenció. Analice con su asesor qué cambiar antes de volver a aplicar." },
      },
    ],
  },
  {
    key: "immigrationIssue",
    area: "history",
    label: "¿Ha sido deportado(a), devuelto(a) en un aeropuerto o tenido algún problema migratorio en EE. UU.?",
    options: [
      { value: "no", label: "No", points: 3 },
      {
        value: "yes",
        label: "Sí",
        points: 0,
        flag: { severity: "high", message: "Los antecedentes migratorios pueden requerir trámites especiales o hacer inadmisible la solicitud. Hable con su asesor antes de pagar la cita." },
      },
    ],
  },
  {
    key: "plan",
    area: "purpose",
    label: "¿Tiene claro el motivo, las fechas aproximadas y la duración de su viaje?",
    options: [
      { value: "clearShort", label: "Sí, es un viaje corto (hasta 3 semanas)", points: 3 },
      { value: "clearLong", label: "Sí, pero será largo (más de un mes)", points: 1 },
      { value: "unclear", label: "Todavía no lo tengo claro", points: 0 },
    ],
  },
  {
    key: "payer",
    area: "purpose",
    label: "¿Quién pagará el viaje?",
    options: [
      { value: "self", label: "Yo mismo(a)", points: 3 },
      { value: "company", label: "Mi empresa o empleador", points: 3 },
      { value: "familyHome", label: "Un familiar que vive en mi país", points: 2 },
      { value: "familyUs", label: "Un familiar o amigo que vive en EE. UU.", points: 1 },
    ],
  },
];

export type AssessmentAnswers = Record<string, string>;

export type AssessmentResult = {
  level: Level;
  score: number; // 0-1, uso interno (no se muestra como probabilidad)
  areas: { key: AreaKey; title: string; level: Level }[];
  flags: { severity: FlagSeverity; message: string }[];
  tips: string[];
};

export const LEVEL_TEXT: Record<Level, { title: string; summary: string }> = {
  strong: {
    title: "Perfil sólido",
    summary: "Su perfil muestra lazos fuertes con su país y un historial que suele valorarse bien. Prepárese bien para la entrevista: es lo que define el resultado.",
  },
  moderate: {
    title: "Perfil moderado",
    summary: "Su perfil tiene puntos a favor y otros que conviene reforzar. Con buena preparación y documentos que respalden sus lazos, puede presentarse con confianza.",
  },
  weak: {
    title: "Conviene fortalecer su perfil",
    summary: "Hoy su perfil tiene puntos débiles que el cónsul podría notar. Puede aplicar igual, pero quizás le convenga prepararse un tiempo y reforzar sus lazos antes.",
  },
};

/** Mensaje obligatorio en todo resultado */
export const DISCLAIMER =
  "Esta autoevaluación es orientativa y no predice el resultado. La decisión es exclusiva del cónsul y se toma en la entrevista: hay personas que cumplen todos los requisitos y no obtienen la visa, y otras que aparentemente no los cumplen y sí la obtienen. No se limite por este resultado; úselo para prepararse mejor.";

const TIPS: Record<AreaKey, string[]> = {
  work: [
    "Lleve carta de trabajo reciente con cargo, fecha de ingreso, salario y vacaciones aprobadas.",
    "Si tiene negocio, lleve su RNC, registro mercantil y estados de cuenta del negocio.",
    "Si su empleo es reciente o informal, reúna estados de cuenta que muestren ingresos regulares.",
  ],
  family: [
    "Explique con naturalidad a quiénes deja en su país y por qué regresará.",
    "Lleve títulos de propiedad, matrícula de vehículo o documentos de su negocio, si los tiene.",
  ],
  travel: [
    "Viajar antes a otros países (y regresar a tiempo) fortalece su historial para el futuro.",
    "Lleve su pasaporte anterior si tiene sellos o visas de otros países.",
  ],
  history: [
    "Responda siempre con la verdad sobre negaciones o problemas anteriores; ocultarlos es más grave.",
    "Si le negaron la visa, aplique de nuevo solo cuando algo importante de su situación haya cambiado.",
  ],
  purpose: [
    "Defina un plan concreto y corto: fechas, ciudad, dónde se hospedará y qué hará.",
    "Si alguien le paga el viaje, prepare cómo explicar la relación y la razón.",
  ],
};

function levelOf(ratio: number): Level {
  return ratio >= 0.7 ? "strong" : ratio >= 0.45 ? "moderate" : "weak";
}

/** ¿Están respondidas todas las preguntas con opciones válidas? */
export function validateAssessment(answers: unknown): answers is AssessmentAnswers {
  if (typeof answers !== "object" || answers === null) return false;
  const a = answers as Record<string, unknown>;
  return ASSESSMENT_QUESTIONS.every((q) => typeof a[q.key] === "string" && q.options.some((o) => o.value === a[q.key]));
}

export function evaluateAssessment(answers: AssessmentAnswers): AssessmentResult {
  const byArea = new Map<AreaKey, { got: number; max: number }>();
  const flags: AssessmentResult["flags"] = [];
  for (const q of ASSESSMENT_QUESTIONS) {
    const max = Math.max(...q.options.map((o) => o.points));
    const opt = q.options.find((o) => o.value === answers[q.key]);
    const acc = byArea.get(q.area) ?? { got: 0, max: 0 };
    acc.got += opt?.points ?? 0;
    acc.max += max;
    byArea.set(q.area, acc);
    if (opt?.flag) flags.push(opt.flag);
  }
  let total = 0;
  let weights = 0;
  const areas = (Object.keys(AREAS) as AreaKey[]).map((key) => {
    const v = byArea.get(key) ?? { got: 0, max: 1 };
    const ratio = v.max ? v.got / v.max : 0;
    total += ratio * AREAS[key].weight;
    weights += AREAS[key].weight;
    return { key, title: AREAS[key].title, level: levelOf(ratio) };
  });
  let score = weights ? total / weights : 0;
  // Las alertas graves impiden un resultado «sólido»
  if (flags.some((f) => f.severity === "high")) score = Math.min(score, 0.44);
  else if (flags.length) score = Math.min(score, 0.69);
  const level = levelOf(score);
  const tips = areas.filter((a) => a.level !== "strong").flatMap((a) => TIPS[a.key]).slice(0, 6);
  if (!tips.length) tips.push("Practique la entrevista: respuestas breves, claras y siempre verdaderas.", "Lleve sus documentos organizados, aunque el cónsul no siempre los pida.");
  flags.sort((a, b) => (a.severity === b.severity ? 0 : a.severity === "high" ? -1 : 1));
  return { level, score, areas, flags, tips };
}
