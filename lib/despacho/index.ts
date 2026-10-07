import { PROVIDER_POR_DEFECTO, type ProviderAdapter, type ProviderId } from "./core";
import { shipitAdapter } from "./providers/shipit";
import { crearAdaptadorFalso } from "./providers/fake";

export * from "./core";

/**
 * Un solo falso por instancia: su guion avanza con cada consulta, y si cada
 * fila pidiera uno nuevo nunca pasaría de "recién creado".
 */
let falso: ProviderAdapter | null = null;

/**
 * Adaptador según `shipments.provider`. Ausente, null o vacío = Shipit: así
 * funciona igual mientras la migración 20261007 no esté aplicada (la columna
 * no viene en la fila) y para todas las filas anteriores a ella.
 *
 * Un proveedor desconocido lanza: el worker lo registra como error y la fila
 * entra al backoff normal, en vez de mandarla a Shipit por descarte.
 */
export function adaptadorDe(provider: string | null | undefined): ProviderAdapter {
  const id = (provider ?? "").trim() || PROVIDER_POR_DEFECTO;
  switch (id as ProviderId) {
    case "shipit":
      return shipitAdapter;
    case "fake":
      return (falso ??= crearAdaptadorFalso());
    default:
      throw new Error(`proveedor de despacho desconocido: "${id}"`);
  }
}
