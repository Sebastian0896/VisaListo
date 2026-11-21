import "server-only";
import { evaluateAssessment, type AssessmentAnswers, type AssessmentResult } from "@/lib/assessment";
import { decryptJson, encryptJson } from "@/lib/crypto";
import { db } from "@/lib/db";
import type { AnswerMap } from "@/lib/form-types";

type Stored = { answers: AssessmentAnswers; result: AssessmentResult };

export async function saveAssessment(fileId: string, answers: AssessmentAnswers) {
  // El resultado se recalcula siempre en el servidor (no se confía en el navegador)
  const result = evaluateAssessment(answers);
  const row = await db.profileAssessment.create({
    data: { applicationFileId: fileId, level: result.level, hasFlags: result.flags.length > 0, dataEnc: encryptJson({ answers, result } satisfies Stored) },
  });
  return { result, createdAt: row.createdAt };
}

export async function latestAssessment(fileId: string) {
  const row = await db.profileAssessment.findFirst({ where: { applicationFileId: fileId }, orderBy: { createdAt: "desc" } });
  if (!row) return null;
  const data = decryptJson<Stored>(row.dataEnc);
  if (!data) return null;
  // Se recalcula con las reglas vigentes por si cambiaron los textos o consejos
  return { answers: data.answers, result: evaluateAssessment(data.answers), createdAt: row.createdAt };
}

/** Respuestas sugeridas a partir del formulario DS-160 ya completado (el cliente las confirma). */
export function prefillFromForm(a: AnswerMap): AssessmentAnswers {
  const s = (k: string) => (typeof a[k] === "string" ? (a[k] as string) : "");
  const out: AssessmentAnswers = {};

  const occ = ({ employed: "employed", student: "student", retired: "retired", unemployed: "none", homemaker: "none" } as Record<string, string>)[s("occupation")];
  if (occ) out.occupation = occ;

  if (["student", "retired", "unemployed", "homemaker"].includes(s("occupation"))) out.tenure = "na";
  else if (/^\d{4}-\d{2}-\d{2}$/.test(s("job_start"))) {
    const years = (Date.now() - Date.parse(s("job_start"))) / (365.25 * 86400_000);
    out.tenure = years >= 3 ? "3y" : years >= 1 ? "1y" : years >= 0.5 ? "6m" : "lt6m";
  }

  const income = Number(s("monthly_income").replace(",", "."));
  if (s("monthly_income") && Number.isFinite(income)) out.income = income > 100000 ? "gt100" : income >= 50000 ? "50to100" : income >= 25000 ? "25to50" : income > 0 ? "lt25" : "none";

  if (s("marital_status") || s("has_children")) {
    const partner = ["married", "common_law", "civil_union"].includes(s("marital_status"));
    out.dependents = partner || s("has_children") === "yes" ? "yes" : "no";
  }

  const parentStatuses = [s("father_in_us") === "yes" ? s("father_us_status") : "", s("mother_in_us") === "yes" ? s("mother_us_status") : ""].filter(Boolean);
  if (parentStatuses.includes("other")) out.usRelatives = "irregular";
  else if (parentStatuses.length || s("relatives_in_us") === "yes") out.usRelatives = "legal";
  else if (s("father_in_us") === "no" && s("mother_in_us") === "no" && s("relatives_in_us") === "no") out.usRelatives = "no";

  const visited = s("other_countries_visited").trim();
  if (visited) {
    const list = visited.split(/[,;\n]+/).map((x) => x.trim()).filter((x) => x && !/^ningun[oa]?$/i.test(x));
    out.trips = list.length >= 3 ? "3plus" : list.length >= 1 ? "1to2" : "none";
  }

  if (s("had_us_visa") === "yes") out.prevUsVisa = s("sec_overstay") === "yes" ? "overstay" : "usedWell";
  else if (s("had_us_visa") === "no") out.prevUsVisa = "never";

  if (s("visa_refused") === "no") out.refusals = "never";

  if (s("sec_removal") === "yes" || s("sec_immigration_fraud") === "yes") out.immigrationIssue = "yes";
  else if (s("sec_removal") === "no") out.immigrationIssue = "no";

  if (s("has_travel_plans") === "no") out.plan = "unclear";
  else if (s("has_travel_plans") === "yes" && s("stay_length")) {
    const n = Number(s("stay_length"));
    const days = n * ({ days: 1, weeks: 7, months: 30, years: 365 } as Record<string, number>)[s("stay_unit") || "days"];
    out.plan = days <= 21 ? "clearShort" : "clearLong";
  }

  const payer = ({ self: "self", employer: "company", us_employer: "company", organization: "company" } as Record<string, string>)[s("payer")];
  if (payer) out.payer = payer;

  return out;
}
