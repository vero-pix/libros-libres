import { WHATSAPP_SOPORTE_LEGIBLE } from "./soporte";

/**
 * Correo de compra confirmada al COMPRADOR. Vive acá y no dentro del webhook
 * de MercadoPago para poder verificarlo sin fingir un pago: el mismo HTML que
 * se manda en producción se puede renderizar y mandar a un buzón de prueba.
 *
 * Es el espejo del correo que recibe el vendedor. Hasta el 08-09-2026 era
 * genérico, salía de noreply@ sin replyTo —responderlo no llegaba a nadie— y
 * decía "1 libros". Una compradora pagó una entrega en persona, no supo qué
 * hacer y terminó escribiéndole a Vero por WhatsApp.
 */
export interface DatosCompraConfirmada {
  buyerName: string;
  sellerName: string;
  /** `users.id` del vendedor, para el enlace a la mensajería interna. */
  sellerId: string | null;
  /** Filas <tr> de los libros, ya armadas por quien llama. */
  itemsRows: string;
  itemCount: number;
  bundleTotal: number;
  /** `orders.courier` de la orden cabeza. */
  deliveryMethod: string;
  isCourier: boolean;
  trackingCode?: string;
  siteUrl: string;
}

export function correoCompradorCompraConfirmada(d: DatosCompraConfirmada): { subject: string; html: string } {
  const sellerFirstName = d.sellerName.split(" ")[0];
  const buyerFirstName = d.buyerName.split(" ")[0];
  const queCompro = d.itemCount > 1 ? `${d.itemCount} libros` : "un libro";
  const esteEstos = d.itemCount > 1 ? "estos libros" : "este libro";

  const bloqueEntrega = d.isCourier
    ? `
        <div style="background:#fef3c7;border:1px solid #fcd34d;border-radius:8px;padding:16px;margin:20px 0">
          <p style="margin:0 0 8px 0;font-weight:600;color:#92400e">📦 Va por ${d.deliveryMethod}</p>
          <p style="margin:0;font-size:14px;color:#78350f">${sellerFirstName} deja el paquete en la sucursal en los próximos días hábiles. Te aviso apenas tenga número de seguimiento.</p>
          ${d.trackingCode ? `<p style="margin:8px 0 0 0;font-size:14px;color:#78350f">Seguimiento: <strong style="font-family:monospace">${d.trackingCode}</strong></p>` : ""}
        </div>
      `
    : `
        <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:16px;margin:20px 0">
          <p style="margin:0 0 8px 0;font-weight:600;color:#1e40af">🤝 Entrega en persona</p>
          <p style="margin:0;font-size:14px;color:#1e3a8a">Ya le avisé a ${sellerFirstName}: te va a escribir para coordinar dónde y cuándo entregarte ${esteEstos}. <strong>No pagues nada al recibirlo</strong>, el pago ya está hecho acá.</p>
        </div>
        <p style="font-size:14px;color:#444;line-height:1.6">Si prefieres partir tú, escríbele directo:</p>
        <p style="margin:12px 0"><a href="${d.siteUrl}/mensajes?to=${d.sellerId ?? ""}" style="display:inline-block;background:#1a1a1a;color:#fbf7ef;text-decoration:none;padding:11px 18px;border-radius:8px;font-weight:600">Escribirle a ${sellerFirstName}</a></p>
        <p style="font-size:14px;color:#444;line-height:1.6">¿Pasan dos días y no te escribe? Respóndeme este correo o mándame un WhatsApp al <strong>${WHATSAPP_SOPORTE_LEGIBLE}</strong> y lo destrabo yo.</p>
      `;

  return {
    subject: d.itemCount > 1 ? `Compra confirmada: ${d.itemCount} libros — tuslibros.cl` : `Compra confirmada — tuslibros.cl`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#1a1a1a">
        <h2 style="margin:0 0 8px 0">¡Listo, pagaste! 🎉</h2>
        <p style="color:#666;margin:0 0 20px 0">Hola ${buyerFirstName}, soy Vero de tuslibros.cl. Le compraste ${queCompro} a ${d.sellerName} y el pago ya está confirmado.</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;background:#fafafa;border-radius:8px;overflow:hidden">
          ${d.itemsRows}
          <tr><td style="padding:12px;font-weight:600;border-top:2px solid #ddd">Total</td><td style="padding:12px;font-weight:600;border-top:2px solid #ddd;text-align:right">$${d.bundleTotal.toLocaleString("es-CL")}</td></tr>
        </table>
        ${bloqueEntrega}
        <div style="text-align:center;margin-top:28px">
          <a href="${d.siteUrl}/mis-pedidos" style="color:#1a1a1a;text-decoration:underline;font-size:14px">Ver mi pedido →</a>
        </div>
        <p style="color:#999;font-size:12px;text-align:center;margin-top:24px">tuslibros.cl · Gracias por comprar acá 📚</p>
      </div>
    `,
  };
}
