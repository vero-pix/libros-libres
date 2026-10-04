import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * lib/listing-ubicacion.ts
 *
 * `listings.address`, `latitude` y `longitude` guardan la ubicación
 * APROXIMADA del libro: comuna y región, y coordenadas redondeadas a 2
 * decimales (~1 km). Es lo que ven la ficha, el mapa, la búsqueda y todo lo
 * público. La dirección que escribió el vendedor, con calle y número, vive en
 * `listing_locations`, que solo lee el servidor con service role
 * (migración 20261004c).
 *
 * Esto es para lo que de verdad necesita la calle: cotizar y crear envíos,
 * pedir retiros, crear el origen en Shipit.
 *
 * Funciona antes y después de la migración: si `listing_locations` no existe
 * todavía (o la fila no está), devuelve `null` y el llamador sigue con lo que
 * tenga `listings.address`, que antes de la migración ES la dirección exacta.
 */

/**
 * Dirección exacta de UNA publicación. `admin` tiene que ser un cliente con
 * service role: con la clave pública la tabla no se puede leer.
 */
export async function direccionExactaListing(
  admin: SupabaseClient,
  listingId: string | null | undefined
): Promise<string | null> {
  if (!listingId) return null;
  try {
    const { data, error } = await admin
      .from("listing_locations")
      .select("address")
      .eq("listing_id", listingId)
      .maybeSingle();
    if (error || !data) return null;
    return (data.address as string | null) ?? null;
  } catch {
    return null;
  }
}

/**
 * Direcciones exactas de varias publicaciones (id → dirección). Las que no
 * estén quedan fuera del mapa. Pide de a 200 ids: la URL de PostgREST tiene
 * límite y Supabase corta en 1000 filas.
 */
export async function direccionesExactasListings(
  admin: SupabaseClient,
  listingIds: string[]
): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  const ids = Array.from(new Set(listingIds.filter(Boolean)));
  for (let i = 0; i < ids.length; i += 200) {
    try {
      const { data, error } = await admin
        .from("listing_locations")
        .select("listing_id, address")
        .in("listing_id", ids.slice(i, i + 200));
      if (error) return out;
      for (const r of data ?? []) {
        if (r.address) out.set(r.listing_id as string, r.address as string);
      }
    } catch {
      return out;
    }
  }
  return out;
}
