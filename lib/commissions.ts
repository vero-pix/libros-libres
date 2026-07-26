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
