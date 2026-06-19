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
