import { foldAccents } from "./accentSearch";

const SHIPIT_EMAIL = process.env.SHIPIT_EMAIL ?? "";
const SHIPIT_TOKEN = process.env.SHIPIT_TOKEN ?? "";
const BASE_URL = "https://api.shipit.cl/v";

const HEADERS = {
  "Content-Type": "application/json",
  "Accept": "application/vnd.shipit.v4",
  "X-Shipit-Email": SHIPIT_EMAIL,
  "X-Shipit-Access-Token": SHIPIT_TOKEN,
};

export interface ShippingQuote {
  service: string;
  serviceCode: number;
  deliveryTime: string;
  price: number;
  courier: string;
}

// Cache communes in memory (loaded once per cold start)
let communesCache: { id: number; name: string }[] | null = null;

/** Load all Shipit communes and cache them */
async function loadCommunes(): Promise<{ id: number; name: string }[]> {
  if (communesCache) return communesCache;

  try {
    const res = await fetch(`${BASE_URL}/communes`, { headers: HEADERS });
    if (!res.ok) return [];
    const data = await res.json();
    communesCache = (data as any[]).map((c) => ({
      id: c.id,
      name: (c.name as string).toUpperCase(),
    }));
    return communesCache;
  } catch {
    return [];
  }
}

/**
 * Find commune ID by name (fuzzy match).
 *
 * Shipit devuelve sus 727 comunas SIN tildes ni ñ (`CONCEPCION`, `NUNOA`,
 * `VALPARAISO`, `PENALOLEN`). Comparar contra el nombre real con tilde no
 * calzaba ni exacto ni parcial, así que cotizar despacho fallaba en silencio
 * para toda comuna acentuada: 287 de 1.671 libros activos, 116 solo de
 * Concepción. Por eso se compara sobre texto plegado. (4 ago 2026)
 */
export async function findCommuneId(communeName: string): Promise<number | null> {
  return (await findCommune(communeName))?.id ?? null;
}

/**
 * Igual que `findCommuneId` pero devuelve también el nombre canónico de Shipit.
 * Importa cuando la dirección viene sin comas ("Dublé Almeyda 2300 depto 502
 * Ñuñoa"): el id se resuelve bien por inclusión, pero el nombre que se manda
 * en `commune_name` tiene que ser "ÑUÑOA", no la dirección entera.
 */
export async function findCommune(communeName: string): Promise<{ id: number; name: string } | null> {
  const communes = await loadCommunes();
  const wanted = foldAccents(communeName).trim();
  if (!wanted) return null;

  // Exact match
  const exact = communes.find((c) => foldAccents(c.name) === wanted);
  if (exact) return exact;

  // Partial match. Se exige un mínimo de largo porque un `includes` con
  // términos cortos empareja cualquier cosa.
  if (wanted.length < 4) return null;
  const partial = communes.find((c) => {
    const name = foldAccents(c.name);
    return name.includes(wanted) || wanted.includes(name);
  });
  if (partial) return partial;

  return null;
}

export interface ShipitDestination {
  street?: string;
  number?: number;
  commune_name: string;
  full_name?: string;
  email?: string;
  phone?: string;
}

/**
 * Resultado de cotizar. La distinción importa: `unavailable` significa que
 * Shipit **respondió** que no hay servicio para ese par de comunas, y en ese
 * caso NO corresponde caer a una tarifa de referencia — no existe envío que
 * comprar. Un array vacío con `unavailable: false` es una falla nuestra (red,
 * credenciales) y ahí el fallback sí es la salida correcta.
 *
 * Nació de la primera venta de Libros del Bardo (5 ago 2026): Shipit no retira
 * en Melipeuco, el fallback de $2.900 lo tapó, y la venta se pagó sin que
 * existiera despacho posible.
 */
export interface ShipitQuoteResult {
  quotes: ShippingQuote[];
  /** Shipit confirmó que no hay servicio para este par de comunas. */
  unavailable: boolean;
  reason?: string;
}

/**
 * Couriers que aceptan que el remitente deje el paquete en su sucursal con la
 * etiqueta de Shipit, sin Retiro Héroe. Es la modalidad `dropoff` de la
 * decisión D7 (docs/prompts/shipit-automatico-v2.md). La lista sale del
 * centro de ayuda de Shipit (artículo 360007479394): "solo para Chilexpress,
 * Starken y Bluexpress". Los nombres son los que devuelve `/v/rates` en
 * `courier.name`, en minúsculas.
 */
