/**
 * Capa de proveedores de despacho: lo que el worker de envíos necesita de un
 * courier o agregador, sin saber cuál es (PR 1.1 del plan de despacho propio,
 * 07-10-2026). Diseño: docs/ARQUITECTURA.md §3.3 del repo vero-pix/despacho.
 *
 * Hoy hay un solo proveedor real, Shipit (apagado desde el 15-09-2026 con
 * `apagar_shipit`, pero el worker sigue corriendo cada 5 minutos para los
 * envíos que quedaron vivos). Este PR solo pone la interfaz DELANTE de Shipit:
 * el worker hace exactamente las mismas llamadas, en el mismo orden, y escribe
 * los mismos eventos y correos. El siguiente proveedor (Blue Express) entra
 * implementando esta misma interfaz.
 *
 * Diferencias con la interfaz del documento, resueltas a favor del código:
 *
 *   · El documento propone `quote`, `coverage`, `listServicePoints`,
 *     `requestPickup` y `cancel`. El worker no usa ninguno de esos (la
 *     cotización vive en app/api/shipping/quote y el retiro a pedido en
 *     app/api/shipments/[id]/retiro), así que no se inventan acá: entran con
 *     el primer proveedor que los necesite, en el PR 2.1.
 *   · `createShipment` recibe una solicitud ya armada (`armarSolicitud`) en vez
 *     de armarla adentro: el dry-run registra en `shipit_events` el body EXACTO
 *     que se mandaría, y eso exige que armar sea una función pura aparte.
 *   · El origen es un id numérico del proveedor (`users.shipit_origin_id`, u
 *     origen compartido en la RM), no una dirección: así funciona Shipit hoy y
 *     el worker decide `needs_origin` con ese dato.
 *   · El id del envío es numérico (`shipments.shipit_id`). La columna genérica
 *     `provider_shipment_id` que propone §5.2 queda para cuando haya un
 *     proveedor con ids de texto.
 *   · Los estados del courier se normalizan a un vocabulario corto
 *     (`EstadoCourier`), pero el estado crudo viaja igual porque el worker lo
 *     muestra en el resumen de la corrida.
 *
 * Sin dependencias de Next ni de Supabase: lo que toca la base se queda en el
 * worker (app/api/cron/shipments/route.ts) y en lib/shipments.ts.
 */

/** Proveedores conocidos. `shipments.provider` ausente o null = "shipit". */
export type ProviderId = "shipit" | "fake";

export const PROVIDER_POR_DEFECTO: ProviderId = "shipit";

/**
 * Lo que dice el courier del paquete, normalizado. Es lo único que el worker
 * mira para avanzar un envío por su cuenta:
 *   created    → existe la guía pero el courier todavía no lo tiene
 *   in_transit → el courier ya lo tiene
 *   delivered  → entregado
 *   cancelled  → anulado en el proveedor
 *   unknown    → cualquier otra cosa: el worker no avanza
 */
export type EstadoCourier = "created" | "in_transit" | "delivered" | "cancelled" | "unknown";

/** Comuna tal como la conoce el proveedor (id propio, nombre canónico, región). */
export interface ComunaProveedor {
  id: number;
  name: string;
  /** Región en la numeración del proveedor. Se compara contra `regionRM`. */
  region_id: number | null;
}

/** Medidas del paquete en cm y peso en kg, como las pide el proveedor. */
export interface MedidasPaquete {
  length: number;
  width: number;
  height: number;
  weight: number;
}

/**
 * Lo que se necesita para crear un envío. Es el mismo contenido que el worker
 * armaba para Shipit: el adaptador lo traduce a su API.
 */
export interface SolicitudEnvio {
  /** `TL-` + 12 chars del bundle_id (lib/shipments.ts). */
  reference: string;
  /** Origen en el proveedor. Null solo en dry-run. */
  originId: number | null;
  /** Ambiente de pruebas del proveedor, si lo tiene. */
  sandbox?: boolean;
  /** Libros del bundle. */
  items: number;
  sizes: MedidasPaquete;
  /** El courier que eligió y pagó el comprador (`orders.courier`), en minúsculas. */
  courier: string;
  destiny: {
    street: string;
    number: string;
    complement?: string;
    commune_id: number;
    commune_name: string;
    full_name: string;
    email?: string;
    phone?: string;
  };
  /** Trazabilidad del vendedor en el panel del proveedor. */
  sellerRef?: string;
}

