import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Ofertas de precio ("Hacer oferta") — idea de Carlos (cimlibros), 23-09-2026.
 *
 * El vendedor marca `listings.acepta_ofertas`; el comprador ofrece un precio
 * menor; el vendedor acepta o rechaza desde /mensajes o /mis-ventas. Si acepta,
 * el comprador tiene PLAZO_PAGO_ACEPTADA_HORAS para pagar ese precio: lo lee
 * /api/orders con `preciosAcordados()`, nunca del navegador.
 */

/** Sin respuesta en este plazo, la oferta caduca sola (se evalúa al leer). */
export const PLAZO_RESPUESTA_DIAS = 3;
/** Aceptada: el comprador tiene este plazo para pagar el precio acordado. */
export const PLAZO_PAGO_ACEPTADA_HORAS = 48;
/** Una oferta bajo este % del precio suena a burla: se pide subirla. */
export const OFERTA_MINIMA_PCT = 50;
/** Mismo piso que `listings.price` (20260725_precio_minimo_listings.sql). */
export const OFERTA_MINIMA_CLP = 1000;
/** Tope por comprador para que nadie le llene la bandeja a un vendedor. */
export const MAX_OFERTAS_DIA = 10;
/** Contraofertas por cadena: después de esta, solo queda aceptar o rechazar. */
export const MAX_CONTRAOFERTAS = 3;

/**
 * Hasta el 30-09-2026 (hora de Chile) cualquier vendedor puede recibir ofertas.
 * Desde el 1 de octubre, solo los que cobran dentro del sitio: MercadoPago o
 * transferencia (`acepta_transferencia` + `datos_transferencia`). La oferta
 * aceptada se paga en el sitio; sin ninguno de los dos, el acuerdo se cierra por
 * fuera (decisión de Vero del 23-09, "por un tema de operatividad"; la
 * transferencia se sumó el mismo día).
 *
 * `cobraEnSitio` se resuelve en el servidor con `cobraDentroDelSitio()` de
 * lib/cobro-transferencia.ts: las columnas de transferencia no las lee `anon`.
 */
export const OFERTAS_PARA_TODOS_HASTA = new Date("2026-10-01T00:00:00-03:00");

export function vendedorPuedeRecibirOfertas(cobraEnSitio: boolean, ahora = new Date()): boolean {
  return cobraEnSitio || ahora < OFERTAS_PARA_TODOS_HASTA;
}

/** Valida un monto ofrecido contra el precio publicado. `null` = válido. */
export function errorMontoOferta(monto: number, precio: number): string | null {
  if (!Number.isInteger(monto) || monto <= 0) return "Escribe un monto en pesos, sin puntos ni decimales.";
  if (monto >= precio) return "La oferta tiene que ser menor que el precio publicado.";
  if (monto < OFERTA_MINIMA_CLP) return `El mínimo es $${OFERTA_MINIMA_CLP.toLocaleString("es-CL")}.`;
  const minimo = montoMinimo(precio);
  if (monto < minimo) return `Para este libro, ofrece desde $${minimo.toLocaleString("es-CL")}.`;
  return null;
}

export function montoMinimo(precio: number): number {
  return Math.max(OFERTA_MINIMA_CLP, Math.ceil((precio * OFERTA_MINIMA_PCT) / 100 / 100) * 100);
}

export function clp(n: number): string {
  return `$${Math.round(n).toLocaleString("es-CL")}`;
}

export type EstadoOferta = "pending" | "accepted" | "rejected" | "expired" | "used" | "countered";

export interface Oferta {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  amount: number;
  listing_price: number;
  status: EstadoOferta;
  conversation_id: string | null;
  created_at: string;
  responded_at: string | null;
  expires_at: string;
  /** Quién la hizo; responde siempre la otra parte. 'seller' = contraoferta del vendedor. */
  made_by?: "buyer" | "seller";
  parent_id?: string | null;
  /** Contraofertas en la cadena hasta esta (0 = la oferta original). */
  ronda?: number;
}

/**
 * Rango válido para contraofertar sobre `actual`: estrictamente entre su monto
 * y el de la oferta anterior de la otra parte (la madre), o el precio publicado
 * si es la primera. Así cada vuelta acerca a las partes y nunca se retrocede.
 */
export function rangoContraoferta(
  actual: Pick<Oferta, "amount" | "listing_price">,
  montoMadre: number | null
): { min: number; max: number } {
  const otro = montoMadre ?? actual.listing_price;
  return { min: Math.min(actual.amount, otro) + 1, max: Math.max(actual.amount, otro) - 1 };
}

export function errorMontoContraoferta(monto: number, rango: { min: number; max: number }): string | null {
  if (!Number.isInteger(monto) || monto <= 0) return "Escribe un monto en pesos, sin puntos ni decimales.";
  if (rango.min > rango.max) return "Ya no queda margen para contraofertar: acepta o rechaza.";
  if (monto < rango.min || monto > rango.max) {
    return `La contraoferta tiene que quedar entre ${clp(rango.min - 1)} y ${clp(rango.max + 1)}.`;
  }
  if (monto < OFERTA_MINIMA_CLP) return `El mínimo es ${clp(OFERTA_MINIMA_CLP)}.`;
  return null;
}