export const DROPOFF_COURIERS = ["chilexpress", "starken", "bluexpress"] as const;

export interface ShipitQuoteOptions {
  /**
   * Si viene, solo se devuelven cotizaciones de estos couriers (por
   * `courier.name`). Cuando Shipit respondió con precios pero ninguno es de
   * la lista, el resultado es `unavailable: true`: para ese vendedor no hay
   * despacho posible, y el checkout no debe caer a la tarifa de referencia.
   */
  allowedCouriers?: readonly string[];
}

/**
 * Get shipping quotes from Shipit.
 * Requires commune names — resolves to commune_id internally.
 */
export async function getShipitQuotes(
  originCommune: string,
  destCommune: string,
  weight: number = 0.5,
  height: number = 5,
  width: number = 15,
  length: number = 22,
  dest?: Partial<ShipitDestination>,
  opts: ShipitQuoteOptions = {},
): Promise<ShipitQuoteResult> {
  if (!SHIPIT_EMAIL || !SHIPIT_TOKEN) {
    console.error("[shipit] Missing SHIPIT_EMAIL or SHIPIT_TOKEN");
    return { quotes: [], unavailable: false, reason: "missing_credentials" };
  }

  // Resolve commune IDs
  const [originId, destId] = await Promise.all([
    findCommuneId(originCommune),
    findCommuneId(destCommune),
  ]);

  if (!originId) {
    console.error(`[shipit] Origin commune not found: ${originCommune}`);
    return {
      quotes: [],
      unavailable: true,
      reason: `Shipit no reconoce la comuna de origen: ${originCommune}`,
    };
  }
  if (!destId) {
    console.error(`[shipit] Destination commune not found: ${destCommune}`);
    return {
      quotes: [],
      unavailable: true,
      reason: `Shipit no reconoce la comuna de destino: ${destCommune}`,
    };
  }

  try {
    const res = await fetch(`${BASE_URL}/rates`, {
      method: "POST",
      headers: HEADERS,
      body: JSON.stringify({
        parcel: {
          length,
          width,
          height,
          weight,
          origin_id: originId,
          destiny_id: destId,
          type_of_destiny: "domicilio",
          algorithm: "1",
          algorithm_days: "2",
        },
      }),
    });

    // Shipit contesta 400 con `message: "No obtuvimos precios bajo la
    // configuración disponible: Sin Precios, …"` cuando simplemente no hay
    // servicio para ese par de comunas (típico: ningún courier retira en el
    // origen). Eso es una respuesta válida, no una caída: hay que decirle al
    // comprador que no se puede despachar, no inventarle una tarifa.
    if (!res.ok) {
      const text = await res.text();
      console.error("[shipit] Rates error:", res.status, text);
      const noService = res.status === 400 && /sin precios/i.test(text);
      return {
        quotes: [],
        unavailable: noService,
        reason: noService
          ? `Shipit no tiene servicio entre ${originCommune} y ${destCommune}`
          : `Shipit respondió ${res.status}`,
      };
    }

    const data = await res.json();
    const prices = data.prices ?? [];

    if (!prices.length) {
      console.warn("[shipit] No prices returned:", data.message ?? "unknown");
      return {
        quotes: [],
        unavailable: true,
        reason: `Shipit no tiene servicio entre ${originCommune} y ${destCommune}`,
      };
    }

    const permitido = (p: any) =>
      !opts.allowedCouriers ||
      opts.allowedCouriers.includes(String(p.courier?.name ?? "").toLowerCase());

    const quotes = prices
      .filter((p: any) => p.price > 0 && p.available_to_shipping !== false)
      .filter(permitido)
      .map((p: any, i: number) => ({
        service: p.courier?.display_name ?? p.courier?.name ?? `Servicio ${i + 1}`,
        serviceCode: i,
        deliveryTime: p.days
          ? `${p.days} día${p.days > 1 ? "s" : ""} hábil${p.days > 1 ? "es" : ""}`
          : p.name ?? "3-5 días hábiles",
        price: Math.round(p.price),
        courier: p.courier?.name ?? "courier",
      }))
      .sort((a: ShippingQuote, b: ShippingQuote) => a.price - b.price);

    // Todos los precios vinieron marcados como no despachables, o ninguno es
    // de un courier permitido para la modalidad del vendedor.
    if (!quotes.length) {
      const filtrados = opts.allowedCouriers && prices.some((p: any) => p.price > 0);
      return {
        quotes: [],
        unavailable: true,
        reason: filtrados
          ? `Ningún courier con entrega en sucursal (${opts.allowedCouriers!.join(", ")}) llega de ${originCommune} a ${destCommune}`
          : `Shipit no tiene servicio entre ${originCommune} y ${destCommune}`,
      };
    }

    return { quotes, unavailable: false };
  } catch (err) {
    console.error("[shipit] Exception:", err);
    return { quotes: [], unavailable: false, reason: "network_error" };
  }
}

