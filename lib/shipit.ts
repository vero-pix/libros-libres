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
    const ref = `TL-${Date.now().toString(36).slice(-8)}`.slice(0, 15);
    const res = await fetch(`${BASE_URL}/rates`, {
      method: "POST",
      headers: HEADERS,
      body: JSON.stringify({
        parcel: {
          kind: 0,
          platform: 2,
          reference: ref,
          items: 1,
          sizes: { width, height, length, weight },
          destiny: {
            commune_id: destId,
            commune_name: destCommune.toUpperCase(),
            street: dest?.street ?? "Por confirmar",
            number: dest?.number ?? 0,
            full_name: dest?.full_name ?? "Comprador",
            email: dest?.email ?? "",
            phone: dest?.phone ?? "",
          },
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
      .filter((p: any) => p.price > 0)
      .map((p: any, i: number) => ({
        service: p.name ?? p.courier ?? `Servicio ${i + 1}`,
        serviceCode: p.id ?? i,
        deliveryTime: p.days ? `${p.days} día${p.days > 1 ? "s" : ""} hábil${p.days > 1 ? "es" : ""}` : "3-5 días hábiles",
        price: Math.round(p.price ?? p.total ?? 0),
        courier: p.courier ?? p.name ?? "Courier",
      }))
      .sort((a: ShippingQuote, b: ShippingQuote) => a.price - b.price);
  } catch (err) {
    console.error("[shipit] Exception:", err);
    return [];
  }
}
