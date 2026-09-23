import { escapeHtml } from "./notifications";
import { clp, PLAZO_PAGO_ACEPTADA_HORAS, PLAZO_RESPUESTA_DIAS } from "./offers";

/**
 * Correos de las ofertas de precio (lib/offers.ts). Un correo por evento y a
 * una sola persona: nunca fan-out (ver la cuota de Resend en lib/email.ts).
 */

const SITE = "https://tuslibros.cl";

function marco(contenido: string): string {
  return `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#1a1a1a">
      ${contenido}
      <p style="color:#999;font-size:12px;text-align:center;margin-top:28px">tuslibros.cl · libros usados entre personas 📚</p>
    </div>
  `;
}

function boton(href: string, texto: string): string {
  return `<p style="margin:20px 0"><a href="${href}" style="display:inline-block;background:#1a1a1a;color:#fbf7ef;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600">${texto}</a></p>`;
}

function primerNombre(n: string | null | undefined, fallback: string): string {
  return escapeHtml((n ?? "").trim().split(/\s+/)[0] || fallback);
}

export interface DatosOferta {
  titulo: string;
  monto: number;
  precioPublicado: number;
  compradorNombre: string | null;
  vendedorNombre: string | null;
  conversationId: string;
  listingId: string;
  mensaje?: string | null;
}

/** Al vendedor: le llegó una oferta. */
export function correoOfertaRecibida(d: DatosOferta): { subject: string; html: string } {
  const comprador = primerNombre(d.compradorNombre, "Alguien");
  const vendedor = primerNombre(d.vendedorNombre, "");
  const titulo = escapeHtml(d.titulo);
  const nota = d.mensaje?.trim()
    ? `<div style="background:#f5f5f4;padding:14px 16px;border-radius:8px;margin:16px 0;color:#374151;font-size:14px">“${escapeHtml(d.mensaje.trim().slice(0, 300))}”</div>`
    : "";
  return {
    subject: `${comprador} te ofrece ${clp(d.monto)} por "${d.titulo}"`,
    html: marco(`
      <h2 style="margin:0 0 8px 0">Te hicieron una oferta 🤝</h2>
      <p style="color:#444;line-height:1.6">Hola${vendedor ? ` ${vendedor}` : ""}, soy Vero de tuslibros.cl. ${comprador} te ofrece <strong>${clp(d.monto)}</strong> por <em>${titulo}</em>, que tienes publicado a ${clp(d.precioPublicado)}.</p>
      ${nota}
      <p style="color:#444;line-height:1.6">Tú decides: la aceptas, la rechazas o le propones otro precio. Si no respondes en ${PLAZO_RESPUESTA_DIAS} días, la oferta vence sola y el libro sigue a su precio.</p>
      ${boton(`${SITE}/mensajes/${d.conversationId}`, "Ver la oferta")}
    `),
  };
}

/** Al comprador: el vendedor aceptó. */
export function correoOfertaAceptada(d: DatosOferta & { puedePagarEnSitio: boolean }): { subject: string; html: string } {
  const comprador = primerNombre(d.compradorNombre, "");
  const vendedor = primerNombre(d.vendedorNombre, "El vendedor");
  const titulo = escapeHtml(d.titulo);
  const cierre = d.puedePagarEnSitio
    ? `<p style="color:#444;line-height:1.6">El precio acordado te queda reservado por ${PLAZO_PAGO_ACEPTADA_HORAS} horas. Ojo: el libro sigue publicado, así que si alguien lo compra antes, se lo lleva.</p>
       ${boton(`${SITE}/checkout/${d.listingId}`, `Comprar a ${clp(d.monto)}`)}`
    : `<p style="color:#444;line-height:1.6">${vendedor} coordina el pago y la entrega directo contigo. Escríbele por la mensajería para cerrar el trato.</p>
       ${boton(`${SITE}/mensajes/${d.conversationId}`, `Escribirle a ${vendedor}`)}`;
  return {
    subject: `¡${vendedor} aceptó tu oferta por "${d.titulo}"!`,
    html: marco(`
      <h2 style="margin:0 0 8px 0">¡Aceptaron tu oferta! 🎉</h2>
      <p style="color:#444;line-height:1.6">Hola${comprador ? ` ${comprador}` : ""}, buenas noticias: ${vendedor} aceptó tus <strong>${clp(d.monto)}</strong> por <em>${titulo}</em> (estaba a ${clp(d.precioPublicado)}).</p>
      ${cierre}
    `),
  };
}

