import type { SupabaseClient } from "@supabase/supabase-js";

/** Los participantes se guardan ordenados: (a,b) y (b,a) son la misma conversación. */
export function orderParticipants(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

/**
 * Conversación entre dos usuarios sobre un libro: la existente o una nueva.
 * La usan la mensajería (app/api/messages) y las ofertas (app/api/offers), así
 * que una oferta cae en el mismo hilo donde ya se estaba conversando.
 */
export async function buscarOCrearConversacion(
  supabase: SupabaseClient,
  userId: string,
  otherId: string,
  listingId: string | null
): Promise<{ id: string } | { error: string }> {
  const [p1, p2] = orderParticipants(userId, otherId);

  let q = supabase.from("conversations").select("id").eq("participant_1", p1).eq("participant_2", p2);
  q = listingId ? q.eq("listing_id", listingId) : q.is("listing_id", null);
  const { data: existing } = await q.maybeSingle();
  if (existing) return { id: existing.id };

  const { data: nueva, error } = await supabase
    .from("conversations")
    .insert({ participant_1: p1, participant_2: p2, listing_id: listingId })
    .select("id")
    .single();
  if (error || !nueva) return { error: error?.message ?? "No se pudo crear la conversación" };
  return { id: nueva.id };
}
