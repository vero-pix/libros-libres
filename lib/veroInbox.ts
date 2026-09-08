/**
 * A qué correo llegan los avisos internos y las respuestas de los correos que
 * manda el sitio (contacto, alta de usuario, resumen diario, nudges, etc.).
 *
 * Por defecto vero@tuslibros.cl. Cuando Google Workspace está caído (sept
 * 2026) ese buzón no recibe nada, aunque los correos SALEN igual por Resend:
 * la variable VERO_INBOX_EMAIL en Vercel apunta a otro buzón mientras dure el
 * corte. Los `from` no cambian: el dominio verificado en Resend es tuslibros.cl.
 *
 * POR QUÉ ESTO GRITA (08-09-2026): la variable estuvo CREADA PERO VACÍA en
 * producción desde el 4 de septiembre. En el panel de Vercel se veía presente
 * y "Encrypted", así que nadie sospechó; pero `"" || "vero@tuslibros.cl"` cae
 * al buzón suspendido, y cinco días de respuestas de vendedores y compradores
 * se perdieron sin un solo error en los logs. Es el mismo modo de falla del
 * TELEGRAM_BOT_TOKEN vacío del 29 de agosto.
 *
 * De ahí la distinción que hace este archivo:
 *   - variable AUSENTE  → estado esperado cuando Workspace vuelva y Vero la
 *     borre. Se usa vero@tuslibros.cl y se avisa una vez, sin romper nada.
 *   - variable VACÍA o con basura → siempre un error de configuración. Grita
 *     en los logs y `npm run build` falla (ver scripts/check-env.mjs).
 */

const bruto = process.env.VERO_INBOX_EMAIL;
const definida = bruto !== undefined;
const valor = (bruto ?? "").trim();
const CAIDA = "vero@tuslibros.cl";

/** Un correo utilizable, no una cadena que solo lo parece. */
export function esCorreoUsable(v: string | undefined): boolean {
  return !!v && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

/**
 * Qué pasa con VERO_INBOX_EMAIL, en una palabra. La usa el chequeo de build
 * y sirve para no repetir esta lógica en ningún otro lado.
 */
export function estadoVeroInbox(): "ok" | "ausente" | "invalida" {
  if (!definida) return "ausente";
  return esCorreoUsable(valor) ? "ok" : "invalida";
}

const estado = estadoVeroInbox();

if (estado === "invalida") {
  // El caso que costó cinco días de correos. Nunca en silencio.
  console.error(
    `[VERO_INBOX] VERO_INBOX_EMAIL está definida pero no es un correo usable ` +
      `(valor entre comillas: "${valor}"). Los reply-to del sitio van a caer en ` +
      `${CAIDA}, que está suspendida, y las respuestas se pierden. ` +
      `Arreglar con: vercel env add VERO_INBOX_EMAIL production`
  );
} else if (estado === "ausente" && process.env.NODE_ENV === "production") {
  console.warn(
    `[VERO_INBOX] VERO_INBOX_EMAIL no está definida; se usa ${CAIDA}. ` +
      `Correcto solo si Google Workspace ya volvió y ese buzón recibe.`
  );
}

export const VERO_INBOX = estado === "ok" ? valor : CAIDA;
