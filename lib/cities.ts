import { normalizarRegion } from "@/lib/comunas";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createPublicClient } from "@/lib/supabase/public";
import { comunaDesdeAddress } from "@/lib/comuna";

export { comunaDesdeAddress };

let citiesCache: Array<{ id: string; name: string; region: string; lat: number; lng: number }> | null = null;
let cacheTime = 0;
const CACHE_DURATION = 3600000; // 1 hora

export async function getCities() {
  const now = Date.now();
  if (citiesCache && now - cacheTime < CACHE_DURATION) {
    return citiesCache;
  }

  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("cities")
    .select("id, name, region, lat, lng")
    .order("region", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching cities:", error);
    return [];
  }

  citiesCache = data || [];
  cacheTime = now;
  return citiesCache;
}

export async function getCitiesByRegion(region: string) {
  const cities = await getCities();
  return cities.filter((c) => c.region === region);
}
/**
 * Resolución de `listings.city_id` a partir de la dirección del listing.
 *
 * El filtro de comuna del buscador (/search + ListingToolbar) filtra por
 * `listings.city_id`, pero el formulario de publicación nunca lo escribía: cada
 * libro nuevo entraba en null y quedaba invisible para quien filtra por comuna.
 * Se backfilleaba a mano cada pocos días (13 y 16 ago 2026) hasta que volvía a
 * acumularse — 46 libros en dos días. Esto lo resuelve en el origen.
 *
 * Vive acá y no dentro del webhook para que el mismo criterio lo usen todos los
 * caminos de alta: publicación web, API v1 y carga masiva.
 */

// Google devuelve "Santiago" para lo que `cities` ya tiene como
// "Santiago Centro"; sin este alias quedarían dos comunas para lo mismo.
const ALIAS: Record<string, string> = { santiago: "santiago centro" };

export function normalizarComuna(s: string | null | undefined): string {
  return (s ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

function claveComuna(s: string | null | undefined): string {
  const n = normalizarComuna(s);
  return ALIAS[n] ?? n;
}


/** Nombre de región corto y oficial desde el componente "Región de X" de la dirección. */
function regionDesdeAddress(address: string | null | undefined): string | null {
  if (!address) return null;
  const parts = address.split(",").map((p) => p.trim());
  const raw = parts.find((p) => /Regi[oó]n/i.test(p));
  return normalizarRegion(raw);
}

/**
 * Devuelve el id de la comuna de esa dirección, creándola en `cities` si no
 * existe todavía (el catálogo partió con 17 comunas y sigue creciendo con cada
 * vendedor de una ciudad nueva).
 *
 * Requiere un cliente con permiso de escritura sobre `cities` — en la práctica,
 * service role. Nunca lanza: si algo falla devuelve null y el listing queda como
 * está, porque perder el city_id no puede costar la publicación.
 */
export async function resolverCityId(
  supabase: SupabaseClient,
  address: string | null | undefined,
  coords?: { lat?: number | null; lng?: number | null }
): Promise<string | null> {
  try {
    const comuna = comunaDesdeAddress(address);
    if (!comuna) return null;

    const clave = claveComuna(comuna);
    const { data: cities } = await supabase.from("cities").select("id, name");
    const match = (cities ?? []).find((c) => claveComuna(c.name) === clave);
    if (match) return match.id;

    const { data: nueva, error } = await supabase
      .from("cities")
      .insert({
        name: comuna,
        region: regionDesdeAddress(address),
        lat: coords?.lat ?? null,
        lng: coords?.lng ?? null,
      })
      .select("id")
      .single();

    if (error) {
      // Carrera con otra publicación simultánea de la misma comuna: releer.
      const { data: reintento } = await supabase.from("cities").select("id, name");
      return (reintento ?? []).find((c) => claveComuna(c.name) === clave)?.id ?? null;
    }
    return nueva?.id ?? null;
  } catch {
    return null;
  }
}

/**
 * Fija `users.city` cuando el vendedor todavía no la tiene, deduciéndola de la
 * dirección de una publicación suya.
 *
 * El registro solo pide correo y nombre, y `city` se llenaba únicamente entrando
 * a /perfil a mover el mapa: el 27-08-2026 había 53 de 118 vendedores con libros
 * publicados y sin ciudad. Sin ella no salen en /tiendas, el perfil público
 * pierde la ubicación y el digest del "Se busca" les arma un perfil peor.
 *
 * Vive acá y no en el webhook porque la usan también los scripts de carga
 * masiva, que no pasan por él. Una sola copia: dos que se separan terminan
 * comportándose distinto.
 *
 * Nunca pisa una ciudad ya puesta y nunca lanza — perder la comuna no puede
 * costar la publicación. Devuelve la comuna si la escribió, si no null.
 */
export async function fijarComunaVendedorSiFalta(
  supabase: SupabaseClient,
  sellerId: string | null | undefined,
  address: string | null | undefined
): Promise<string | null> {
  try {
    if (!sellerId || !address) return null;

    const comuna = comunaDesdeAddress(address);
    if (!comuna) return null;

    const { data: usuario } = await supabase
      .from("users")
      .select("city")
      .eq("id", sellerId)
      .maybeSingle();
    if ((usuario?.city ?? "").trim()) return null;

    // El mapa de /publish parte centrado en un punto fijo, y quien nunca lo movió
    // quedó con la MISMA dirección exacta que otros vendedores (14 compartían una
    // sola). Esa dirección no dice dónde vive nadie: si otro vendedor ya publicó
    // desde ese punto, no se deduce nada.
    const { data: otros } = await supabase
      .from("listings")
      .select("seller_id")
      .eq("address", address)
      .neq("seller_id", sellerId)
      .limit(1);
    if (otros && otros.length > 0) return null;

    const { error } = await supabase.from("users").update({ city: comuna }).eq("id", sellerId);
    return error ? null : comuna;
  } catch {
    return null;
  }
}
