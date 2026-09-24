/**
 * Reserva de ejemplares al comprar — cierra la venta doble (24-09-2026).
 *
 * Hasta esta fecha, crear la orden no reservaba nada: dos compradores podían
 * pagar el mismo ejemplar por MercadoPago, y el pago por transferencia nunca
 * marcaba el libro como vendido. La lógica vive en Postgres (migración
 * 20260924_reservas_venta_doble.sql) para que la reserva sea atómica; acá solo
 * están los envoltorios y los mensajes.
 *
 * Las funciones solo las puede ejecutar service_role: siempre pasar un cliente
 * de servicio.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { sendGong, escapeHtml } from "@/lib/notifications";

/** MercadoPago: lo que dura el checkout. La preferencia vence a la misma hora. */
export const RESERVA_MP_MINUTOS = 60;
/** Transferencia: lo que tiene el vendedor para confirmar antes de que el libro vuelva a la venta. */
export const RESERVA_TRANSFER_MINUTOS = 24 * 60;

export type ResultadoReserva =
  | { ok: true }
  | { ok: false; status: number; error: string };

export async function reservarEjemplares(
  admin: SupabaseClient,
  args: { listingIds: string[]; bundleId: string; buyerId: string; metodo: "mercadopago" | "transfer" }
): Promise<ResultadoReserva> {
  const { error } = await admin.rpc("reservar_listings", {
    p_ids: args.listingIds,
    p_bundle: args.bundleId,
    p_buyer: args.buyerId,
    p_metodo: args.metodo,
    p_minutos: args.metodo === "transfer" ? RESERVA_TRANSFER_MINUTOS : RESERVA_MP_MINUTOS,
  });
  if (!error) return { ok: true };

  if (error.message?.includes("no_disponible")) {
    return {
      ok: false,
      status: 409,
      error:
        "Alguien está comprando este libro en este momento. Si no completa la compra, vuelve a quedar disponible.",
    };
  }
  if (error.message?.includes("max_transferencias")) {
    return {
      ok: false,
      status: 409,
      error:
        "Tienes tres compras por transferencia esperando confirmación. Cuando el vendedor confirme alguna, puedes hacer otra — o paga esta con MercadoPago.",
    };
  }
  console.error("[reservas] reservar_listings:", error.message);
  return { ok: false, status: 500, error: "No pudimos reservar el libro. Intenta de nuevo en un momento." };
}

export async function liberarReserva(admin: SupabaseClient, bundleId: string): Promise<void> {
  const { error } = await admin.rpc("liberar_reserva", { p_bundle: bundleId });
  if (error) console.error(`[reservas] liberar_reserva ${bundleId}:`, error.message);
}

/**
 * Marca vendidos los ejemplares de un pago confirmado. Si alguno ya era de otro
 * comprador, la función lo registra en `incidentes_cobro_doble` (única por
 * `clave`) y el aviso a Vero sale solo la primera vez, aunque MercadoPago
 * reintente el webhook.
 *
 * Nunca lanza: el pago ya entró y lo que sigue (correos, comisión, envío) no
 * puede quedar colgado por esto.
 */
export async function marcarVendidos(
  admin: SupabaseClient,
  args: { bundleId: string; listingIds: string[]; clave: string; origen: "mercadopago" | "transfer" }
): Promise<void> {
  const { data, error } = await admin.rpc("marcar_vendidos", {
    p_bundle: args.bundleId,
    p_ids: args.listingIds,
    p_clave: args.clave,
    p_origen: args.origen,
  });
  if (error) {
    console.error(`[reservas] marcar_vendidos ${args.bundleId}:`, error.message);
    sendGong(
      `⚠️ <b>No pude marcar vendido</b> el pedido ${escapeHtml(args.bundleId)} (${args.origen}).\n` +
        `Revisa a mano que el libro no siga a la venta.\nError: ${escapeHtml(error.message)}`
    ).catch(() => {});
    return;
  }

  const fila = Array.isArray(data) ? data[0] : data;
  if (fila?.incidente_nuevo) {
    const conflictos: string[] = fila.conflictos ?? [];
    sendGong(
      `🚨 <b>COBRO DOBLE — hay que devolver</b>\n\n` +
        `Se cobró ${conflictos.length === 1 ? "un libro que" : `${conflictos.length} libros que`} ya era${conflictos.length === 1 ? "" : "n"} de otro comprador.\n` +
        `Pedido: ${escapeHtml(args.bundleId)}\n` +
        `Pago: ${escapeHtml(args.clave)} (${args.origen})\n` +
        `Libros: ${conflictos.map((id) => `https://tuslibros.cl/listings/${id}`).join(" ")}\n\n` +
        `Queda en la tabla incidentes_cobro_doble.`
    ).catch(() => {});
  }
}
