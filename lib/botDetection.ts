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

/**
 * Detección de emails-bot en newsletter_subscribers.
 *
 * Contexto (1 jul 2026): el formulario público de suscripción no tenía protección,
 * así que bots lo llenaron con ~116 emails basura: dominios de negocios extranjeros al
 * azar (@lakeshoredesignandbuild.com, @a7goldinvest.ru…), SMS-gateways
 * (numero@txt.att.net), desechables (@yopmail) y direcciones role (info@, admin@).
 * Ningún lector chileno real usa eso; usan gmail/hotmail/outlook/yahoo/icloud o un .cl.
 *
 * Heurística: es real si el dominio es un proveedor de correo de consumo conocido, o
 * termina en .cl, o es un correo universitario chileno. Cualquier otro dominio en un
 * contexto de "suscriptor de newsletter chileno" es casi siempre un bot. Conservadora
 * en el sentido correcto para este caso: prioriza no enviarle a basura por sobre
 * conservar algún suscriptor de dominio raro (que igual puede re-suscribirse).
 */
const CONSUMER_EMAIL = /@(gmail|hotmail|outlook|live|yahoo|ymail|icloud|me|mac|proton|protonmail|pm|gmx|fastmail|aol|msn|zoho|mail)\.(com|es|cl|net|me)$/i;
const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function isLikelyBotEmail(email: string | null | undefined): boolean {
  const e = (email ?? "").trim().toLowerCase();
  if (!e || !EMAIL_SHAPE.test(e)) return true; // sin forma de email → basura
  const domain = "@" + (e.split("@")[1] ?? "");
  // Legítimos: proveedor de consumo, .cl, o universidad chilena
  if (CONSUMER_EMAIL.test(e)) return false;
  if (/\.cl$/i.test(e)) return false;
  if (/\.(uchile|uc|usach|udec|duoc|puc)\.cl$/i.test(domain)) return false;
  // Resto (dominios no-consumidor extranjeros, SMS-gateways, role, desechables) → bot
  return true;
}
