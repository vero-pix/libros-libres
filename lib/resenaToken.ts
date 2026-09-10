import crypto from "crypto";

/**
 * Token para dejar una reseña sin tener que iniciar sesión.
 *
 * El sitio tenía el sistema de reseñas desde el 08-09-2026 y cero reseñas. El
 * link del correo llevaba a `/resena/{orderId}`, que redirige a login: para
 * dejar dos líneas sobre un libro había que acordarse de la contraseña. Ese es
 * el tipo de fricción que no se recupera — el que no reseña en ese momento no
 * vuelve después.
 *
 * El token es un HMAC del `orderId`, así que no hay nada que guardar en la
 * base: se verifica recalculándolo. Va en el correo del comprador y solo sirve
 * para reseñar ESA orden. Quien tenga el link puede reseñar esa compra, que es
 * exactamente el trato que hace cualquier sitio con un "califica tu pedido" por
 * correo.
 */

/** Se firma con un secreto de servidor que ya existe; no hay que configurar nada nuevo. */
function secreto(): string {
  const s = process.env.CRON_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!s) throw new Error("Sin secreto para firmar el token de reseña");
  return s;
}

export function firmarTokenResena(orderId: string): string {
  return crypto
    .createHmac("sha256", secreto())
    .update(`resena:${orderId}`)
    .digest("base64url")
    .slice(0, 32);
}

/**
 * Comparación en tiempo constante: con `===` el tiempo de respuesta filtra
 * cuántos caracteres calzaron.
 */
export function verificarTokenResena(orderId: string, token: string | null | undefined): boolean {
  if (!token) return false;
  try {
    const esperado = firmarTokenResena(orderId);
    const a = Buffer.from(esperado);
    const b = Buffer.from(token);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/** URL completa que va en el correo. */
export function urlResena(orderId: string, site = "https://tuslibros.cl"): string {
  return `${site}/resena/${orderId}?t=${firmarTokenResena(orderId)}`;
}
