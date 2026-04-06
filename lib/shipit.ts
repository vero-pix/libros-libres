const SHIPIT_EMAIL = process.env.SHIPIT_EMAIL ?? "";
const SHIPIT_TOKEN = process.env.SHIPIT_TOKEN ?? "";
const BASE_URL = "https://api.shipit.cl/v";

export interface ShippingQuote {
  service: string;
  serviceCode: number;
  deliveryTime: string;
  price: number;
  courier: string;
}

/**
 * Get shipping quotes from Shipit (multiple couriers).
 * Uses commune names directly — no coverage codes needed.
 */
export async function getShipitQuotes(
  originCommune: string,
  destCommune: string,
  weight: number = 0.5,
  height: number = 5,
  width: number = 15,
  length: number = 22,
): Promise<ShippingQuote[]> {
  if (!SHIPIT_EMAIL || !SHIPIT_TOKEN) {
    console.error("[shipit] Missing SHIPIT_EMAIL or SHIPIT_TOKEN");
    return [];
  }

  try {
    const res = await fetch(`${BASE_URL}/quotation`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/vnd.shipit.v4",
        "X-Shipit-Email": SHIPIT_EMAIL,
        "X-Shipit-Access-Token": SHIPIT_TOKEN,
      },
      body: JSON.stringify({
        parcel: {
          width,
          height,
          length,
          weight,
        },
        origin: {
          commune_name: originCommune,
        },
        destiny: {
          commune_name: destCommune,
        },
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("[shipit] Quote error:", res.status, text);
      return [];
    }

    const data = await res.json();

    // Shipit returns array of courier options
    const options = Array.isArray(data) ? data : data.quotations ?? data.results ?? [];

    return options
      .filter((q: any) => q.total_price > 0 || q.price > 0)
      .map((q: any, i: number) => ({
        service: q.courier?.name ?? q.service_type ?? q.name ?? `Servicio ${i + 1}`,
        serviceCode: q.id ?? i,
        deliveryTime: q.days ? `${q.days} día${q.days > 1 ? "s" : ""} hábil${q.days > 1 ? "es" : ""}` : q.delivery_time ?? "3-5 días hábiles",
        price: Math.round(q.total_price ?? q.price ?? 0),
        courier: q.courier?.name ?? q.carrier ?? "Courier",
      }))
      .sort((a: ShippingQuote, b: ShippingQuote) => a.price - b.price);
  } catch (err) {
    console.error("[shipit] Exception:", err);
    return [];
  }
}
