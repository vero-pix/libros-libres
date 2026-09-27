/**
 * Compra mínima por vendedor (27-09-2026).
 *
 * Nació con la caluga de los libros de LBV a $1.000 y $5.000: un libro de
 * $1.000 no paga ni el viaje para entregarlo, así que en esos libros se compra
 * desde $15.000, sumando varios del mismo vendedor.
 *
 * Vive en `site_config` (key `compra_minima`), no en el código:
 *   { "<seller_id>": 15000 }
 * Sin la key, o sin el vendedor en ella, no hay mínimo.
 *
 * La regla se aplica en tres lugares, los tres con esta función:
 * el carrito (avisa cuánto falta), el checkout de un libro (lo manda al
 * carrito) y POST /api/orders (rechaza el pedido; es la que manda).
 */
export type ComprasMinimas = Record<string, number>;

export function leerComprasMinimas(valor: unknown): ComprasMinimas {
  if (!valor || typeof valor !== "object") return {};
  const out: ComprasMinimas = {};
  for (const [id, monto] of Object.entries(valor as Record<string, unknown>)) {
    if (typeof monto === "number" && Number.isFinite(monto) && monto > 0) out[id] = Math.round(monto);
  }
  return out;
}

/** Nunca lanza: si falla la lectura, no hay mínimo (no se bloquea una compra por un error nuestro). */
export async function obtenerComprasMinimas(
  supabase: { from: (t: string) => any }
): Promise<ComprasMinimas> {
  try {
    const { data } = await supabase.from("site_config").select("value").eq("key", "compra_minima").maybeSingle();
    return leerComprasMinimas(data?.value);
  } catch {
    return {};
  }
}

/** Cuánto le falta a un subtotal para llegar al mínimo del vendedor (0 si no hay mínimo o ya llega). */
export function faltaParaMinimo(minimas: ComprasMinimas, sellerId: string, subtotal: number): number {
  const minimo = minimas[sellerId];
  return minimo ? Math.max(0, minimo - subtotal) : 0;
}
