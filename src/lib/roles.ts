// Constantes compartidas entre servidor y cliente (no pueden vivir en un archivo "use client").
export const ROLE_LABELS = { ADMIN: "Administrador", ADVISOR: "Asesor" } as const;
export const PASSWORD_HINT = "Mínimo 10 caracteres, con letras y al menos un número.";
