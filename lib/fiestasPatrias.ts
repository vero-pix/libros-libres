/**
 * Ventana de Fiestas Patrias para adornos estacionales (la chupalla del logo).
 *
 * La fecha se calcula SIEMPRE en hora de Chile: el servidor corre en UTC y un
 * `new Date().getMonth()` a secas adelanta el cambio de día en la noche chilena.
 * Se resuelve en el servidor y baja como prop para que no haya mismatch de
 * hidratación con el reloj del navegador.
 */
export function esSemanaDel18(now: Date = new Date()): boolean {
  const [mes, dia] = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Santiago",
    month: "2-digit",
    day: "2-digit",
  })
    .format(now)
    .split("-")
    .map(Number);

  return mes === 9 && dia >= 8 && dia <= 20;
}
