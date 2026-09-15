import { calculateCommission } from "./commissions";

/**
 * Cargo por servicio que paga el COMPRADOR. Una sola regla para el checkout
 * (lo que se muestra) y para /api/orders (lo que se cobra en MercadoPago).
 *
 * Existe porque hasta el 14-09-2026 el checkout no mostraba este cargo: el total
 * en pantalla era libro + envío, y MercadoPago cobraba además el 8%. Una compra
 * de $23.490 en pantalla se cobraba $24.930. Sin importar de dónde vengan, los
 * dos números tienen que salir de la misma función.
 *
 * Sin dependencias de servidor: se usa en componentes de cliente.
 */

/** Cargo fijo cuando el vendedor no tiene MercadoPago (antes `SERVICE_FEE` en lib/mercadopago.ts). */
export const CARGO_SERVICIO_SIN_MP = 1500;

export function cargoServicio({
  enPersona,
  porTransferencia,
  vendedorConMP,
  totalLibros,
}: {
  enPersona: boolean;
  porTransferencia: boolean;
  vendedorConMP: boolean;
  /** Subtotal de libros ya con descuento. */
  totalLibros: number;
}): number {
  if (enPersona || porTransferencia) return 0;
  return vendedorConMP ? calculateCommission(totalLibros).commission : CARGO_SERVICIO_SIN_MP;
}
