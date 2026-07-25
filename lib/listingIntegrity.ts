/**
 * lib/listingIntegrity.ts
 *
 * Reglas de integridad de las publicaciones: precio y duplicados.
 *
 * El objetivo NO es moderar ni frenar a nadie: publicar tiene que seguir
 * tomando 5 minutos. Solo evitamos dos errores concretos que ya llegaron al
 * catálogo público:
 *   - "Historia de Mayta" a $100 (dedazo del vendedor) destacado en "Para regalar".
 *   - "Lo que el viento se llevó" publicado 3 veces por el mismo vendedor.
 *
 * Un único mínimo duro (bloquea), todo lo demás es advertencia que se puede
 * pasar de largo.
 */

/** Mínimo duro. Bajo esto no se publica. Configurable por env. */
export const MIN_LISTING_PRICE = Number(
  process.env.NEXT_PUBLIC_MIN_LISTING_PRICE ?? 1000
);

/**
 * Desviación máxima tolerada respecto del precio de referencia antes de
 * advertir. 60% = si la mediana del título es $10.000, avisamos bajo $4.000.
 */
export const PRICE_DEVIATION_PCT = Number(
  process.env.NEXT_PUBLIC_PRICE_DEVIATION_PCT ?? 60
);

/** Precio bajo el cual una publicación no entra a carruseles ni colecciones. */
export const CURATED_MIN_PRICE = MIN_LISTING_PRICE;

export type PriceCheck =
  | { level: "ok" }
  | { level: "block"; message: string }
  | { level: "warn"; message: string };

/** Mínimo duro. Es lo único que bloquea. */
export function checkPriceFloor(price: number | null | undefined): PriceCheck {
  if (price == null || Number.isNaN(price)) {
    return { level: "block", message: "Ingresa el precio de venta." };
  }
  if (price < MIN_LISTING_PRICE) {
    return {
      level: "block",
      message: `El precio mínimo es $${MIN_LISTING_PRICE.toLocaleString(
        "es-CL"
      )}. Si querías poner $${(price * 1000).toLocaleString(
        "es-CL"
      )}, revisa los ceros.`,
    };
  }
  return { level: "ok" };
}

/**
 * Advertencia (NO bloquea) si el precio se aleja demasiado de la referencia.
 * `reference` puede ser la mediana del mismo título en la plataforma o el
 * precio de Buscalibre/MercadoLibre que ya guardamos en la ficha.
 */
export function checkPriceDeviation(
  price: number,
  reference: number | null | undefined,
  referenceLabel = "otros ejemplares del mismo título"
): PriceCheck {
  if (!reference || reference <= 0) return { level: "ok" };
  const deviation = ((reference - price) / reference) * 100;
  if (deviation > PRICE_DEVIATION_PCT) {
    return {
      level: "warn",
      message: `Tu precio ($${price.toLocaleString(
        "es-CL"
      )}) está ${Math.round(deviation)}% bajo ${referenceLabel} ($${Math.round(
        reference
      ).toLocaleString("es-CL")}). ¿Es lo que querías? Publica de nuevo para confirmar.`,
    };
  }
  return { level: "ok" };
}

export function median(values: number[]): number | null {
  const nums = values.filter((n) => typeof n === "number" && n > 0).sort((a, b) => a - b);
  if (!nums.length) return null;
  const mid = Math.floor(nums.length / 2);
  return nums.length % 2 ? nums[mid] : (nums[mid - 1] + nums[mid]) / 2;
}

/** Normaliza para comparar títulos: sin tildes, sin puntuación, sin sufijos "(1)". */
export function normalizeTitle(s: string | null | undefined): string {
  return String(s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\(\s*\d+\s*\)\s*$/, "") // "Lo que el viento se llevó (2)"
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Similitud 0–1 por coeficiente de dados sobre bigramas. Suficiente para
 * cazar "Lo que el viento se llevo (2)" vs "Lo que el viento se llevó".
 */
export function titleSimilarity(a: string, b: string): number {
  const x = normalizeTitle(a);
  const y = normalizeTitle(b);
  if (!x || !y) return 0;
  if (x === y) return 1;
  const bigrams = (s: string) => {
    const out = new Map<string, number>();
    for (let i = 0; i < s.length - 1; i++) {
      const g = s.slice(i, i + 2);
      out.set(g, (out.get(g) ?? 0) + 1);
    }
    return out;
  };
  const bx = bigrams(x);
  const by = bigrams(y);
  let hits = 0;
  bx.forEach((n, g) => { hits += Math.min(n, by.get(g) ?? 0); });
  let total = 0;
  bx.forEach((n) => { total += n; });
  by.forEach((n) => { total += n; });
  return total ? (2 * hits) / total : 0;
}

/** Sobre este umbral consideramos que es el mismo título. */
export const DUPLICATE_SIMILARITY = 0.85;

const ROMAN = { i: 1, ii: 2, iii: 3, iv: 4, v: 5, vi: 6, vii: 7, viii: 8, ix: 9, x: 10 } as const;

/**
 * Extrae los marcadores de tomo/volumen de un título.
 *
 * Esto es lo que separa "Séneca Tomo I" de "Séneca Tomo II" (libros DISTINTOS)
 * de "Lo que el viento se llevó (1)" y "(2)" (el vendedor numerando SUS copias,
 * que sí son duplicados). Los paréntesis del final ya los quitó normalizeTitle.
 */
export function volumeMarkers(title: string): Set<number> {
  const t = normalizeTitle(title);
  const out = new Set<number>();
  // "tomo i", "vol 2", "volumen iii", "parte ii"
  const re = /\b(?:tomo|vol|volumen|parte|libro|numero|n)\s+([ivx]+|\d{1,2})\b/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(t)) !== null) {
    const raw = m[1];
    const n = /^\d+$/.test(raw) ? Number(raw) : ROMAN[raw as keyof typeof ROMAN];
    if (n) out.add(n);
  }
  // Número suelto al final: "Caballo de Troya 4", "Harry Potter 3"
  const tail = t.match(/\s(\d{1,2})$/);
  if (tail) out.add(Number(tail[1]));
  // Romano suelto al final: "Séneca I"
  const tailRoman = t.match(/\s([ivx]{1,4})$/);
  if (tailRoman && ROMAN[tailRoman[1] as keyof typeof ROMAN]) {
    out.add(ROMAN[tailRoman[1] as keyof typeof ROMAN]);
  }
  return out;
}

