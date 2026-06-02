/**
 * Detección de cuentas spam de registro automático.
 *
 * Contexto (1 jun 2026): la confirmación de email está en autoconfirm, así que
 * bots llaman la API pública de signup de Supabase (anon key visible en el
 * navegador) y crean usuarios confirmados al instante. Su firma constante es
 * un `full_name` aleatorio tipo "oxsvaPNjhVyLYGiLeT" — mezcla de mayúsculas y
 * minúsculas sin espacios, sin parecido a un nombre real.
 *
 * Esta heurística es DELIBERADAMENTE conservadora: solo marca un nombre como
 * generado por bot cuando junta varias señales. El borrado real (cron) además
 * exige cero actividad (sin listings/orders/teléfono/ciudad), así que un falso
 * positivo tendría que ser un humano con nombre aleatorio Y sin ningún dato.
 */
export function looksLikeBotName(name: string | null | undefined): boolean {
  const fn = (name ?? "").trim();
  if (fn.length < 12) return false;        // nombres reales cortos quedan fuera
  if (fn.includes(" ")) return false;       // un nombre real casi siempre tiene espacio
  if (!/[a-z]/.test(fn) || !/[A-Z]/.test(fn)) return false; // necesita ambos casos
  if (/[^A-Za-z]/.test(fn)) return false;   // los aleatorios observados son solo letras

  // Transiciones minúscula→mayúscula: un nombre pegado tipo "MariaJose" tiene 1;
  // un string aleatorio tipo "oxsvaPNjhVyLYGiLeT" tiene varias.
  let caseFlips = 0;
  for (let i = 1; i < fn.length; i++) {
    const prevLower = fn[i - 1] >= "a" && fn[i - 1] <= "z";
    const currUpper = fn[i] >= "A" && fn[i] <= "Z";
    if (prevLower && currUpper) caseFlips++;
  }
  return caseFlips >= 3;
}