/** Respuesta del proveedor al crear o consultar un envío. */
export interface EnvioProveedor {
  /** Id del envío en el proveedor (`shipments.shipit_id`). */
  id: number | null;
  /** Estado tal como lo manda el proveedor. */
  estadoCrudo: string | null;
  estado: EstadoCourier;
  courier: string | null;
  trackingNumber: string | null;
  /**
   * URL de la etiqueta en el proveedor. Se baja al bucket privado y NO se
   * persiste: en Shipit es un objeto público con los datos del comprador.
   */
  etiquetaUrl: string | null;
  /** Lo que cobra el proveedor, en CLP. */
  costoClp: number | null;
  /** Retiro tal como lo manda el proveedor; se lee con `leerRetiro`. */
  retiroCrudo: unknown;
  error?: string;
  httpStatus: number;
  /** Respuesta completa: se guarda entera en `shipit_events.response`. */
  raw: unknown;
}

/** Retiro agendado que sigue en pie. Ver `leerRetiroShipit` en lib/shipit.ts. */
export interface RetiroProveedor {
  id: number | null;
  status: string | null;
  /** ISO `YYYY-MM-DD`. */
  date: string;
  /** Ventana tal cual, p. ej. `"11:00 - 17:00"`. */
  window: string | null;
  /** Dirección donde pasan, para el gong. */
  place: string | null;
  /** Lo creó un humano en el panel del proveedor, no nuestra API. */
  isManual: boolean;
}

/**
 * Error de un proveedor, por tipo. `ambiguous` es el peligroso: un timeout
 * DESPUÉS de enviar, cuando no se sabe si el envío se creó. Hoy el adaptador de
 * Shipit no lanza (devuelve `error` en la respuesta, como siempre lo hizo
 * lib/shipit.ts); la clase existe para los proveedores que vienen.
 */
export class ProviderError extends Error {
  constructor(
    public kind:
      | "validation"
      | "not_covered"
      | "auth"
      | "insufficient_funds"
      | "rate_limited"
      | "unavailable"
      | "ambiguous"
      | "not_supported",
    message: string,
    public raw?: unknown
  ) {
    super(message);
    this.name = "ProviderError";
  }
}

export interface ProviderAdapter {
  readonly id: ProviderId;

  /** Couriers que aceptan que el vendedor deje el paquete en sucursal (modo dropoff). */
  readonly couriersDropoff: readonly string[];

  /** Región Metropolitana en la numeración de `ComunaProveedor.region_id`. */
  readonly regionRM: number;

  /**
   * Origen compartido para un vendedor de la RM sin origen propio, en dropoff.
   * Null si el proveedor no tiene uno: el envío pasa a `needs_origin`.
   */
  origenCompartidoRM(): number | null;

  /** Medidas del paquete según cuántos libros lleva. */
  medidasPaquete(items: number): MedidasPaquete;

  /** Comuna del proveedor a partir de un nombre (con o sin tildes). */
  buscarComuna(nombre: string): Promise<ComunaProveedor | null>;

  /** Body exacto que se mandaría al crear. Pura: el dry-run lo registra tal cual. */
  armarSolicitud(solicitud: SolicitudEnvio): Record<string, unknown>;

  /** Crea el envío. No reintenta: el reintento lo decide el worker. */
  crearEnvio(body: Record<string, unknown>): Promise<EnvioProveedor>;

  /** Consulta un envío por su id en el proveedor. */
  consultarEnvio(id: number): Promise<EnvioProveedor>;

  /**
   * Id de un envío creado en un intento anterior, leído de la respuesta que
   * quedó en `shipit_events.response`. Null si no hay. Es la segunda capa de
   * idempotencia del paso pending → created.
   */
  idDesdeRespuesta(raw: unknown): number | null;

  /** Retiro vigente a partir de `retiroCrudo`, o null. Nunca lanza. */
  leerRetiro(retiroCrudo: unknown): RetiroProveedor | null;

  /** El chofer ya pasó y se llevó el paquete. */
  retiroCumplido(retiro: RetiroProveedor | null): boolean;
}
