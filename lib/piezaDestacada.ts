/**
 * "La pieza": un solo libro destacado en el sidebar, con una frase que explica
 * por qué está ahí.
 *
 * Nace de la Britannica de 1975 con el sello de la Dirección de Fronteras
 * (10-09-2026): hay libros cuyo valor no se ve en la portada ni en el precio, y
 * que en una grilla de 3.900 fichas pasan igual que cualquier otro. La caluga
 * existe para contar eso en una línea.
 *
 * Sale de `site_config.pieza_destacada`, así que se cambia sin deploy — el
 * mismo patrón que `destacado_home`. Sin fila configurada no se muestra nada.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { hoyEnChile } from "@/lib/fiestasPatrias";

export interface PiezaDestacada {
  titulo: string;
  autor: string | null;
  precio: number | null;
  coverUrl: string | null;
  url: string;
  /** Una línea, escrita a mano: por qué este libro y no otro. */
  gancho: string;
  /** Rótulo de la caluga. Por defecto "La pieza". */
  rotulo: string;
}

interface ConfigPieza {
  slug?: string;
  username?: string;
  gancho?: string;
  rotulo?: string;
  /** ISO `YYYY-MM-DD`. Pasada esa fecha la caluga desaparece sola. */
  until?: string;
}

export async function leerPiezaDestacada(sb: SupabaseClient): Promise<PiezaDestacada | null> {
  const { data, error } = await sb
    .from("site_config")
    .select("value")
    .eq("key", "pieza_destacada")
    .maybeSingle();

  if (error || !data?.value) return null;
  const cfg = data.value as ConfigPieza;
  if (!cfg.slug || !cfg.gancho) return null;

  // Día chileno, no UTC: con `toISOString()` una caluga con `until` del 18 se
  // apagaba a las 20:00 del 17 acá. Mismo arreglo que el destacado del home.
  if (cfg.until && cfg.until < hoyEnChile()) return null;

  const { data: listing } = await sb
    .from("listings")
    .select("price, slug, cover_image_url, status, book:books(title, author, cover_url), seller:users(username)")
    .eq("slug", cfg.slug)
    .maybeSingle();

  // Si se vendió, la caluga se va sola: nada peor que destacar lo que ya no está.
  if (!listing || listing.status !== "active") return null;

  const book: any = Array.isArray(listing.book) ? listing.book[0] : listing.book;
  const seller: any = Array.isArray(listing.seller) ? listing.seller[0] : listing.seller;
  const username = cfg.username ?? seller?.username;
  if (!book?.title || !username) return null;

  return {
    titulo: book.title,
    autor: book.author ?? null,
    precio: listing.price ?? null,
    coverUrl: listing.cover_image_url ?? book.cover_url ?? null,
    url: `/libro/${username}/${listing.slug}`,
    gancho: cfg.gancho,
    rotulo: cfg.rotulo ?? "La pieza",
  };
}
