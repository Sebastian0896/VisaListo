/** Normaliza texto para comparaciones: minúsculas, sin tildes, espacios simples. */
export function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9ñ\s'-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Normaliza un código de expediente escrito por el usuario (acepta minúsculas, espacios y O/0, I/1). */
export function normalizeCode(value: string): string {
  const compact = value
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .replace(/O/g, "0")
    .replace(/[IL]/g, "1");
  const body = compact.startsWith("DS") ? compact.slice(2) : compact;
  if (body.length !== 12) return compact;
  return `DS-${body.slice(0, 4)}-${body.slice(4, 8)}-${body.slice(8, 12)}`;
}
