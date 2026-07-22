import { AUTHORS } from "@/app/(main)/autor/[slug]/authors.config";

// Normaliza un nombre de autor para comparar: quita tildes, espacios de sobra
// y pasa a minúsculas. books.author es texto libre, con variantes.
function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

// Mapa nombre-normalizado -> slug, construido desde dbAuthors + displayName.
const LOOKUP: Record<string, string> = {};
for (const cfg of Object.values(AUTHORS)) {
  for (const name of cfg.dbAuthors) LOOKUP[normalize(name)] = cfg.slug;
  LOOKUP[normalize(cfg.displayName)] = cfg.slug;
}

/**
 * Devuelve el slug de la página de autor si el nombre coincide con un autor
 * configurado; si no, null (para caer al comportamiento previo /search).
 */
export function resolveAuthorSlug(name: string | null | undefined): string | null {
  if (!name) return null;
  return LOOKUP[normalize(name)] ?? null;
}
