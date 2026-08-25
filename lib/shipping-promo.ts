/**
 * Envío gratis sobre un umbral — promoción con fecha de término.
 *
 * Por qué: la orden promedio es de un libro y la mediana del catálogo de Vero es
 * $8.990, así que un flete de ~$5.400 pesa 60% del ticket. Es la razón más
 * probable de que el carrito no convierta (25 carritos históricos, 5 llegaron a
 * $20.000). La apuesta es subir la unidad de compra a 2-3 libros y que el flete
 * deje de ser el que decide.
 *
 * ESTE ES EL ÚNICO ARCHIVO QUE HAY QUE TOCAR para cambiar, extender o apagar la
 * promo. Nada de umbrales ni fechas sueltas en los componentes.
 *
 * ⚠️ La regla se aplica en el SERVIDOR (`app/api/orders/route.ts`). El front la
 * usa solo para mostrar la barra y el desglose. `shipping_cost_override` viene
 * del cliente, así que si la promo viviera solo en el navegador cualquiera
 * podría pedir envío gratis con un curl.
 */

/** Seller al que aplica hoy. Vero asume el flete de su propio catálogo. */
export const PROMO_SELLER_ID = "2201d163-4423-4971-91f0-f6cebd00d1bd";

/** Subtotal de libros (ya con descuentos) desde el cual el envío es gratis. */
export const PROMO_UMBRAL = 20000;

/**
 * Techo de lo que Vero subsidia por envío. Sobre esto, el comprador paga la
 * diferencia. Sin techo, un despacho a Punta Arenas ($9.508 en el histórico) se
 * come el margen de tres libros.
 */
export const PROMO_TOPE_SUBSIDIO = 8000;

/** Último día con promo, inclusive (hora de Chile). Después vuelve el flete normal. */
export const PROMO_TERMINA = "2026-09-15";

export interface ResultadoPromo {
  /** ¿El bundle califica para envío gratis? */
  aplica: boolean;
  /** Lo que se le cobra al comprador por despacho. */
  cobrarAlComprador: number;
  /** Lo que Vero pone de su bolsillo. Se guarda en `orders.shipping_subsidy`. */
  subsidio: number;
  /** Cuánto falta para alcanzar el umbral (0 si ya calificó). Para la barra. */
  faltante: number;
}

/** ¿La promo sigue vigente en esta fecha? */
export function promoVigente(ahora: Date = new Date()): boolean {
  // Comparación por fecha de Chile (UTC-4), no por hora local del servidor.
  const chile = new Date(ahora.getTime() - 4 * 60 * 60 * 1000);
  return chile.toISOString().slice(0, 10) <= PROMO_TERMINA;
}

/** ¿Este vendedor participa de la promo? */
export function sellerParticipa(sellerId: string | null | undefined): boolean {
  return sellerId === PROMO_SELLER_ID;
}

/**
 * Decide qué se cobra por despacho.
 *
 * @param sellerId       vendedor del bundle (el checkout agrupa por vendedor)
 * @param totalBookPrice subtotal de libros, ya con descuentos aplicados
 * @param fleteCotizado  lo que cobra el courier de verdad (Shipit)
 * @param esCourier      false para entrega en persona o punto de retiro
 */
export function calcularEnvioPromo({
  sellerId,
  totalBookPrice,
  fleteCotizado,
  esCourier,
  ahora = new Date(),
}: {
  sellerId: string | null | undefined;
  totalBookPrice: number;
  fleteCotizado: number;
  esCourier: boolean;
  ahora?: Date;
}): ResultadoPromo {
  const elegible = esCourier && sellerParticipa(sellerId) && promoVigente(ahora);

  if (!elegible) {
    return { aplica: false, cobrarAlComprador: fleteCotizado, subsidio: 0, faltante: 0 };
  }

  if (totalBookPrice < PROMO_UMBRAL) {
    return {
      aplica: false,
      cobrarAlComprador: fleteCotizado,
      subsidio: 0,
      faltante: PROMO_UMBRAL - totalBookPrice,
    };
  }

  const subsidio = Math.min(fleteCotizado, PROMO_TOPE_SUBSIDIO);
  return {
    aplica: true,
    cobrarAlComprador: Math.max(0, fleteCotizado - subsidio),
    subsidio,
    faltante: 0,
  };
}
