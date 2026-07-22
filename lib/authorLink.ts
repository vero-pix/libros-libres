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
 * Devuelve el slug de la página de autor (/autor/[slug]) si el nombre coincide
 * con un autor configurado; si no, null (para caer al comportamiento previo).
 */
export function resolveAuthorSlug(name: string | null | undefined): string | null {
  if (!name) return null;
  return LOOKUP[normalize(name)] ?? null;
}

// Páginas de autor con URL propia (vanity/bespoke), fuera de authors.config.
// Estas landings tienen su propio page.tsx y captan búsquedas de alta demanda,
// así que también reciben enlaces internos desde tarjetas y fichas.
const BESPOKE: Record<string, string> = {
  "pablo neruda": "/pablo-neruda",
  "mario vargas llosa": "/mario-vargas-llosa",
  "georges simenon": "/georges-simenon",
  "marcela paz": "/marcela-paz-libros",
  "megan maxwell": "/megan-maxwell-libros",
};

/**
 * Devuelve la URL COMPLETA de la página de autor cuando existe una — sea de
 * authors.config (/autor/[slug]) o una landing bespoke (/pablo-neruda, etc.).
 * Si no hay página de autor, null (el llamador cae a /search).
 */
export function resolveAuthorUrl(name: string | null | undefined): string | null {
  if (!name) return null;
  const n = normalize(name);
  if (LOOKUP[n]) return `/autor/${LOOKUP[n]}`;
  return BESPOKE[n] ?? null;
}
