/**
 * Comisión de tuslibros.cl — tasa ÚNICA.
 *
 * 26 jul 2026 (decisión de Vero): 8% sobre el precio del libro, para todos.
 * Antes había tramos por plan (free 8% / librero 5% / librería 3%) que nunca se
 * usaron: los 202 usuarios tenían plan = free, así que el 5% y el 3% no aplicaban
 * a nadie — ni a CIM ni a Buhardilla — y el copy del sitio prometía algo falso.
 * Se eliminaron del producto, no solo del copy.
 *
 * La comisión se cobra SOLO cuando la venta pasa por las herramientas integradas
 * (pago con MercadoPago o despacho por courier). Si comprador y vendedor coordinan
 * por WhatsApp y entregan en persona, no se cobra nada.
 *
 * Si algún día vuelven los tramos, este es el único archivo que hay que tocar.
 */

export const COMMISSION_RATE = 0.08;

export function getCommissionRate(): number {
  return COMMISSION_RATE;
}

export function calculateCommission(amount: number): { rate: number; commission: number } {
  return {
    rate: COMMISSION_RATE,
    commission: Math.round(amount * COMMISSION_RATE),
  };
}

/**
 * Registra la comisión de una venta. Se llama SOLO desde el webhook de
 * MercadoPago, cuando el pago quedó aprobado.
 *
 * Antes (hasta el 25 ago 2026) el insert vivía en `app/api/orders/route.ts` y
 * corría al generar la preferencia de pago, o sea antes de que nadie pagara.
 * Resultado: agosto figuraba con $4.800 de comisión cuando lo real eran $800 —
 * entraban órdenes pendientes que nunca se pagaron y reintentos cancelados. Y
 * los vendedores veían en /mis-ventas comisiones que jamás se les cobraron.
 *
 * La comisión existe solo cuando la venta pasa por el split de MercadoPago, es
 * decir cuando el vendedor tiene su cuenta conectada. Sin split, el cobro va por
 * la cuenta de tuslibros con SERVICE_FEE y acá no se registra nada.
 *
 * OJO: sí se cobra en entregas en persona pagadas por MercadoPago. El
 * `marketplace_fee` que se le manda a MP es `commission + shippingCost` sin
 * mirar la modalidad de entrega, así que la plata se cobra igual aunque la orden
 * tenga `service_fee: 0`. Lo que no se cobra es la venta coordinada por WhatsApp
 * que nunca pasa por MercadoPago — esa no llega hasta acá.
 *
 * Idempotente: MercadoPago reenvía el mismo webhook más de una vez.
 */
export async function registrarComisionVenta({
  admin,
  orderId,
  sellerId,
  grossAmount,
}: {
  /** Cliente de Supabase con service role: `commissions` no tiene policy de INSERT. */
  admin: {
    from: (t: string) => any;
  };
  orderId: string;
  sellerId: string;
  grossAmount: number;
}): Promise<void> {
  const { data: yaExiste } = await admin
    .from("commissions")
    .select("id")
    .eq("order_id", orderId)
    .maybeSingle();
  if (yaExiste) return;

  const { rate, commission } = calculateCommission(grossAmount);
  const { error } = await admin.from("commissions").insert({
    order_id: orderId,
    seller_id: sellerId,
    transaction_type: "sale",
    gross_amount: grossAmount,
    commission_rate: rate,
    commission_amount: commission,
    // Columna heredada de los tramos por plan: es NOT NULL en la BD, así que se
    // escribe fija en "free" hasta aplicar la migración que la vuelve nullable.
    seller_plan: "free",
  });

  // No revienta nada —el pago ya está hecho— pero deja de ser invisible: fue el
  // silencio, no el fallo, lo que dejó la tabla vacía cuatro meses en 2026.
  if (error) {
    console.error(`[commissions] No se registró la comisión de la orden ${orderId}:`, error.message);
  }
}
