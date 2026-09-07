import { unstable_cache } from "next/cache";
import { extractCommune } from "./chilexpress";
import { createServiceRoleClient } from "./supabase/service-role";

/**
 * Reglas compartidas entre COTIZAR (app/api/shipping/quote) y CREAR el envío
 * (webhook de MercadoPago, y el worker de Shipit cuando exista).
 *
 * Nacieron del PROMPT 0.1 de docs/prompts/shipit-automatico-v2.md
 * (07-09-2026): la cotización miraba solo `listings.address` y la creación
 * tenía su propia regla (`resolverOrigen` en el webhook) que prefería el
 * listing si tenía número y si no caía al `default_address` del vendedor.
 * Dos reglas ⇒ dos comunas posibles ⇒ un precio cotizado que no era el que
 * después cobraba Shipit. Acá vive UNA sola regla.
 */

export interface OrigenEnvio {
  /** Dirección completa desde la que sale el paquete. */
  address: string;
  /** Comuna extraída de esa dirección (lo que se le pasa a Shipit). */
  commune: string;
  /** De dónde salió: para logs y para depurar cotizaciones raras. */
  fuente: "listing" | "vendedor";
}

const tieneNumero = (a?: string | null) =>
  !!a && /^.+?\s+\d+/.test(a.split(",")[0]?.trim() ?? "");

/**
 * Regla de origen. La dirección del listing manda si trae calle con número
 * (el vendedor la escribió a propósito para ese libro). Si no, la dirección
 * por defecto del vendedor; y si tampoco hay, lo que tenga el listing.
 *
 * `shipitOriginCommune` es la comuna del origen registrado en Shipit
 * (`users.shipit_origin_id`, fase 1 de la guía). Cuando exista, gana sobre
 * todo lo demás: es desde donde Shipit va a cobrar de verdad.
 */
export function resolverOrigenEnvio({
  listingAddress,
  sellerDefaultAddress,
  shipitOriginCommune,
}: {
  listingAddress?: string | null;
  sellerDefaultAddress?: string | null;
  shipitOriginCommune?: string | null;
}): OrigenEnvio | null {
  if (shipitOriginCommune) {
    const address = tieneNumero(listingAddress)
      ? (listingAddress as string)
      : sellerDefaultAddress || listingAddress || shipitOriginCommune;
    return { address, commune: shipitOriginCommune, fuente: "vendedor" };
  }
  if (tieneNumero(listingAddress)) {
    return {
      address: listingAddress as string,
      commune: extractCommune(listingAddress as string),
      fuente: "listing",
    };
  }
  const address = sellerDefaultAddress || listingAddress || null;
  if (!address) return null;
  return {
    address,
    commune: extractCommune(address),
    fuente: sellerDefaultAddress ? "vendedor" : "listing",
  };
}

/** Colchón por defecto sobre la cotización de Shipit, en porcentaje. */
export const COLCHON_COTIZACION_DEFAULT_PCT = 10;

/** Clave en `site_stats` que permite cambiar el colchón sin deploy. */
export const COLCHON_COTIZACION_KEY = "shipping_quote_buffer_pct";

/**
 * Porcentaje que se le suma a la cotización antes de mostrarla al comprador.
 *
 * Por qué existe: lo que Shipit cobra al crear el envío puede ser más que lo
 * cotizado (caso Temuco: $5.433 cotizados, $5.986 reales), y esa diferencia
 * la paga Vero. Mientras la cotización y la creación no usen exactamente los
 * mismos datos, el colchón cubre el hoyo.
 *
 * Orden de lectura: fila `site_stats` (se cambia con un UPDATE, sin deploy;
 * en Vercel cambiar una env exige redeploy) → env `SHIPPING_QUOTE_BUFFER_PCT`
 * → 10. Cacheado 5 minutos. Se acota a [0, 50] por si alguien escribe mal.
 */
export const obtenerColchonCotizacionPct = unstable_cache(
  async (): Promise<number> => {
    let valor: number | null = null;
    try {
      const { data } = await createServiceRoleClient()
        .from("site_stats")
        .select("value")
        .eq("key", COLCHON_COTIZACION_KEY)
        .maybeSingle();
      if (data && typeof data.value === "number") valor = data.value;
    } catch {
      // Sin BD se cae a la env: la cotización no puede depender de esto.
    }
    if (valor === null) {
      const env = Number(process.env.SHIPPING_QUOTE_BUFFER_PCT);
      valor = Number.isFinite(env) ? env : COLCHON_COTIZACION_DEFAULT_PCT;
    }
    return Math.min(50, Math.max(0, Math.round(valor)));
  },
  ["shipping-quote-buffer-pct"],
  { revalidate: 300 }
);

/**
 * Aplica el colchón y redondea hacia arriba a $10. Con 0% devuelve el precio
 * de Shipit tal cual: "bajar a 0" tiene que significar exactamente eso.
 */
export function aplicarColchon(precio: number, pct: number): number {
  if (pct <= 0) return Math.round(precio);
  return Math.ceil((precio * (1 + pct / 100)) / 10) * 10;
}
