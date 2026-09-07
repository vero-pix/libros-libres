import { VERO_INBOX } from "./veroInbox";
import { nombreCourier, urlSeguimiento } from "./courier-tracking";

export { nombreCourier, urlSeguimiento };

/**
 * Correos del worker de Shipit (fase 1, paso f). Textos aprobados por Vero el
 * 07-09-2026 (plantillas 5b y 5c de docs/MENSAJES-ONBOARDING-VENDEDOR.md,
 * adaptadas a dropoff). Sin adjuntos ni URLs de Shipit ni del bucket: la
 * etiqueta se descarga desde /mis-ventas con sesión y URL firmada (D3).
 */

export const REMITENTE_VERO = "Vero de tuslibros.cl <vero@tuslibros.cl>";
export const REPLY_TO_VERO = VERO_INBOX;

const SITE = "https://tuslibros.cl";

function esc(s: string | null | undefined): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function primerNombre(nombre: string | null | undefined, fallback: string): string {
  const n = (nombre ?? "").trim().split(/\s+/)[0];
  return n || fallback;
}

/** "Opus nigrum" o "tus 3 libros" + lista. */
function queLibros(titulos: string[]): { corto: string; lista: string } {
  if (titulos.length <= 1) {
    return { corto: `<strong>${esc(titulos[0] ?? "tu libro")}</strong>`, lista: "" };
  }
  return {
    corto: `<strong>tus ${titulos.length} libros</strong>`,
    lista: `<ul style="margin:8px 0 0 18px;padding:0">${titulos.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>`,
  };
}

const boton = (href: string, texto: string) =>
  `<p style="margin:20px 0"><a href="${href}" style="display:inline-block;background:#1a1a1a;color:#fbf7ef;text-decoration:none;padding:11px 18px;border-radius:8px;font-weight:600">${esc(texto)}</a></p>`;

const marco = (cuerpo: string) =>
  `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#1a1a1a;line-height:1.5">${cuerpo}<p style="margin-top:28px">Vero<br/><span style="color:#777">tuslibros.cl</span></p></div>`;

export interface DatosCorreoEtiqueta {
  vendedorNombre: string | null;
  compradorNombre: string | null;
  titulos: string[];
  courier: string | null;
  tracking: string;
  comunaDestino: string;
  comunaOrigen: string;
  direccionEntrega: string;
  /** Vendedor en la Región Metropolitana: puede pedir retiro a domicilio desde Mis Ventas. */
  enRM?: boolean;
}

/** Correo 1 · al vendedor cuando la etiqueta está lista (label_ready). */
export function correoVendedorEtiqueta(d: DatosCorreoEtiqueta): { subject: string; html: string } {
  const courier = nombreCourier(d.courier);
  const libros = queLibros(d.titulos);
  const asuntoQue = d.titulos.length > 1 ? `${d.titulos.length} libros` : d.titulos[0] ?? "tu libro";
  const subject = `Tu etiqueta está lista — ${asuntoQue} para ${d.compradorNombre ?? "tu comprador"}`;
  const html = marco(`
    <p>Hola ${esc(primerNombre(d.vendedorNombre, "vendedor"))}!</p>
    <p>Ya está la etiqueta del envío de ${libros.corto} para ${esc(d.compradorNombre ?? "tu comprador")}, que va por <strong>${esc(courier)}</strong> a ${esc(d.comunaDestino)}. Número de seguimiento: <strong>${esc(d.tracking)}</strong>.${libros.lista}</p>
    <p>Te explico completo cómo funciona el despacho, para que lo tengas claro y no dependas de mí:</p>
    <ol style="padding-left:20px">
      <li>Empaca el libro en sobre acolchado o caja chica. Si son varios libros del mismo comprador, van juntos en un paquete.</li>
      <li>Descarga la etiqueta desde Mis Ventas, imprímela y pégala en el paquete. Si no tienes impresora, escribe en el paquete, bien claro, el nombre del comprador y el número de seguimiento.</li>
      <li>Lleva el paquete a la <strong>sucursal ${esc(courier)} más cercana</strong>, idealmente hoy o mañana, y entrégalo en el mesón con la etiqueta puesta. No hay que agendar nada ni esperar a nadie.</li>
      <li>Pide el comprobante de recepción y guárdalo hasta que el comprador reciba el libro.</li>
      <li>No le pagas nada al courier: el envío ya lo pagó el comprador.</li>
    </ol>
    <p>El seguimiento empieza a moverse cuando la sucursal escanea el paquete; hasta entonces aparece sin novedad, es normal.</p>
    ${boton(`${SITE}/mis-ventas`, "Ver mi venta y descargar la etiqueta")}
    ${d.enRM ? `<p>Si prefieres que pasen a buscar el paquete a tu casa, en Mis Ventas hay un botón "Pedir retiro a domicilio". Lo coordino yo con Shipit y te aviso la ventana.</p>` : ""}
    <p>Si en la sucursal te ponen algún problema con la etiqueta, escríbele directo a Shipit por WhatsApp al +56 9 3230 2514 (de 9:00 a 18:00) con el número de seguimiento. Y a mí me cuentas después.</p>
    <p>Para hablar con tu comprador, en Mis Ventas hay un botón "Escribir" al lado de su nombre. Y revisa Mis Ventas cada uno o dos días, aunque no te llegue correo.</p>
  `);
  return { subject, html };
}

/** Correo 2 · al comprador con el número de seguimiento. */
export function correoCompradorTracking(d: DatosCorreoEtiqueta): { subject: string; html: string } {
  const courier = nombreCourier(d.courier);
  const libros = queLibros(d.titulos);
  const asuntoQue = d.titulos.length > 1 ? `tus ${d.titulos.length} libros` : d.titulos[0] ?? "tu libro";
  const subject = `Tu libro ya tiene número de seguimiento — ${asuntoQue}`;
  const seguimiento = urlSeguimiento(d.courier, d.tracking);
  const html = marco(`
    <p>Hola ${esc(primerNombre(d.compradorNombre, ""))}! Soy Vero de tuslibros.cl.</p>
    <p>${libros.corto.replace(/^<strong>tus/, "<strong>Tus")} ${d.titulos.length > 1 ? "salen" : "sale"} por <strong>${esc(courier)}</strong> desde ${esc(d.comunaOrigen)} y ${d.titulos.length > 1 ? "llegan" : "llega"} a ${esc(d.direccionEntrega)}. Una vez que el vendedor lo entrega en la sucursal, ${esc(courier)} demora entre 1 y 3 días hábiles.${libros.lista}</p>
    <p>Número de seguimiento: <strong>${esc(d.tracking)}</strong></p>
    ${seguimiento ? boton(seguimiento, `Seguir el envío en ${courier}`) : ""}
    <p>También lo ves en Mis Pedidos: <a href="${SITE}/mis-pedidos">${SITE}/mis-pedidos</a></p>
    <p>El vendedor deja el paquete en la sucursal del courier en los próximos dos días hábiles, así que el seguimiento puede tardar un poco en mostrar movimiento. Si pasan tres días hábiles sin novedad, me escribes y lo reviso con Shipit.</p>
    <p>El pago ya está hecho: no tienes que pagar nada al recibir.</p>
    <p>Cualquier cosa, respóndeme a este correo.</p>
  `);
  return { subject, html };
}
