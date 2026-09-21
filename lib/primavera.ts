import type { SupabaseClient } from "@supabase/supabase-js";
import { ordenarParaGrilla } from "@/lib/sortListings";
import type { ListingWithBook } from "@/types";

/**
 * La selección de primavera: la misma lista para el abanico del hero, la franja
 * de la portada y la landing `/primavera`. Vive acá y no en cada página para
 * que los tres muestren lo mismo y no se contradigan.
 *
 * El criterio es "lo que se estrena en primavera", no un tema: fantasía y
 * romantasy —que es el hueco medido del catálogo, 83 búsquedas de "fantasía"
 * contra cero resultados hasta el 21-09—, poesía y juvenil. Son los tags reales
 * de `books.tags`, no inventados.
 */
// "Juvenil" quedó FUERA: arrastraba cómics de superhéroes a una selección que
// dice "fantasía y poesía", y desentonaba en la primera fila. Los juveniles que
// sí pegan (Percy Jackson, Skandar, Laura Gallego) llevan además "Fantasia".
export const TAGS_PRIMAVERA = ["Fantasia", "Poesia"];

const SEL = `*, book:books!inner(*), seller:users(id, full_name, avatar_url, username, mercadopago_user_id)`;

export async function getListingsPrimavera(
  supabase: SupabaseClient,
  limite = 24
): Promise<ListingWithBook[]> {
  const { data } = await supabase
    .from("listings")
    .select(SEL)
    .eq("status", "active")
    .neq("deprioritized", true)
    .overlaps("book.tags", TAGS_PRIMAVERA)
    .limit(400);

  // Solo las que tienen foto: el abanico del hero y la franja son puro visual,
  // y una cubierta dibujada al lado de cinco fotos reales canta.
  const conFoto = ((data ?? []) as any[]).filter(
    (l) => l.book && (l.cover_image_url || l.book.cover_url)
  ) as unknown as ListingWithBook[];

  return ordenarParaGrilla(conFoto).slice(0, limite);
}
