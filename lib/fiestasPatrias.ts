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

/**
 * La fecha de hoy en Chile, como "AAAA-MM-DD".
 *
 * Para comparar con el `until` de site_config, que es solo fecha: un destacado
 * con `until: "2026-09-18"` tiene que seguir vivo durante todo el 18 chileno.
 * Usar `new Date().toISOString()` lo mataba a las 20:00 del 17 acá.
 */
export function hoyEnChile(now: Date = new Date()): string {
  // en-CA ya entrega "AAAA-MM-DD", no hay que rearmarlo.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Santiago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/**
 * El instante actual en Chile, como "AAAA-MM-DDTHH:mm".
 *
 * Para comparar con el `since` de site_config, que puede llevar hora ("entra el
 * 19 a las 22:00"). Ambos son strings con el mismo formato, así que la
 * comparación lexicográfica equivale a la cronológica. Un `since` sin hora
 * ("2026-09-19") queda por debajo de cualquier hora de ese mismo día, o sea
 * empieza a regir a la medianoche — que es lo que uno espera.
 */
export function ahoraEnChile(now: Date = new Date()): string {
  // hourCycle h23 y no hour12:false: este último devuelve "24:00" a medianoche
  // en algunos runtimes, y "24" rompe el orden lexicográfico contra "00".
  const hora = new Intl.DateTimeFormat("en-GB", {
    timeZone: "America/Santiago",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(now);

  return `${hoyEnChile(now)}T${hora}`;
}
