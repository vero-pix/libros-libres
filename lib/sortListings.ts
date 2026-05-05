import type { ListingWithBook } from "@/types";

/**
 * Heurística: detectar libros que NO están en español.
 * Prefiere la columna `language` (backfill desde Open Library) si está seteada.
 * Fallback a heurística de texto.
 */
export function looksNonSpanish(l: ListingWithBook): boolean {
  const lang = (l.book as any).language as string | null | undefined;
  if (lang) return lang !== "es";
  const text = `${l.book.title ?? ""} ${l.book.author ?? ""}`.toLowerCase();
  if (/[äöüß]/.test(text)) return true;
  if (/\b(der|die|das|und|ein|eine|für|nicht|mit|ist|sich|auf|dem|den|wenn|wir|ich)\b/.test(text)) return true;
  if (/\bfrisch\b|\bkafka\b|\bhesse\b|\bgrass\b|\bmann\b/.test(text)) return true;
  return false;
}

export function hasCover(l: ListingWithBook): boolean {
  return !!(l.cover_image_url || l.book?.cover_url);
}

export function isPolitical(l: ListingWithBook): boolean {
  const text = `${l.book?.title ?? ""} ${l.book?.author ?? ""} ${l.book?.description ?? ""}`.toLowerCase();
  if (/\b(pinochet|allende|marx|comunismo|socialismo|dictadura|golpe|derecha|izquierda|revolución|capitalismo|marxismo)\b/.test(text)) return true;
  return false;
}

/**
 * Orden de presentación: deprioritized al final, featured arriba,
 * con portada primero, español primero. Mantiene el orden del query
 * dentro de cada tier (sort estable).
 *
 * Úsalo cuando quieras el orden "por defecto" de tuslibros, sin que un
 * sort custom del usuario (precio, distancia) lo sobrescriba.
 */
export function sortListingsForDisplay<T extends ListingWithBook>(listings: T[]): T[] {
  return [...listings].sort((a, b) => {
    // 1. Política al final
    const polA = isPolitical(a), polB = isPolitical(b);
    if (polA !== polB) return polA ? 1 : -1;


    const depA = !!(a as any).deprioritized, depB = !!(b as any).deprioritized;
    if (depA !== depB) return depA ? 1 : -1;
    const fA = !!(a as any)._featured, fB = !!(b as any)._featured;
    if (fA !== fB) return fA ? -1 : 1;
    const coverA = hasCover(a), coverB = hasCover(b);
    if (coverA !== coverB) return coverA ? -1 : 1;
    const nonEsA = looksNonSpanish(a), nonEsB = looksNonSpanish(b);
    if (nonEsA !== nonEsB) return nonEsA ? 1 : -1;
    return 0;
  });
}
