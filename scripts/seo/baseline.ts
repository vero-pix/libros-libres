/**
 * Línea base de posiciones en Google, congelada el 26 may 2026.
 * Fuente: último corte de SEMrush antes de que expirara el acceso.
 *
 * El número es la posición promedio (entero) en esa fecha. Menor = mejor.
 * `gsc-report.ts` compara la posición actual de GSC contra esto y calcula el
 * delta (positivo = subió en el ranking = mejoró).
 *
 * Mantener las keys en minúscula y sin tildes para que el match con GSC sea
 * estable (se normaliza con normalizeQuery del módulo compartido).
 */
export const BASELINE_2026_05_26: Record<string, number> = {
  // Geo
  "donde comprar libros usados en santiago": 11,
  "libros usados concepcion": 15,
  "libros usados santiago": 25,
  "libros usados vina del mar": 25,
  "libros usados providencia": 27,
  "librerias de libros usados en santiago de chile": 51,
  "libros usados temuco": 82,
  // Baldor
  baldor: 20,
  "algebra de baldor": 23,
  "baldor matematica": 39,
  "baldor matematicas": 43,
  "libro de baldor": 34,
  "libro de matematicas baldor": 15,
  "algebra de baldor precio chile": 13,
  // Transaccional / marca
  "venta de libros usados por internet en chile": 7,
  "libros usados chile": 12,
  "venta de libros usados": 14,
  "compro libros usados a domicilio": 14,
  "vender libros usados chile": 18,
  "donde vender libros usados": 21,
  // Colección
  "libros antiguos": 43,
};

/**
 * Volumen de búsqueda mensual estimado en Chile, del mismo corte de SEMrush que
 * la línea base. Sirve para ordenar por oportunidad y no solo por posición:
 * subir del 27 al 10 en algo que se busca 590 veces al mes vale más que ganar
 * un puesto en algo que se busca 40.
 *
 * Mismas claves normalizadas que BASELINE (minúscula, sin tildes): con "viña"
 * en vez de "vina" la fila deja de hacer match y desaparece del reporte sin
 * avisar.
 */
export const VOLUMEN_MENSUAL: Record<string, number> = {
  // Geo
  "donde comprar libros usados en santiago": 110,
  "libros usados concepcion": 170,
  "libros usados santiago": 210,
  "libros usados vina del mar": 110,
  "libros usados providencia": 590,
  "librerias de libros usados en santiago de chile": 40,
  "libros usados temuco": 90,
  // Baldor
  baldor: 2900,
  "algebra de baldor": 1900,
  "baldor matematica": 880,
  "baldor matematicas": 720,
  "libro de baldor": 210,
  "libro de matematicas baldor": 90,
  "algebra de baldor precio chile": 40,
  // Transaccional / marca
  "venta de libros usados por internet en chile": 170,
  "libros usados chile": 210,
  "venta de libros usados": 170,
  "compro libros usados a domicilio": 110,
  "vender libros usados chile": 90,
  "donde vender libros usados": 90,
  // Colección
  "libros antiguos": 480,
};
