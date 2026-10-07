import {
  armarBodyShipit,
  createShipitShipment,
  estimateBookPackageSize,
  findCommune,
  getShipitShipment,
  leerRetiroShipit,
  retiroCumplido,
  DROPOFF_COURIERS,
  SHIPIT_DEFAULT_ORIGIN_RM,
  SHIPIT_REGION_RM,
  type ShipitShipmentResult,
} from "@/lib/shipit";
import type { EnvioProveedor, EstadoCourier, ProviderAdapter } from "../core";

/**
 * Shipit detrás de la interfaz de proveedores. No cambia nada de lo que hace
 * lib/shipit.ts: lo llama tal cual y solo traduce nombres. Queda como legado
 * mientras haya envíos de Shipit vivos (apagado para envíos nuevos desde el
 * 15-09-2026).
 */

/**
 * Estados de Shipit vistos en respuestas reales: created, in_preparation,
 * in_route, delivered, canceled_shipment. `in_transit` viene del webhook.
 * Es la misma lectura que hacía el worker (SHIPIT_EN_CAMINO y el chequeo de
 * "created" / "in_preparation" en el recordatorio de envíos detenidos).
 */
function normalizarEstado(status: string | null): EstadoCourier {
  const s = (status ?? "").toLowerCase();
  if (s === "delivered") return "delivered";
  if (s === "in_route" || s === "in_transit") return "in_transit";
  if (s === "created" || s === "in_preparation") return "created";
  if (s === "canceled_shipment") return "cancelled";
  return "unknown";
}

function aEnvio(r: ShipitShipmentResult): EnvioProveedor {
  return {
    id: r.id,
    estadoCrudo: r.status,
    estado: normalizarEstado(r.status),
    courier: r.courier,
    trackingNumber: r.tracking_number,
    etiquetaUrl: r.pack_pdf,
    costoClp: r.total_price,
    retiroCrudo: r.last_pickup,
    error: r.error,
    httpStatus: r.httpStatus,
    raw: r.raw,
  };
}

export const shipitAdapter: ProviderAdapter = {
  id: "shipit",
  couriersDropoff: DROPOFF_COURIERS,
  regionRM: SHIPIT_REGION_RM,
  origenCompartidoRM: () => SHIPIT_DEFAULT_ORIGIN_RM,
  medidasPaquete: (items) => estimateBookPackageSize(items),
  buscarComuna: (nombre) => findCommune(nombre),
  armarSolicitud: (s) => armarBodyShipit(s),
  crearEnvio: async (body) => aEnvio(await createShipitShipment(body)),
  consultarEnvio: async (id) => aEnvio(await getShipitShipment(id)),
  idDesdeRespuesta: (raw) => {
    const id = (raw as any)?.id;
    return typeof id === "number" ? id : null;
  },
  leerRetiro: (retiroCrudo) => leerRetiroShipit(retiroCrudo),
  retiroCumplido: (r) => retiroCumplido(r),
};
