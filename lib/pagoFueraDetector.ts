/**
 * Detecta en un mensaje señales de que la venta se está yendo por fuera de la
 * plataforma: un teléfono chileno o las palabras transferencia / transferir /
 * efectivo. No bloquea nada: el mensaje se envía igual. Sirve para mostrar un
 * recordatorio en el chat y para registrar el evento en `messages.flagged_reason`.
 *
 * Compartido entre components/messages/MessageThread.tsx (aviso en vivo) y
 * app/api/messages/route.ts (registro), para que los dos apliquen la misma regla.
 */

// +56 9 XXXX XXXX, 56 9 XXXX XXXX, o 9 dígitos que empiezan por 9, con o sin
// espacios/guiones entre medio. Los lookarounds evitan que un número más largo
// (un RUT, un tracking de Starken) dispare la regla.
const TELEFONO_CL = /(?<!\d)(?:\+?56[\s-]?)?9(?:[\s-]?\d){8}(?!\d)/;

const PALABRAS_PAGO_FUERA = /\b(transferencia|transferir|transfiero|transfieres|efectivo)\b/i;

export type MotivoPagoFuera = "telefono" | "transferencia" | "efectivo";

export function detectarPagoFuera(texto: string): MotivoPagoFuera | null {
  if (!texto) return null;
  if (TELEFONO_CL.test(texto)) return "telefono";
  const m = texto.match(PALABRAS_PAGO_FUERA);
  if (!m) return null;
  return m[1].toLowerCase().startsWith("efectivo") ? "efectivo" : "transferencia";
}
