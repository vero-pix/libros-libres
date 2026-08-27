/**
 * lib/comuna.ts
 *
 * Extraer la comuna de una dirección, sin dependencias: lo usan tanto el
 * servidor como componentes cliente (ListingCard, ListingDetail), y vivía en
 * lib/cities.ts, que arrastra el cliente de Supabase al bundle.
 *
 * Los cuatro puntos que muestran la comuna hacían `address.split(",")[1]`, que
 * asume "Calle, Comuna, Región". La carga masiva guarda "Comuna, Región" a
 * propósito (no publicar la calle y número del vendedor), y con ese formato el
 * índice 1 cae en la REGIÓN: 223 publicaciones activas mostraban "Región de Los
 * Lagos" en vez de "Puerto Varas". (27 ago 2026)
 */

/**
 * La comuna es el componente inmediatamente anterior al que dice "Región".
 * Ej: "Colombia 8857, La Florida, Región Metropolitana de Santiago 8240000, Chile"
 *      → "La Florida"
 * Devuelve null si la dirección no trae región (ej: cimlibros tenía "Chile" a secas).
 */
export function comunaDesdeAddress(address: string | null | undefined): string | null {
  if (!address) return null;
  const parts = address.split(",").map((p) => p.trim()).filter(Boolean);
  const ri = parts.findIndex((p) => /Regi[oó]n/i.test(p));
  return ri > 0 ? parts[ri - 1] : null;
}
