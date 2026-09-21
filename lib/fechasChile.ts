/**
 * Fechas en hora de Chile.
 *
 * El servidor corre en UTC: un `new Date().getMonth()` a secas adelanta el
 * cambio de día en la noche chilena. Todo lo que dependa del calendario pasa
 * por acá y se resuelve en el servidor, para que no haya mismatch de
 * hidratación con el reloj del navegador.
 *
 * El archivo se llamaba `fiestasPatrias.ts` por la chupalla del logo, que se
 * retiró del sitio el 21-09-2026. Lo que queda es calendario, no adorno.
 */

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

/**
 * Ventana de primavera para el color estacional de la portada.
 *
 * Arranca el 20-09 y cierra el 20-12, cuando entra el verano. Fuera de esa
 * ventana el hero vuelve solo a la paleta de siempre: no hay que acordarse de
 * nada en diciembre.
 *
 * Se resuelve en el servidor y baja como prop hasta el hero, que es un
 * componente de cliente: si lo calculara el navegador habría mismatch de
 * hidratación en el cambio de estación.
 */
export function esPrimavera(now: Date = new Date()): boolean {
  const [mes, dia] = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Santiago",
    month: "2-digit",
    day: "2-digit",
  })
    .format(now)
    .split("-")
    .map(Number);

  if (mes === 9) return dia >= 20;
  if (mes === 12) return dia <= 20;
  return mes === 10 || mes === 11;
}