/* ── Crear envío en Shipit ── */

const ORDERS_URL = "https://orders.shipit.cl/v";
const ORDERS_HEADERS = {
  "Content-Type": "application/json",
  "Accept": "application/vnd.orders.v1",
  "X-Shipit-Email": SHIPIT_EMAIL,
  "X-Shipit-Access-Token": SHIPIT_TOKEN,
};

export interface ShipitOrderInput {
  /** ID único de la orden en tuslibros.cl */
  orderId: string;
  /** Cantidad de productos en el paquete (bundle). Default 1. */
  itemCount?: number;
  /** Dirección de origen (vendedor). Si no se pasa, Shipit usa la de la cuenta. */
  origin?: {
    street: string;
    number: number;
    complement?: string;
    commune_id?: number;
    commune_name: string;
    full_name: string;
    email: string;
    phone: string;
  };
  /** Datos del destino */
  destiny: {
    street: string;
    number: number;
    complement?: string;
    commune_id: number;
    commune_name: string;
    full_name: string;
    email: string;
    phone: string;
  };
  /** Dimensiones del paquete. Si no vienen se estiman a partir de itemCount. */
  sizes?: { width: number; height: number; length: number; weight: number };
  /** Courier seleccionado */
  courier: { client: string; price: number };
}

/**
 * Estima dimensiones/peso razonables para un paquete de N libros apilados.
 * Pensado para que Shipit no rechace la emisión por declarar "1 libro" cuando
 * en realidad van más — problema observado en el bundle de Camilo (17 abril 2026).
 */
export function estimateBookPackageSize(itemCount: number): {
  width: number;
  height: number;
  length: number;
  weight: number;
} {
  const n = Math.max(1, Math.min(itemCount, 20));
  // Libros promedio: 400 g, 20×15 cm, grosor ~3 cm
  return {
    width: 20,
    height: 22,
    length: Math.min(30, 4 + 3 * n),
    weight: Math.max(0.5, Math.min(10, 0.1 + 0.4 * n)),
  };
}

export interface ShipitOrderResult {
  id: number;
  state: string;
  tracking_code?: string;
  label_url?: string;
  error?: string;
}

/** Best-effort extraction of a printable label URL from a Shipit order response. */
function extractLabelUrl(data: any): string | undefined {
  if (!data) return undefined;
  // Shipit returns different shapes depending on plan/endpoint.
  const candidates = [
    data.label_url,
    data.labels_url,
    data.url_label,
    data.label,
    typeof data.labels === "string" ? data.labels : undefined,
    Array.isArray(data.labels) ? data.labels[0]?.url ?? data.labels[0] : undefined,
    data.packing?.label_url,
    data.packing?.url,
  ];
  const found = candidates.find((c) => typeof c === "string" && c.startsWith("http"));
  return found;
}

/**
 * @deprecated Endpoint viejo (`orders.shipit.cl/v/orders`). Desde el 07-09-2026
 * el webhook de MercadoPago ya no lo llama: encola en `shipments` y el worker
 * (app/api/cron/shipments) crea el envío con `createShipitShipment()` contra
 * `api.shipit.cl/v/shipments`. Se deja para el script de recuperación de la
 * fase 1b y se borra cuando ese script muera.
 * Docs: POST https://orders.shipit.cl/v/orders
 */