/**
 * Estado real: una pendiente o aceptada cuyo plazo pasó cuenta como vencida
 * aunque la fila todavía diga lo contrario (no hay cron que las barra).
 */
export function estadoVigente(o: Pick<Oferta, "status" | "expires_at">, ahora = new Date()): EstadoOferta {
  if ((o.status === "pending" || o.status === "accepted") && new Date(o.expires_at) <= ahora) return "expired";
  return o.status;
}

/**
 * Precios acordados vigentes de un comprador para estos libros: `{ listingId: monto }`.
 * Usar con el cliente de servicio: decide plata y no puede depender de RLS.
 */
export async function preciosAcordados(
  admin: SupabaseClient,
  buyerId: string,
  listingIds: string[]
): Promise<Record<string, { amount: number; offerId: string }>> {
  if (!buyerId || listingIds.length === 0) return {};
  const { data, error } = await admin
    .from("offers")
    .select("id, listing_id, amount, expires_at")
    .eq("buyer_id", buyerId)
    .eq("status", "accepted")
    .in("listing_id", listingIds)
    .gt("expires_at", new Date().toISOString())
    .order("amount", { ascending: true });
  if (error) {
    // Si la tabla no existe todavía (migración sin aplicar), el checkout sigue
    // con el precio publicado: una oferta nunca puede tumbar una compra.
    console.error("[offers] preciosAcordados:", error.message);
    return {};
  }
  const out: Record<string, { amount: number; offerId: string }> = {};
  for (const o of data ?? []) {
    if (!out[o.listing_id]) out[o.listing_id] = { amount: Number(o.amount), offerId: o.id };
  }
  return out;
}

/**
 * Al confirmarse el pago de un bundle, sus ofertas pasan a `used`: el precio
 * acordado ya se cobró y no puede servir para otra compra. Nunca lanza: una
 * oferta mal marcada no puede tumbar la confirmación de un pago.
 */
export async function marcarOfertasUsadas(admin: SupabaseClient, bundleId: string): Promise<void> {
  try {
    const { data } = await admin.from("orders").select("offer_id").eq("bundle_id", bundleId).not("offer_id", "is", null);
    const ids = (data ?? []).map((o: any) => o.offer_id).filter(Boolean);
    if (ids.length) await admin.from("offers").update({ status: "used" }).in("id", ids);
  } catch (err) {
    console.error("[offers] marcarOfertasUsadas:", err);
  }
}

/** Una negociación vigente para las listas de /mis-ventas y /mis-pedidos. */
export interface NegociacionVigente extends Oferta {
  titulo: string;
  /** Con quién se negocia: el comprador para el vendedor, y al revés. */
  contraparte: string | null;
  montoMadre: number | null;
  /** Solo para el comprador: el vendedor cobra en el sitio (lo resuelve la página). */
  puedePagarEnSitio?: boolean;
  /** `users.mercadopago_user_id` de la contraparte. */
  contraparteConMP?: boolean;
}

/**
 * Las ofertas vivas de un usuario (pendientes o aceptadas sin vencer), una por
 * cadena: las contraofertadas quedan fuera porque su reemplazo ya está en la
 * lista. Tolerante: si falla la consulta, la sección no aparece.
 */
export async function negociacionesVigentes(
  supabase: SupabaseClient,
  userId: string,
  rol: "seller" | "buyer"
): Promise<NegociacionVigente[]> {
  const otro = rol === "seller" ? "buyer" : "seller";
  const { data, error } = await supabase
    .from("offers")
    .select(
      `id, listing_id, buyer_id, seller_id, amount, listing_price, status, expires_at, conversation_id, created_at, responded_at, made_by, parent_id, ronda,
       listing:listings(book:books(title)), contraparte:users!offers_${otro}_id_fkey(full_name, mercadopago_user_id)`
    )
    .eq(rol === "seller" ? "seller_id" : "buyer_id", userId)
    .in("status", ["pending", "accepted"])
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });
  if (error) {
    console.error("[offers] negociacionesVigentes:", error.message);
    return [];
  }
  const filas = (data ?? []) as any[];
  const madres = filas.map((o) => o.parent_id).filter(Boolean);
  const montoMadre: Record<string, number> = {};
  if (madres.length) {
    const { data: ps } = await supabase.from("offers").select("id, amount").in("id", madres);
    for (const p of ps ?? []) montoMadre[p.id] = p.amount;
  }
  return filas.map((o) => ({
    ...o,
    titulo: o.listing?.book?.title ?? "Libro",
    contraparte: o.contraparte?.full_name ?? null,
    contraparteConMP: !!o.contraparte?.mercadopago_user_id,
    montoMadre: o.parent_id ? montoMadre[o.parent_id] ?? null : null,
  }));
}