/** true si los títulos apuntan a tomos/volúmenes distintos de la misma obra. */
export function differentVolume(a: string, b: string): boolean {
  const va = volumeMarkers(a);
  const vb = volumeMarkers(b);
  if (!va.size && !vb.size) return false;
  if (va.size !== vb.size) return true;
  let distinto = false;
  va.forEach((n) => { if (!vb.has(n)) distinto = true; });
  return distinto;
}

/**
 * Bajo esta similitud entre el título que escribió el vendedor y el de la ficha
 * encontrada por ISBN, NO se reutiliza la ficha: se crea una nueva.
 */
export const FICHA_MATCH_MIN = 0.6;

/**
 * ¿La ficha que encontramos por ISBN es realmente el libro que se está
 * publicando?
 *
 * Existe porque el ISBN no es confiable como identidad: hay ediciones chilenas
 * y colecciones por entregas donde varios tomos traen el MISMO código de barras
 * impreso. Al escanearlos, todos caían en la primera ficha creada y el título
 * escrito por el vendedor se descartaba en silencio. Así 4 novelas distintas de
 * Isabel Allende terminaron publicadas como "El plan infinito".
 *
 * Ante la duda preferimos una ficha duplicada (se consolida después) antes que
 * un enlace incorrecto (rompe búsqueda y SEO sin que nadie lo note).
 */
export function fichaCoincide(
  tituloEscrito: string,
  tituloFicha: string | null | undefined,
  autorEscrito?: string | null,
  autorFicha?: string | null
): boolean {
  if (!tituloFicha) return false;

  // PRIMERO los tomos: "Séneca Tomo I" y "Tomo II" tienen similitud altísima
  // (0.98) y son libros distintos. Si esto va después del umbral, nunca corre.
  if (differentVolume(tituloEscrito, tituloFicha)) return false;

  if (titleSimilarity(tituloEscrito, tituloFicha) >= FICHA_MATCH_MIN) return true;

  // Título corto que es prefijo del de la ficha ("Conocer" → "Conocer — las
  // ciencias cognitivas…"), con el mismo autor. El autor se compara por
  // contención además de similitud: "Varela" y "Francisco J. Varela" son la
  // misma persona pero su similitud de bigramas es baja.
  const a = normalizeTitle(tituloEscrito);
  const b = normalizeTitle(tituloFicha);
  const prefijo = !!a && !!b && (a.startsWith(b.slice(0, 20)) || b.startsWith(a.slice(0, 20)));
  if (!prefijo) return false;

  const na = normalizeTitle(autorEscrito ?? "");
  const nb = normalizeTitle(autorFicha ?? "");
  if (!na || !nb) return false;
  const mismoAutor =
    titleSimilarity(na, nb) > 0.8 || na.includes(nb) || nb.includes(na);
  return mismoAutor;
}

export interface DuplicateCandidate {
  id: string;
  slug: string | null;
  price: number | null;
  title: string;
  author: string | null;
  isbn: string | null;
  /** "isbn" es certeza; "titulo" es parecido alto. */
  reason: "isbn" | "titulo";
}

/**
 * Busca publicaciones ACTIVAS del mismo vendedor que sean el mismo libro.
 * Nunca bloquea: vender dos copias del mismo título es legítimo.
 */
export function findDuplicates(
  existing: Array<{
    id: string;
    slug: string | null;
    price: number | null;
    book: { title: string | null; author: string | null; isbn: string | null } | null;
  }>,
  candidate: { title: string; author?: string | null; isbn?: string | null }
): DuplicateCandidate[] {
  const out: DuplicateCandidate[] = [];
  for (const l of existing) {
    if (!l.book?.title) continue;
    const sameIsbn =
      !!candidate.isbn && !!l.book.isbn && normalizeIsbn(candidate.isbn) === normalizeIsbn(l.book.isbn);
    const sim = titleSimilarity(candidate.title, l.book.title);
    const sameAuthor =
      !candidate.author || !l.book.author
        ? true
        : titleSimilarity(candidate.author, l.book.author) > 0.7;
    // Tomo I y Tomo II son libros distintos aunque el título sea casi igual.
    const otroTomo = differentVolume(candidate.title, l.book.title);

    if (!otroTomo && (sameIsbn || (sim >= DUPLICATE_SIMILARITY && sameAuthor))) {
      out.push({
        id: l.id,
        slug: l.slug,
        price: l.price,
        title: l.book.title,
        author: l.book.author,
        isbn: l.book.isbn,
        reason: sameIsbn ? "isbn" : "titulo",
      });
    }
  }
  return out;
}

export function normalizeIsbn(isbn: string | null | undefined): string {
  return String(isbn ?? "").replace(/[^0-9xX]/g, "").toUpperCase();
}