export async function createShipitOrder(input: ShipitOrderInput): Promise<ShipitOrderResult> {
  const { orderId, itemCount, origin, destiny, sizes, courier } = input;

  const [destCommuneId, originCommuneId] = await Promise.all([
    destiny.commune_id || findCommuneId(destiny.commune_name),
    origin ? (origin.commune_id || findCommuneId(origin.commune_name)) : Promise.resolve(null),
  ]);

  if (!destCommuneId) {
    return { id: 0, state: "error", error: `Comuna destino no encontrada: ${destiny.commune_name}` };
  }

  const items = Math.max(1, itemCount ?? 1);
  const resolvedSizes = sizes ?? estimateBookPackageSize(items);

  const body: Record<string, any> = {
    order: {
      kind: 0,
      platform: 2,
      reference: `TL-${orderId.slice(0, 12)}`,
      items,
      seller: {
        status: "paid",
        name: "tuslibros",
        id: orderId,
      },
      sizes: resolvedSizes,
      courier: {
        client: courier.client,
        selected: true,
        payable: false,
      },
      prices: {
        total: courier.price,
        price: courier.price,
        tax: 0,
        overcharge: 0,
      },
      destiny: {
        street: destiny.street,
        number: destiny.number,
        complement: destiny.complement ?? "",
        commune_id: destCommuneId,
        commune_name: destiny.commune_name.toUpperCase(),
        full_name: destiny.full_name,
        email: destiny.email,
        phone: destiny.phone,
        kind: "home_delivery",
      },
    },
  };

  if (origin && originCommuneId) {
    body.order.origin = {
      street: origin.street,
      number: origin.number,
      complement: origin.complement ?? "",
      commune_id: originCommuneId,
      commune_name: origin.commune_name.toUpperCase(),
      full_name: origin.full_name,
      email: origin.email,
      phone: origin.phone,
    };
  }

  try {
    const res = await fetch(`${ORDERS_URL}/orders`, {
      method: "POST",
      headers: ORDERS_HEADERS,
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (data.error || data.state === "error") {
      console.error("[shipit] Create order error:", data.error);
      return { id: 0, state: "error", error: data.error };
    }

    // Log once so we can inspect the actual shape returned by Shipit.
    console.log("[shipit] Create order raw response keys:", Object.keys(data ?? {}));

    return {
      id: data.id,
      state: data.state ?? "draft",
      tracking_code: data.tracking_number ?? data.tracking_code,
      label_url: extractLabelUrl(data),
    };
  } catch (err) {
    console.error("[shipit] Create order exception:", err);
    return { id: 0, state: "error", error: String(err) };
  }
}

/* ── API de Envíos (api.shipit.cl/v/shipments) — fase 1 ── */

/**
 * Ids de courier que exige `courier.id` al crear. Verificados contra
 * `GET /v/couriers` el 07-09-2026 (Chilexpress 1, Starken 2, Bluexpress 8).
 * Coinciden con `courier.name` de `/v/rates` y con `orders.courier`.
 */
export const COURIER_IDS: Record<string, number> = {
  chilexpress: 1,
  starken: 2,
  bluexpress: 8,
};

export interface ShipitShipmentInput {
  /** `TL-` + 12 chars del bundle_id. Máximo 15 caracteres, único por día. */
  reference: string;
  /** `users.shipit_origin_id`. Null solo en dry-run: el body queda con origin_id null. */
  originId: number | null;
  /** Libros del bundle. */
  items: number;
  sizes: { length: number; width: number; height: number; weight: number };
  /** El que eligió y pagó el comprador (`orders.courier`). */
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
  /** Solo para `seller.id` del body (trazabilidad en el panel de Shipit). */
  sellerRef?: string;
}

export interface ShipitShipmentResult {
  id: number | null;
  /** `created` al crear; `in_preparation` ~20 s después; `canceled_shipment` tras DELETE. */
  status: string | null;
  courier: string | null;
  tracking_number: string | null;
  pack_pdf: string | null;
  total_price: number | null;
  last_pickup: unknown;
  error?: string;
  httpStatus: number;
  /** Respuesta completa: se guarda entera en `shipit_events.response`. */
  raw: unknown;
}

/**
 * Body exacto de `POST /v/shipments`. Es una función pura a propósito: el
 * dry-run registra en `shipit_events` lo que se mandaría, byte por byte.
 */
export function armarBodyShipit(input: ShipitShipmentInput): Record<string, unknown> {
  const courier = input.courier.toLowerCase();
  return {
    kind: 0, // canal de venta: shipit
    platform: 2, // api
    reference: input.reference,
    items: input.items,
    sizes: input.sizes,
    // Inerte hasta que Shipit active el modo sandbox por cuenta (correo del
    // 07-09-2026). Se deja explícito para que nadie crea que protege algo.
    sandbox: false,
    seller: input.sellerRef ? { id: input.sellerRef, name: "tuslibros" } : undefined,
    destiny: {
      street: input.destiny.street,
      number: input.destiny.number,
      complement: input.destiny.complement ?? "",
      commune_id: input.destiny.commune_id,
      commune_name: input.destiny.commune_name.toUpperCase(),
      full_name: input.destiny.full_name,
      email: input.destiny.email ?? "",
      phone: input.destiny.phone ?? "",
      kind: "home_delivery",
    },
    courier: {
      id: COURIER_IDS[courier] ?? null,
      client: courier,
      // Fuerza el courier que pagó el comprador; sin esto Shipit reasigna.
      selected: true,
      // `payable` = PAGO CONTRA ENTREGA: el destinatario paga el flete al
      // recibir, con recargo. NO significa "envío pagado". Siempre false: el
      // comprador ya pagó el flete en el checkout.
      payable: false,
    },
    origin: { origin_id: input.originId },
  };
}

function parseShipmentResponse(status: number, data: any): ShipitShipmentResult {
  const err =
    !data || typeof data !== "object"
      ? `respuesta no JSON (HTTP ${status})`
      : data.error ?? data.message ?? (status >= 400 ? `HTTP ${status}` : undefined);
  return {
    id: typeof data?.id === "number" ? data.id : null,
    status: data?.status ?? null,
    courier: data?.courier_for_client ?? null,
    tracking_number: data?.tracking_number ?? null,
    pack_pdf: data?.pack_pdf ?? null,
    total_price: typeof data?.total_price === "number" ? data.total_price : null,
    last_pickup: data?.last_pickup ?? null,
    error: status >= 400 || data?.id === undefined ? String(err ?? `HTTP ${status}`) : undefined,
    httpStatus: status,
    raw: data,
  };
}

async function shipitFetch(path: string, init: RequestInit): Promise<{ status: number; data: any }> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 15_000);
  try {
    const res = await fetch(`${BASE_URL}${path}`, { ...init, headers: HEADERS, signal: ctrl.signal });
    const text = await res.text();
    let data: any = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = { raw_text: text.slice(0, 500) };
    }
    return { status: res.status, data };
  } finally {
    clearTimeout(t);
  }
}

