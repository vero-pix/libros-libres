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
 * Semilla del día (fecha en Chile). Cambia una vez al día, así el orden es
 * estable mientras dura la visita y entre recargas — pero mañana es otro.
 */
function semillaDelDia(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/Santiago" });
}

/**
 * Número estable entre 0 y 1 para un listing en un día dado. Determinista: el
 * mismo libro saca el mismo número toda la jornada, en el servidor y en cada
 * request, así que la caché y la paginación no se contradicen.
 */
function turnoDelDia(id: string, semilla: string): number {
  let h = 2166136261;
  const s = `${id}|${semilla}`;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 100000) / 100000;
}

/**
 * Orden de presentación: deprioritized al final, featured arriba,
 * con portada primero, español primero.
 *
 * Dentro de cada tier el desempate es un TURNO DIARIO, no el orden del query.
 * Antes mandaba `trending_score`, y eso congelaba el catálogo: el 29-08-2026,
 * 3.563 de 3.869 libros activos (el 92%) tenían cero visitas, así que competían
 * por aparecer contra los 306 que ya habían tenido suerte — y perdían siempre.
 * Un libro sin visitas no se muestra, y no se muestra porque no tiene visitas.
 *
 * Con el turno diario cada libro tiene su día arriba. La semilla es la fecha, no
 * el reloj: el orden no cambia entre recargas ni pelea con la caché.
 *
 * Úsalo cuando quieras el orden "por defecto" de tuslibros, sin que un
 * sort custom del usuario (precio, distancia) lo sobrescriba.
 */
export function sortListingsForDisplay<T extends ListingWithBook>(listings: T[]): T[] {
  const semilla = semillaDelDia();
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
    // Desempate: el turno del día. Sin esto ganaba siempre el mismo.
    return turnoDelDia(a.id, semilla) - turnoDelDia(b.id, semilla);
  });
}
