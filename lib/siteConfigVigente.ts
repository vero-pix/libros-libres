import { ahoraEnChile, hoyEnChile } from "@/lib/fiestasPatrias";

/**
 * Resolución de las configuraciones editoriales del home (`site_config`), que
 * tienen dos formas de fecha:
 *
 *   - `until` "AAAA-MM-DD": hasta cuándo rige. Se compara contra el día chileno,
 *     así que un `until` del 18 vale durante todo el 18 acá. Antes se comparaba
 *     contra `toISOString()`, o sea UTC, y la fila se apagaba a las 20:00 del 17.
 *   - `since` "AAAA-MM-DDTHH:mm": desde cuándo. Solo lo traen las entradas de la
 *     cola `programados`.
 *
 * La cola existe para poder dejar lista la fila que entra el 19 sin apagar la
 * que está corriendo hoy. Se escribe con `scripts/confianza.mjs --desde`.
 *
 * No hay cron: la fila programada entra sola cuando el reloj pasa su `since`,
 * dentro del margen del caché del home (5 minutos).
 */
export type ConfigProgramable = {
  since?: string | null;
  until?: string | null;
  programados?: unknown;
};

/** ¿Está viva esta entrada ahora mismo, en hora de Chile? */
function rige(c: { since?: string | null; until?: string | null }, ahora: string, hoy: string): boolean {
  if (c.since && c.since > ahora) return false;
  if (c.until && c.until < hoy) return false;
  return true;
}

/**
 * Devuelve la configuración que rige ahora: la entrada programada más reciente
 * que ya haya empezado y no haya vencido; si no hay ninguna, la configuración
 * base (siempre que ella misma esté vigente). `null` si no rige nada.
 *
 * Las entradas programadas ganan sobre la base a propósito: programar algo es
 * decir "cuando llegue esta fecha, esto reemplaza a lo que haya".
 */
export function configVigente<T extends ConfigProgramable>(valor: T | null | undefined, now = new Date()): T | null {
  if (!valor) return null;

  const ahora = ahoraEnChile(now);
  const hoy = hoyEnChile(now);

  const cola = (Array.isArray(valor.programados) ? valor.programados : []) as T[];
  const candidatas = cola
    .filter((p): p is T => Boolean(p) && typeof p === "object")
    .filter((p) => p.since && rige(p, ahora, hoy))
    .sort((a, b) => String(a.since).localeCompare(String(b.since)));

  const programada = candidatas.at(-1);
  if (programada) return programada;

  return rige(valor, ahora, hoy) ? valor : null;
}
