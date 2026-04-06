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

import { COMUNAS_CHILE } from "./comunas";

/**
 * Extrae la comuna de una dirección geocodificada por Mapbox.
 * Formato típico: "Calle 123, Comuna, Región ..., Chile"
 * Valida contra la lista real de comunas de Chile.
 */
export function extractCommune(address: string): string {
  const parts = address.split(",").map((p) => p.trim());

  // Remove postal codes and "Chile" suffix
  const cleaned = parts.map((p) => p.replace(/\d{7,}/, "").trim()).filter(Boolean);

  // Try to match each part against known comunas (skip first part which is usually street)
  for (let i = 1; i < cleaned.length; i++) {
    const part = cleaned[i];
    // Remove "Región ..." prefix
    if (part.toLowerCase().startsWith("región")) continue;
    if (part.toLowerCase() === "chile") continue;

    // Exact match
    const match = COMUNAS_CHILE.find(
      (c) => c.toLowerCase() === part.toLowerCase()
    );
    if (match) return match;
  }

  // Fallback: second part (index 1) is usually the comuna in Mapbox format
  if (cleaned.length >= 3) return cleaned[1];
  if (cleaned.length >= 2) return cleaned[cleaned.length - 1];
  return cleaned[0];
}
