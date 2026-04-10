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

/** Find commune ID by name (fuzzy match) */
async function findCommuneId(communeName: string): Promise<number | null> {
  const communes = await loadCommunes();
  const upper = communeName.toUpperCase().trim();

  // Exact match
  const exact = communes.find((c) => c.name === upper);
  if (exact) return exact.id;

  // Partial match
  const partial = communes.find((c) => c.name.includes(upper) || upper.includes(c.name));
  if (partial) return partial.id;

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
): Promise<ShippingQuote[]> {
  if (!SHIPIT_EMAIL || !SHIPIT_TOKEN) {
    console.error("[shipit] Missing SHIPIT_EMAIL or SHIPIT_TOKEN");
    return [];
  }

  // Resolve commune IDs
  const [originId, destId] = await Promise.all([
    findCommuneId(originCommune),
    findCommuneId(destCommune),
  ]);

  if (!originId) {
    console.error(`[shipit] Origin commune not found: ${originCommune}`);
    return [];
  }
  if (!destId) {
    console.error(`[shipit] Destination commune not found: ${destCommune}`);
    return [];
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

    if (!res.ok) {
      const text = await res.text();
      console.error("[shipit] Rates error:", res.status, text);
      return [];
    }

    const data = await res.json();
    const prices = data.prices ?? [];

    if (!prices.length) {
      console.warn("[shipit] No prices returned:", data.message ?? "unknown");
      return [];
    }

    return prices
      .filter((p: any) => p.price > 0 && p.available_to_shipping !== false)
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
  } catch (err) {
    console.error("[shipit] Exception:", err);
    return [];
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
  /** Dimensiones del paquete */
  sizes?: { width: number; height: number; length: number; weight: number };
  /** Courier seleccionado */
  courier: { client: string; price: number };
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
 * Crea una orden/envío en Shipit.
 * Docs: POST https://orders.shipit.cl/v/orders
 */
export async function createShipitOrder(input: ShipitOrderInput): Promise<ShipitOrderResult> {
  const { orderId, destiny, sizes, courier } = input;

  const destCommuneId = destiny.commune_id || (await findCommuneId(destiny.commune_name));
  if (!destCommuneId) {
    return { id: 0, state: "error", error: `Comuna destino no encontrada: ${destiny.commune_name}` };
  }

  const body = {
    order: {
      kind: 0,
      platform: 2,
      reference: `TL-${orderId.slice(0, 12)}`,
      items: 1,
      seller: {
        status: "paid",
        name: "tuslibros",
        id: orderId,
      },
      sizes: sizes ?? { width: 15, height: 22, length: 5, weight: 0.5 },
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

/** Resuelve nombre de comuna a ID de Shipit (exportado para uso externo) */
export { findCommuneId };
