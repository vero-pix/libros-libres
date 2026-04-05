const API_KEY_COVERAGE = process.env.CHILEXPRESS_API_KEY_COVERAGE ?? "";
const API_KEY_RATING = process.env.CHILEXPRESS_API_KEY_RATING ?? "";
// const API_KEY_SHIPPING = process.env.CHILEXPRESS_API_KEY_SHIPPING ?? ""; // para crear envíos (futuro)
const BASE_URL = process.env.CHILEXPRESS_ENV === "test"
  ? "https://testservices.wschilexpress.com"
  : "https://services.wschilexpress.com";

interface CoverageResult {
  coverageCityId: number;
  coverageCityName: string;
  countyName: string;
  regionName: string;
}

interface QuoteResult {
  serviceDescription: string;
  serviceTypeCode: number;
  deliveryTime: string;
  totalPrice: number;
}

export interface ShippingQuote {
  service: string;
  serviceCode: number;
  deliveryTime: string;
  price: number;
}

/** Busca el código de cobertura de Chilexpress a partir de un nombre de comuna */
export async function findCoverageCode(communeName: string): Promise<CoverageResult | null> {
  const res = await fetch(
    `${BASE_URL}/rating/api/v1.0/geo/coverage-areas?type=0&keyword=${encodeURIComponent(communeName)}`,
    { headers: { "Ocp-Apim-Subscription-Key": API_KEY_COVERAGE } }
  );

  if (!res.ok) {
    console.error("Chilexpress coverage error:", res.status, await res.text());
    return null;
  }

  const data = await res.json();
  const areas = data.coverageAreas as CoverageResult[] | undefined;
  if (!areas?.length) return null;

  // Buscar match exacto o el primero
  return (
    areas.find(
      (a) => a.countyName.toLowerCase() === communeName.toLowerCase()
    ) ?? areas[0]
  );
}

/** Cotiza envío entre dos códigos de cobertura */
export async function getShippingRates(
  originCode: number,
  destCode: number,
  weight: number = 0.5,
  height: number = 5,
  width: number = 15,
  length: number = 22
): Promise<ShippingQuote[]> {
  const res = await fetch(`${BASE_URL}/rating/api/v1.0/rates/courier`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Ocp-Apim-Subscription-Key": API_KEY_RATING,
    },
    body: JSON.stringify({
      originCountyCode: String(originCode),
      destinationCountyCode: String(destCode),
      package: {
        weight: String(weight),
        height: String(height),
        width: String(width),
        length: String(length),
      },
      productType: 3, // encomienda
      contentType: 1, // mercadería
      declaredWorth: "0",
      deliveryTime: 0, // 0 = todos los servicios
    }),
  });

  if (!res.ok) {
    console.error("Chilexpress rates error:", res.status, await res.text());
    return [];
  }

  const data = await res.json();
  const services = data.data?.courierServiceOptions as Array<{
    serviceDescription: string;
    serviceTypeCode: number;
    nominalTransitTime: string;
    serviceValue: number;
  }> | undefined;

  if (!services?.length) return [];

  return services.map((s) => ({
    service: s.serviceDescription,
    serviceCode: s.serviceTypeCode,
    deliveryTime: s.nominalTransitTime,
    price: Math.round(s.serviceValue),
  }));
}

/** Extrae la comuna de una dirección de texto (simplificado: última parte antes de región/Chile) */
export function extractCommune(address: string): string {
  // Patrón típico: "Calle 123, Comuna, Región, Chile"
  const parts = address.split(",").map((p) => p.trim());
  // Heurística: la comuna suele ser la penúltima o antepenúltima parte
  if (parts.length >= 3) return parts[parts.length - 3] || parts[parts.length - 2];
  if (parts.length >= 2) return parts[parts.length - 2];
  return parts[0];
}
