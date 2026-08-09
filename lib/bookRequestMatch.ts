import { foldAccents } from "@/lib/accentSearch";

/**
 * Matcheo entre solicitudes del "Se busca" y publicaciones.
 *
 * Vivía dentro de app/api/webhooks/listing-created, que solo corre cuando se
 * publica un libro nuevo. Eso dejaba el matcheo funcionando en una sola
 * dirección: si el libro ya estaba publicado ANTES de la solicitud, no se
 * disparaba nunca. Al 9-08-2026 había 9 solicitudes abiertas pidiendo libros que
 * estaban a la venta — una de ellas ("1984") llevaba dos meses así.
 */

/** Minúsculas, sin tildes, sin puntuación y con los espacios colapsados. */
export function normalizar(s: string | null | undefined): string {
  if (!s) return "";
  // foldAccents ya dejó todo en minúscula y sin diacríticos (la ñ cae en n), así
  // que basta con letras a-z y dígitos. Sin \p{L} a propósito: el target de TS
  // del proyecto no admite la flag unicode del regex.
  return foldAccents(s)
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Palabras "de contenido": ignora artículos y preposiciones. */
const VACIAS = new Set(["el","la","los","las","un","una","unos","unas","de","del","y","o","a","en","the","of","and"]);
export const tokens = (s: string) => s.split(" ").filter((t) => t.length >= 4 && !VACIAS.has(t));

/**
 * ¿La publicación satisface la solicitud del "Se busca"?
 *
 * El match anterior era `includes` en cualquier sentido con umbral de 3 letras:
 * pedir "Ana" calzaba con "La ventana", y pedir "Chile" con cualquier libro que
 * tuviera "Chile" en el título. Eso cerraba solicitudes que nadie había cumplido.
 *
 * Devuelve además `fuerte`, que es lo único que autoriza a cerrar la solicitud.
 */
export function compararLibro(
  reqTitle: string,
  pubTitle: string,
  reqAuthor: string,
  pubAuthor: string
): { hay: boolean; fuerte: boolean } {
  if (!reqTitle || !pubTitle) return { hay: false, fuerte: false };

  const igual = reqTitle === pubTitle;

  // Contención, pero respetando palabras completas: un libro titulado "Q" cerró
  // 6 solicitudes en producción porque `includes` matcheaba la letra q suelta
  // dentro de "La músi-q-ue...". Con límites de palabra eso no vuelve a pasar,
  // y "del amor" deja de calzar con quien pidió "El amor".
  const corto = reqTitle.length <= pubTitle.length ? reqTitle : pubTitle;
  const largo = reqTitle.length <= pubTitle.length ? pubTitle : reqTitle;
  const contiene =
    corto.length >= 4 &&
    new RegExp(`\\b${corto.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).test(largo);

  // Autor: si ambos lo declaran, tienen que compartir al menos un apellido.
  const ra = tokens(reqAuthor);
  const pa = tokens(pubAuthor);
  const hayAutores = ra.length > 0 && pa.length > 0;
  const autorCalza = hayAutores && ra.some((t) => pa.includes(t));

  // Si ambos declaran autor y no coincide, no es el mismo libro por más que el
  // título se parezca (hay muchas "Antología poética").
  if (hayAutores && !autorCalza) return { hay: false, fuerte: false };

  const hay = igual || contiene;
  // Avisar es barato; cerrar la solicitud no. Solo cierra el título calcado (con
  // autor coincidente o sin autores declarados) o la contención con autor que calza.
  const fuerte = igual ? autorCalza || !hayAutores : contiene && autorCalza;
  return { hay, fuerte };
}

/** ¿Todas las palabras de contenido de `a` aparecen dentro de `b`? */
function cubre(a: string, b: string): boolean {
  return tokens(a).every((w) => b.includes(w));
}

/**
 * Palabras que no son artículos ni preposiciones, sin filtrar por largo.
 *
 * `tokens` ignora las de menos de cuatro letras, y eso basta para buscar, pero
 * no para afirmar que dos títulos son el mismo libro: "El amor" y "La Ley del
 * Amor" quedan idénticos si se descarta "ley".
 */
const significativas = (s: string): string[] => {
  const out: string[] = [];
  for (const w of s.split(" ")) {
    if (w && !VACIAS.has(w) && !out.includes(w)) out.push(w);
  }
  return out;
};

const mismasPalabras = (a: string, b: string): boolean => {
  const A = significativas(a);
  const B = significativas(b);
  return A.length === B.length && A.every((w) => B.includes(w));
};

/**
 * Comparación para MOSTRARLE al que pide "esto ya está a la venta".
 *
 * `compararLibro` sirve para avisarle a un vendedor, donde equivocarse sale
 * barato. Acá no: a quien pidió "biblia" no se le puede ofrecer *La Biblia de la
 * Computación e Internet*, ni a quien pidió "El amor" *El amor en los tiempos
 * del cólera*. La regla es de cobertura mutua de palabras de contenido, con
 * substring para que "juego" alcance a "juegos":
 *
 * - se cubren en ambos sentidos → es el mismo libro (`exacto`)
 * - lo pedido cabe dentro de lo publicado, y pedía al menos dos palabras
 *   propias → probablemente sea (`probable`); es el caso de "Lo que el viento se
 *   llevó" contra "Lo que el viento se llevó (tapa dura 1937)"
 *
 * Pedir una sola palabra genérica no alcanza para sugerir nada: sin el segundo
 * término, "cuentos" calza con cualquier cosa.
 */
export function compararParaMostrar(
  reqTitle: string,
  pubTitle: string,
  reqAuthor: string,
  pubAuthor: string
): { nivel: "exacto" | "probable" | null } {
  if (!reqTitle || !pubTitle) return { nivel: null };

  // Si los dos declaran autor y no comparten apellido, no es el mismo libro por
  // más que el título calce (hay muchas "Antología poética").
  const ra = tokens(reqAuthor);
  const pa = tokens(pubAuthor);
  if (ra.length && pa.length && !ra.some((t) => pa.includes(t))) return { nivel: null };

  const propias = tokens(reqTitle);
  // Títulos hechos solo de artículos y preposiciones no dan para comparar
  // palabras: ahí se exige el título calcado.
  if (!propias.length) return { nivel: reqTitle === pubTitle ? "exacto" : null };

  const pedidoCabe = cubre(reqTitle, `${pubTitle} ${pubAuthor}`);
  if (!pedidoCabe) return { nivel: null };
  if (mismasPalabras(reqTitle, pubTitle)) return { nivel: "exacto" };
  return { nivel: propias.length >= 2 ? "probable" : null };
}

export interface CatalogoMatch {
  id: string;
  title: string;
  author: string | null;
  price: number | null;
  url: string;
  sellerName: string | null;
  nivel: "exacto" | "probable";
}

interface ListingRow {
  id: string;
  slug: string | null;
  price: number | null;
  books: { title: string | null; author: string | null } | null;
  users: { username: string | null; full_name: string | null } | null;
}

/**
 * Busca en el catálogo activo los libros que satisfacen una solicitud.
 *
 * Trae todo el catálogo activo y compara en memoria: son ~1.800 filas y las
 * solicitudes entran de a poco (69 en 30 días). Filtrar en SQL obligaría a
 * lidiar con las tildes en `books.title`, que es justo lo que `normalizar`
 * resuelve acá. Ojo con `.range()`: sin paginar, Supabase corta en 1000 filas y
 * los libros del final del catálogo serían invisibles.
 */
export async function buscarEnCatalogo(
  supabase: {
    from: (t: string) => any;
  },
  req: { title: string; author?: string | null },
  limite = 4
): Promise<CatalogoMatch[]> {
  const reqTitle = normalizar(req.title);
  if (!reqTitle) return [];
  const reqAuthor = normalizar(req.author);

  const filas: ListingRow[] = [];
  for (let desde = 0; ; desde += 1000) {
    const { data, error } = await supabase
      .from("listings")
      .select("id, slug, price, books!inner(title, author), users!inner(username, full_name)")
      .eq("status", "active")
      .range(desde, desde + 999);
    if (error) throw new Error(error.message);
    if (!data?.length) break;
    filas.push(...(data as ListingRow[]));
    if (data.length < 1000) break;
  }

  const matches: CatalogoMatch[] = [];
  for (const l of filas) {
    const pubTitle = normalizar(l.books?.title);
    const pubAuthor = normalizar(l.books?.author);
    const { nivel } = compararParaMostrar(reqTitle, pubTitle, reqAuthor, pubAuthor);
    if (!nivel) continue;

    matches.push({
      id: l.id,
      title: l.books?.title ?? "",
      author: l.books?.author ?? null,
      price: l.price,
      url:
        l.users?.username && l.slug
          ? `/libro/${l.users.username}/${l.slug}`
          : `/listings/${l.id}`,
      sellerName: l.users?.full_name ?? l.users?.username ?? null,
      nivel,
    });
  }

  // Primero los exactos, y dentro de cada grupo el más barato: quien pide un
  // libro compara precio antes que nada.
  matches.sort((a, b) => {
    if (a.nivel !== b.nivel) return a.nivel === "exacto" ? -1 : 1;
    return (a.price ?? Infinity) - (b.price ?? Infinity);
  });
  return matches.slice(0, limite);
}
