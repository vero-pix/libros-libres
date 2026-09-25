/**
 * Nombre corto de un vendedor, para los lugares donde no cabe el nombre entero
 * (tarjetas del catálogo, botones, "Vendido por…").
 *
 * Por defecto es la primera palabra: "Juan Adrián" → "Juan". Pero si el nombre
 * empieza con un artículo, la primera palabra no dice nada: "La Biblioteca de
 * Vero" salía como "La" en toda la grilla. En ese caso va la sigla sin
 * conectores: "LBV" (idea de Vero, 24-09-2026).
 */
const ARTICULOS = new Set(["la", "el", "los", "las", "lo"]);
const CONECTORES = new Set(["de", "del", "y", "e", "en", "a", "al"]);

export function nombreCortoVendedor(fullName: string | null | undefined, porDefecto = "Vendedor"): string {
  const palabras = String(fullName ?? "").trim().split(/\s+/).filter(Boolean);
  if (palabras.length === 0) return porDefecto;
  if (palabras.length > 1 && ARTICULOS.has(palabras[0].toLowerCase())) {
    return palabras
      .filter((p) => !CONECTORES.has(p.toLowerCase()))
      .map((p) => p[0].toLocaleUpperCase("es-CL"))
      .join("");
  }
  return palabras[0];
}