/**
 * Crea el envío. No reintenta: el reintento lo decide el worker según el
 * estado de la fila. Verificado el 07-09-2026: responde `id` y `status:
 * created` al instante; `tracking_number` y `pack_pdf` llegan ~20 s después.
 */
export async function createShipitShipment(body: Record<string, unknown>): Promise<ShipitShipmentResult> {
  if (!SHIPIT_EMAIL || !SHIPIT_TOKEN) {
    return { ...parseShipmentResponse(0, null), error: "missing_credentials" };
  }
  // Guard de origen (D6): sin origin_id NO se crea. Si el body fuera sin
  // `origin`, Shipit usaría el origen por defecto de la cuenta, que hoy es
  // "ocasion" (Libro de Ocasión): el envío saldría cobrado y etiquetado desde
  // la dirección equivocada. El worker ya manda esas filas a needs_origin;
  // esto es la segunda barrera, por si alguien llama a esta función directo.
  const originId = (body as any)?.origin?.origin_id;
  if (typeof originId !== "number" || originId <= 0) {
    return { ...parseShipmentResponse(0, null), error: "sin origin_id: no se crea (D6)" };
  }
  const { status, data } = await shipitFetch("/shipments", { method: "POST", body: JSON.stringify(body) });
  return parseShipmentResponse(status, data);
}

/**
 * Consulta por id. `GET /v/shipments/reference/{ref}` devuelve 400 (probado el
 * 07-09-2026), así que el id es la única llave: se guarda apenas llega.
 */
export async function getShipitShipment(id: number): Promise<ShipitShipmentResult> {
  const { status, data } = await shipitFetch(`/shipments/${id}`, { method: "GET" });
  return parseShipmentResponse(status, data);
}

/**
 * Anula un envío. No está documentado; verificado el 07-09-2026 ("Envío
 * eliminado", queda en `canceled_shipment`). Lo usa un humano (script o ruta
 * admin), nunca el worker por su cuenta.
 */
export async function deleteShipitShipment(id: number): Promise<{ ok: boolean; httpStatus: number; raw: unknown }> {
  const { status, data } = await shipitFetch(`/shipments/${id}`, { method: "DELETE" });
  return { ok: status >= 200 && status < 300, httpStatus: status, raw: data };
}
