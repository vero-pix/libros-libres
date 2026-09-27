import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Para las landings que eligen sus libros con un filtro en JavaScript (palabras
 * en título, autor o etiquetas). Hasta el 27-09-2026 hacían
 * `.eq("status","active").limit(1000)` y filtraban eso: Supabase corta en 1.000
 * filas, así que miraban 1.000 de ~4.170 libros activos, sin orden. /antroposofia
 * mostraba 1 libro de los 6 que calzaban.
 *
 * Ahora son dos pasos: recorrer TODOS los activos en páginas livianas (solo
 * título, autor y etiquetas) y traer completos únicamente los que pasan el filtro.
 */
export type LibroParaFiltrar = { id: string; book: { title: string | null; author: string | null; tags: string[] | null } | null };

const PAGINA = 1000;

export async function activosParaFiltrar(supabase: SupabaseClient): Promise<LibroParaFiltrar[]> {
  const out: LibroParaFiltrar[] = [];
  for (let desde = 0; ; desde += PAGINA) {
    const { data, error } = await supabase
      .from("listings")
      .select("id, book:books(title, author, tags)")
      .eq("status", "active")
      .order("id")
      .range(desde, desde + PAGINA - 1);
    if (error || !data) break;
    out.push(...(data as unknown as LibroParaFiltrar[]));
    if (data.length < PAGINA) break;
  }
  return out;
}

const SEL_COMPLETO = `*, book:books(*), seller:users(id, full_name, avatar_url, username, mercadopago_user_id)`;

/** Las fichas completas (con libro y vendedor) de los ids elegidos. */
export async function completarListings(supabase: SupabaseClient, ids: string[]): Promise<any[]> {
  const out: any[] = [];
  for (let i = 0; i < ids.length; i += 200) {
    const { data } = await supabase.from("listings").select(SEL_COMPLETO).in("id", ids.slice(i, i + 200));
    out.push(...(data ?? []));
  }
  return out;
}
