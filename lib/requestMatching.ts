import { foldAccents } from "@/lib/accentSearch";

/**
 * Relevancia entre una solicitud del "Se busca" y el catálogo de un vendedor.
 *
 * El digest diario mandaba las mismas solicitudes a los 87 vendedores activos y
 * solo las de las últimas 24h. Dos consecuencias: al vendedor de romance le
 * llegaban pedidos de análisis matemático (ruido → deja de abrir el correo), y
 * las solicitudes que nadie cubrió el día que entraron no se volvían a mostrar
 * nunca. Al 23 ago 2026 había 129 acumuladas sin resolver.
 *
 * Acá se calcula qué pedidos le sirven a CADA vendedor. Menos correos, no más:
 * quien no tenga ningún match no recibe nada.
 */

export interface PerfilVendedor {
  ciudad: string | null;
  autores: Set<string>;      // apellidos de los autores que ya vende
  subcategorias: Set<string>;
  palabras: Set<string>;     // vocabulario de sus títulos
}

export interface SolicitudMatch {
  motivo: "ciudad" | "autor" | "tema";
  etiqueta: string;
  peso: number;
}

const STOP = new Set([
  "para","con","los","las","del","por","que","una","uno","sus","como","mas","muy",
  "sobre","entre","desde","hasta","este","esta","esos","esas","the","and","of","in",
  "libro","libros","tomo","tomos","vol","volumen","edicion","completa","obras",
]);

const norm = (s: string | null | undefined) => foldAccents(s ?? "").toLowerCase().trim();

/** Palabras con contenido de un texto (≥4 letras, sin stopwords). */
export function palabrasClave(texto: string | null | undefined): string[] {
  return norm(texto)
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((p) => p.length >= 4 && !STOP.has(p));
}

/** Apellidos de una cadena de autores ("Carmen Hertz | Manuel Salazar"). */
export function apellidos(autor: string | null | undefined): string[] {
  return norm(autor)
    .split(/[;,|]/)
    .map((a) => a.trim().split(/\s+/).filter((p) => p.length >= 4).pop() ?? "")
    .filter(Boolean);
}

export function construirPerfil(
  ciudad: string | null,
  listings: Array<{ book: { title: string | null; author: string | null; subcategory: string | null } | null }>
): PerfilVendedor {
  const perfil: PerfilVendedor = {
    ciudad: ciudad ? norm(ciudad) : null,
    autores: new Set(),
    subcategorias: new Set(),
    palabras: new Set(),
  };
  for (const l of listings) {
    const b = l.book;
    if (!b) continue;
    for (const a of apellidos(b.author)) perfil.autores.add(a);
    if (b.subcategory) perfil.subcategorias.add(b.subcategory);
    for (const p of palabrasClave(b.title)) perfil.palabras.add(p);
  }
  return perfil;
}

/**
 * Devuelve por qué (y con cuánta fuerza) una solicitud le sirve a este vendedor.
 * null si no le sirve.
 *
 * La ciudad pesa más que el tema: un pedido de la misma comuna se entrega en
 * mano, sin despacho — que es justo donde se caen las ventas.
 */
/**
 * Ciudades tan grandes que compartirlas no significa cercanía: en Santiago hay
 * 21 pedidos abiertos y ~40 vendedores, así que sola la ciudad convertiría el
 * correo en ruido. Ahí se exige además afinidad de tema o autor.
 */
const CIUDADES_GRANDES = new Set(["santiago", "santiago centro", "providencia", "las condes", "maipu", "puente alto", "la florida", "nunoa"]);

export function evaluar(
  req: { title: string | null; author: string | null; requester_location: string | null },
  perfil: PerfilVendedor
): SolicitudMatch | null {
  const mismaCiudad = (() => {
    if (!perfil.ciudad || !req.requester_location) return false;
    const loc = norm(req.requester_location);
    return loc.includes(perfil.ciudad) || perfil.ciudad.includes(loc);
  })();

  const autorEnComun = apellidos(req.author).some((a) => perfil.autores.has(a));
  // Dos palabras en común es señal; una sola dispara con cualquier cosa.
  const comunes = palabrasClave(req.title).filter((p) => perfil.palabras.has(p));
  const mismoTema = comunes.length >= 2;

  if (mismaCiudad) {
    const grande = CIUDADES_GRANDES.has(perfil.ciudad!);
    // Ciudad chica: compartirla ya es una razón para entregarlo en mano.
    if (!grande) {
      return { motivo: "ciudad", etiqueta: "Te lo piden desde tu ciudad", peso: 100 };
    }
    // Ciudad grande: solo si además calza con lo que vende.
    if (autorEnComun || mismoTema) {
      return { motivo: "ciudad", etiqueta: "Lo piden en tu ciudad y va con lo tuyo", peso: 90 };
    }
  }

  if (autorEnComun) {
    return { motivo: "autor", etiqueta: "Vendes a este autor", peso: 50 };
  }
  if (mismoTema) {
    return { motivo: "tema", etiqueta: "Va con lo que vendes", peso: 20 + comunes.length };
  }

  return null;
}
