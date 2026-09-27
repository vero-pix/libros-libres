import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Las repisas de LBV (27-09-2026): lotes que juntan libros que también existen
 * como fichas sueltas, PAUSADAS mientras la repisa está a la venta. La
 * composición vive en `site_config.repisas_lbv` como { lote_id: [ids sueltos] }.
 *
 * Cuando una repisa se vende, sus libros sueltos tienen que quedar vendidos
 * también; si no, al reactivar la biblioteca volverían a la venta libros que ya
 * se fueron. Lo llaman los tres caminos que marcan un libro como vendido:
 * marcarVendidos() (MercadoPago y «Me llegó la transferencia»), «Marcar como
 * vendido» en la ficha y el cambio de estado en Mis Libros.
 *
 * Solo toca libros `active` o `paused`. Devuelve los ids que cerró. Nunca lanza.
 */
export async function cerrarRepisas(supabase: SupabaseClient, vendidos: string[]): Promise<string[]> {
  try {
    const { data } = await supabase.from("site_config").select("value").eq("key", "repisas_lbv").maybeSingle();
    const repisas = (data?.value ?? {}) as Record<string, unknown>;
    const sueltos = vendidos.flatMap((id) => (Array.isArray(repisas[id]) ? (repisas[id] as string[]) : []));
    if (sueltos.length === 0) return [];
    const { data: cerrados, error } = await supabase
      .from("listings")
      .update({ status: "completed" })
      .in("id", sueltos)
      .in("status", ["active", "paused"])
      .select("id");
    if (error) {
      console.error("[repisas] no pude cerrar los libros de la repisa:", error.message);
      return [];
    }
    return (cerrados ?? []).map((r: { id: string }) => r.id);
  } catch (e) {
    console.error("[repisas]", e);
    return [];
  }
}