/** Al comprador: el vendedor no aceptó. Sin tono de portazo. */
export function correoOfertaRechazada(d: DatosOferta): { subject: string; html: string } {
  const comprador = primerNombre(d.compradorNombre, "");
  const vendedor = primerNombre(d.vendedorNombre, "El vendedor");
  const titulo = escapeHtml(d.titulo);
  return {
    subject: `Tu oferta por "${d.titulo}"`,
    html: marco(`
      <h2 style="margin:0 0 8px 0">Esta vez no pudo ser</h2>
      <p style="color:#444;line-height:1.6">Hola${comprador ? ` ${comprador}` : ""}, ${vendedor} no aceptó los ${clp(d.monto)} por <em>${titulo}</em>. El libro sigue disponible a ${clp(d.precioPublicado)}.</p>
      <p style="color:#444;line-height:1.6">¿Quedaste con ganas? Puedes escribirle: a veces un precio intermedio sí calza.</p>
      ${boton(`${SITE}/mensajes/${d.conversationId}`, `Escribirle a ${vendedor}`)}
    `),
  };
}

/** A la otra parte: le hicieron una contraoferta. */
export function correoContraoferta(
  d: DatosOferta & { montoAnterior: number; deVendedor: boolean }
): { subject: string; html: string } {
  const titulo = escapeHtml(d.titulo);
  const de = d.deVendedor ? primerNombre(d.vendedorNombre, "El vendedor") : primerNombre(d.compradorNombre, "El comprador");
  const para = d.deVendedor ? primerNombre(d.compradorNombre, "") : primerNombre(d.vendedorNombre, "");
  const contexto = d.deVendedor
    ? `Ofreciste ${clp(d.montoAnterior)} por <em>${titulo}</em> y ${de} te propone <strong>${clp(d.monto)}</strong> (estaba a ${clp(d.precioPublicado)}).`
    : `Le propusiste ${clp(d.montoAnterior)} por <em>${titulo}</em> y ${de} te contesta con <strong>${clp(d.monto)}</strong>.`;
  return {
    subject: `${de} te propone ${clp(d.monto)} por "${d.titulo}"`,
    html: marco(`
      <h2 style="margin:0 0 8px 0">Te hicieron una contraoferta ↔️</h2>
      <p style="color:#444;line-height:1.6">Hola${para ? ` ${para}` : ""}, soy Vero de tuslibros.cl. ${contexto}</p>
      <p style="color:#444;line-height:1.6">La puedes aceptar, rechazar o proponer otro número. Si no respondes en ${PLAZO_RESPUESTA_DIAS} días, vence sola.</p>
      ${boton(`${SITE}/mensajes/${d.conversationId}`, "Ver la contraoferta")}
    `),
  };
}

/** Al vendedor: el comprador respondió su contraoferta. */
export function correoRespuestaDelComprador(
  d: DatosOferta & { aceptada: boolean; puedePagarEnSitio: boolean }
): { subject: string; html: string } {
  const comprador = primerNombre(d.compradorNombre, "El comprador");
  const vendedor = primerNombre(d.vendedorNombre, "");
  const titulo = escapeHtml(d.titulo);
  if (!d.aceptada) {
    return {
      subject: `${comprador} no aceptó tu contraoferta por "${d.titulo}"`,
      html: marco(`
        <h2 style="margin:0 0 8px 0">Esta vez no calzó</h2>
        <p style="color:#444;line-height:1.6">Hola${vendedor ? ` ${vendedor}` : ""}, ${comprador} no aceptó los ${clp(d.monto)} por <em>${titulo}</em>. El libro sigue publicado a ${clp(d.precioPublicado)}.</p>
        ${boton(`${SITE}/mensajes/${d.conversationId}`, "Ver la conversación")}
      `),
    };
  }
  const cierre = d.puedePagarEnSitio
    ? `Tiene ${PLAZO_PAGO_ACEPTADA_HORAS} horas para pagar ese precio. Cuando pague, la venta te llega como siempre a Mis Ventas.`
    : `Coordinen el pago y la entrega por la mensajería.`;
  return {
    subject: `¡${comprador} aceptó tu contraoferta por "${d.titulo}"!`,
    html: marco(`
      <h2 style="margin:0 0 8px 0">¡Aceptaron tu contraoferta! 🎉</h2>
      <p style="color:#444;line-height:1.6">Hola${vendedor ? ` ${vendedor}` : ""}, ${comprador} aceptó <strong>${clp(d.monto)}</strong> por <em>${titulo}</em>.</p>
      <p style="color:#444;line-height:1.6">${cierre}</p>
      ${boton(`${SITE}/mensajes/${d.conversationId}`, "Ver la conversación")}
    `),
  };
}
