/**
 * A qué correo llegan los avisos internos y las respuestas de los correos que
 * manda el sitio (contacto, alta de usuario, resumen diario, nudges, etc.).
 *
 * El buzón es **hola@tuslibros.cl**, que es la cuenta de Google Workspace que
 * Vero lee. No vero@tuslibros.cl: eso se probó el 18-09-2026 mandando un correo
 * a cada uno por Resend, y llegó solo el de hola@. Si alguna vez hubo
 * redirección de vero@ hacia allá, hoy no funciona.
 *
 * Los `from` no cambian: el dominio verificado en Resend es tuslibros.cl.
 *
 * POR QUÉ ESTO GRITA (08-09-2026): la variable VERO_INBOX_EMAIL estuvo CREADA
 * PERO VACÍA en producción desde el 4 de septiembre. En el panel de Vercel se
 * veía presente y "Encrypted", así que nadie sospechó; pero `"" || default`
 * caía en el buzón suspendido, y cinco días de respuestas de vendedores y
 * compradores se perdieron sin un solo error en los logs. Es el mismo modo de
 * falla del TELEGRAM_BOT_TOKEN vacío del 29 de agosto.
 *
 * De ahí la distinción que hace este archivo:
 *   - variable AUSENTE  → estado normal desde que Workspace volvió
 *     (18-09-2026). Se usa hola@tuslibros.cl, sin ruido.
 *   - variable PRESENTE → se respeta; sirve para desviar el buzón sin tocar
 *     código si vuelve a caerse algo.
 *   - variable VACÍA o con basura → siempre un error de configuración. Grita
 *     en los logs y `npm run build` falla (ver scripts/check-env.mjs).
 */

const bruto = process.env.VERO_INBOX_EMAIL;
const definida = bruto !== undefined;
const valor = (bruto ?? "").trim();

/** La cuenta real de Workspace. Verificada el 18-09-2026. */
const BUZON = "hola@tuslibros.cl";

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
      `(valor entre comillas: "${valor}"). Los reply-to del sitio caen en ` +
      `${BUZON}. Arreglar o borrar la variable: vercel env rm VERO_INBOX_EMAIL production`
  );
}

export const VERO_INBOX = estado === "ok" ? valor : BUZON;
