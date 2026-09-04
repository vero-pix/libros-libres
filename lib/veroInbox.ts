/**
 * A qué correo llegan los avisos internos y las respuestas de los correos que
 * manda el sitio (contacto, alta de usuario, resumen diario, nudges, etc.).
 *
 * Por defecto vero@tuslibros.cl. Cuando Google Workspace está caído (sept
 * 2026) ese buzón no recibe nada, aunque los correos SALEN igual por Resend:
 * la variable VERO_INBOX_EMAIL en Vercel apunta a otro buzón mientras dure el
 * corte. Los `from` no cambian: el dominio verificado en Resend es tuslibros.cl.
 */
export const VERO_INBOX = process.env.VERO_INBOX_EMAIL || "vero@tuslibros.cl";
