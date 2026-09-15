/**
 * Despacho coordinado por el vendedor — la salida de Shipit que no depende de
 * ninguna cuenta de courier (14-09-2026).
 *
 * El comprador paga una tarifa fija por zona. Esa plata le llega al vendedor
 * junto con el precio del libro (no entra al `marketplace_fee`), y el vendedor
 * lleva el paquete a la sucursal que quiera, paga el envío ahí y registra el
 * número de seguimiento en Mis Ventas. Nadie devuelve fletes a mano.
 *
 * Las tarifas las decide Vero y viven en `site_config` (key `envio_coordinado`),
 * no en el código: nunca se inventan precios. Sin tarifas cargadas, o con
 * `activo: false`, esta opción no existe y todo sigue como antes.
 *
 * `apagar_shipit: true` es el interruptor para dejar de cotizar con Shipit.
 */
import { getRegionForComuna, COMUNAS_CHILE } from "@/lib/comunas";
import { foldAccents } from "@/lib/accentSearch";

/** Valor de `orders.courier` mientras el vendedor no despacha. */
export const COURIER_COORDINADO = "coordinado";
/** `serviceCode` de la cotización: no choca con los ids de Shipit. */
export const SERVICE_CODE_COORDINADO = 9001;
export const SERVICIO_COORDINADO = "Despacho coordinado por el vendedor";

/** `orders.shipping_status` del despacho coordinado. */
export const ESTADO_COORDINADO_PENDIENTE = "coordinado_pendiente";
export const ESTADO_COORDINADO_DESPACHADO = "coordinado_despachado";

/** Couriers que el vendedor puede elegir al registrar el despacho. */
export const COURIERS_COORDINADO = [
  { value: "starken", label: "Starken" },
  { value: "chilexpress", label: "Chilexpress" },
  { value: "bluexpress", label: "Blue Express" },
  { value: "correos", label: "Correos de Chile" },
  { value: "otro", label: "Otro" },
] as const;

export type ZonaEnvio = "santiago" | "misma_region" | "otra_region" | "extremos";

export interface TarifasCoordinado {
  activo: boolean;
  /** Deja de cotizar con Shipit: solo queda el despacho coordinado. */
  apagar_shipit?: boolean;
  /**
   * Origen y destino en la Región Metropolitana. Va aparte porque es la zona
   * más barata: con Shipit, Santiago→Ñuñoa costaba $4.475 y Talca→Curicó
   * (misma región, otra ciudad) $7.165 (14-09-2026). Si falta, se usa misma_region.
   */
  santiago: number;
  misma_region: number;
  otra_region: number;
  extremos: number;
  /** Texto de plazo que ve el comprador, p. ej. "2 a 5 días hábiles". */
  dias: string;
}

/** Regiones que se cobran como zona extrema. */
const REGIONES_EXTREMAS = new Set(["Arica y Parinacota", "Tarapacá", "Antofagasta", "Aysén", "Magallanes"]);

/** Nombre canónico de la comuna ("NUNOA", "ñuñoa" → "Ñuñoa"), o null. */
function comunaCanonica(comuna: string | null | undefined): string | null {
  let buscada = foldAccents(String(comuna ?? "").trim()).toLowerCase();
  if (!buscada) return null;
  // Shipit llama "SANTIAGO CENTRO" a la comuna de Santiago (`shipit_origin_commune`).
  if (buscada === "santiago centro") buscada = "santiago";
  return COMUNAS_CHILE.find((c) => foldAccents(c).toLowerCase() === buscada) ?? null;
}

/** Zona tarifaria entre dos comunas. null si alguna no se reconoce. */
export function zonaEnvio(comunaOrigen: string | null | undefined, comunaDestino: string | null | undefined): ZonaEnvio | null {
  const origen = comunaCanonica(comunaOrigen);
  const destino = comunaCanonica(comunaDestino);
  if (!origen || !destino) return null;
  const rO = getRegionForComuna(origen);
  const rD = getRegionForComuna(destino);
  if (!rO || !rD) return null;
  if (rO === "Metropolitana" && rD === "Metropolitana") return "santiago";
  if (rO === rD) return "misma_region";
  if (REGIONES_EXTREMAS.has(rO) || REGIONES_EXTREMAS.has(rD)) return "extremos";
  return "otra_region";
}

/** Valida lo que venga de `site_config`. Cualquier dato roto = opción apagada. */
export function leerTarifasCoordinado(valor: unknown): TarifasCoordinado | null {
  if (!valor || typeof valor !== "object") return null;
  const v = valor as Record<string, unknown>;
  const precio = (x: unknown) => (typeof x === "number" && Number.isFinite(x) && x > 0 ? Math.round(x) : null);
  const misma = precio(v.misma_region);
  const otra = precio(v.otra_region);
  const extremos = precio(v.extremos);
  if (v.activo !== true || !misma || !otra || !extremos) return null;
  return {
    activo: true,
    apagar_shipit: v.apagar_shipit === true,
    santiago: precio(v.santiago) ?? misma,
    misma_region: misma,
    otra_region: otra,
    extremos,
    dias: typeof v.dias === "string" && v.dias.trim() ? v.dias.trim() : "Según el courier que elija el vendedor",
  };
}

/** Precio del despacho coordinado entre dos comunas, o null si no aplica. */
export function precioCoordinado(
  tarifas: TarifasCoordinado | null,
  comunaOrigen: string | null | undefined,
  comunaDestino: string | null | undefined
): number | null {
  if (!tarifas) return null;
  const zona = zonaEnvio(comunaOrigen, comunaDestino);
  return zona ? tarifas[zona] : null;
}

/** Lee las tarifas vigentes. Nunca lanza: si falla, la opción no se ofrece. */
export async function obtenerTarifasCoordinado(
  // Cualquier cliente de Supabase con lectura de `site_config`.
  supabase: { from: (t: string) => any }
): Promise<TarifasCoordinado | null> {
  try {
    const { data } = await supabase.from("site_config").select("value").eq("key", "envio_coordinado").maybeSingle();
    return leerTarifasCoordinado(data?.value);
  } catch {
    return null;
  }
}
