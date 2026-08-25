/**
 * Política del WhatsApp del vendedor — experimento abierto el 25 ago 2026.
 *
 * El problema que ataca: en agosto se vendieron 128 libros por $1,72M y 122 de
 * ellos eran de vendedores que YA tenían MercadoPago conectado. Aun así, 119 se
 * cerraron fuera del sitio y la comisión del mes fue $1.440 en vez de ~$131.000.
 * Teniendo el botón de comprar al lado, la gente igual se iba por WhatsApp: una
 * puerta gratis justo al lado de la caja.
 *
 * Regla: si el vendedor puede cobrar por la plataforma, su WhatsApp no compite
 * con el botón de comprar. Las dudas se canalizan por la mensajería interna,
 * que sí le avisa por correo (`app/api/messages/route.ts`).
 *
 * Si NO tiene MercadoPago, el WhatsApp es la única vía y se muestra siempre —
 * incluso con despacho por courier. No dejar nunca una pantalla sin salida.
 *
 * PARA REVERTIR EL EXPERIMENTO: que esta función devuelva siempre `true`.
 * Medir antes de decidir: comisión cobrada y libros marcados como vendidos.
 */
export function mostrarWhatsAppVendedor(sellerHasMP: boolean): boolean {
  return !sellerHasMP;
}
