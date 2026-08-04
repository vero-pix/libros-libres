import { COMUNAS_CHILE } from "./comunas";
import { foldAccents } from "./accentSearch";

/** Un tramo que nombra una región o el país no es una comuna. */
function esRegionOPais(part: string): boolean {
  const p = foldAccents(part);
  return p.startsWith("region") || p === "chile";
}

/**
 * Extrae la comuna de una dirección geocodificada por Mapbox.
 * Formato típico: "Calle 123, Comuna, Región ..., Chile"
 * Valida contra la lista real de comunas de Chile.
 *
 * La comparación va sobre texto plegado: las direcciones traen "Concepción" y
 * "Ñuñoa" con tilde, y cualquier comparación literal contra otra fuente falla.
 */
export function extractCommune(address: string): string {
  const parts = address.split(",").map((p) => p.trim());

  // Remove postal codes and "Chile" suffix
  const cleaned = parts.map((p) => p.replace(/\d{7,}/, "").trim()).filter(Boolean);

  // Try to match each part against known comunas (skip first part which is usually street)
  for (let i = 1; i < cleaned.length; i++) {
    const part = cleaned[i];
    if (esRegionOPais(part)) continue;

    const match = COMUNAS_CHILE.find((c) => foldAccents(c) === foldAccents(part));
    if (match) return match;
  }

  // Fallback: el primer tramo que no sea calle, región ni país. Antes devolvía
  // `cleaned[1]` a ciegas y en direcciones sin comuna explícita eso entregaba
  // "Región de Los Lagos" como si fuera una comuna — 116 libros activos
  // quedaban sin poder cotizar despacho por esto. (4 ago 2026)
  const candidato = cleaned.slice(1).find((p) => !esRegionOPais(p));
  if (candidato) return candidato;
  return cleaned[0] ?? "";
}
