/**
 * Contacto de soporte de tuslibros.cl (Vero). Es el ÚNICO lugar donde vive el
 * número: nunca escribirlo a mano en páginas, correos o componentes.
 *
 * No confundir con el WhatsApp de cada vendedor, que pasa por
 * `mostrarWhatsAppVendedor()` de lib/whatsapp-policy.ts y tiene restricciones.
 * El de soporte no las tiene.
 *
 * El correo de soporte es `VERO_INBOX` de lib/veroInbox.ts.
 */
export const WHATSAPP_SOPORTE = "56994583067";

/** Teléfono de soporte como lo lee una persona. */
export const WHATSAPP_SOPORTE_LEGIBLE = "+56 9 9458 3067";

/** Enlace wa.me al soporte, con texto prellenado opcional. */
export function waSoporte(texto?: string): string {
  const base = `https://wa.me/${WHATSAPP_SOPORTE}`;
  return texto ? `${base}?text=${encodeURIComponent(texto)}` : base;
}
