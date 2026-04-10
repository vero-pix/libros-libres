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
