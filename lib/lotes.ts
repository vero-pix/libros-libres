import type { SupabaseClient } from "@supabase/supabase-js";
import type { ListingWithBook } from "@/types";

/**
 * Lotes, packs, sagas y colecciones completas: lo que se vende junto, por un
 * solo precio. Lo usan /lotes-de-libros y la franja de la portada
 * («Series completas, en una sola compra», que reemplazó a la de primavera el
 * 27-09-2026), para que las dos muestren lo mismo.
 */

/** Lo que cuenta como lote. */
// "saga" sola no: *30 Sunsets (Saga Bali)* o *Outlander 9* son un tomo suelto de una saga.
export const ES_LOTE = /\blotes?\b|\bpacks?\b|colecci[oó]n completa|saga completa|trilog[ií]a|tomos? (1|i) (y|al|a) /i;
/** Primer filtro, en la base: amplio a propósito; ES_LOTE afina después. */
const PATRONES = ["%lote%", "%pack%", "%saga%", "%trilog%", "%colecci%n completa%", "%tomo%"];

export async function getLotes(supabase: SupabaseClient): Promise<ListingWithBook[]> {
  const { data } = await supabase
    .from("listings")
    .select(`*, book:books!inner(*), seller:users(id, full_name, avatar_url, username, mercadopago_user_id)`)
    .eq("status", "active")
    .or(PATRONES.map((p) => `title.ilike.${p}`).join(","), { foreignTable: "book" })
    .limit(500);
  return ((data ?? []) as any[]).filter((item) => item.book && ES_LOTE.test(item.book.title ?? "")) as unknown as ListingWithBook[];
}
