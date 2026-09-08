/**
 * Correo "¿Cómo llegó {título}?" al comprador cuando el pedido se marca como
 * entregado. Texto de Vero, aprobado el 07-09-2026. Un botón principal (la
 * reseña del vendedor) y el del libro como enlace secundario.
 */

const SITE = "https://tuslibros.cl";

function esc(s: string | null | undefined): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export interface DatosCorreoResena {
  compradorNombre: string | null;
  vendedorNombre: string | null;
  /** Título del libro, o "tus N libros" si el bundle trae varios. */
  titulo: string;
  /** Ruta de la ficha (libroUrl), sin dominio. */
  fichaPath: string;
  /** Orden cabeza del bundle. El botón principal lleva a /resena/{orderId}. */
  orderId: string;
}

export function correoResena(d: DatosCorreoResena): { subject: string; html: string } {
  const nombre = (d.compradorNombre ?? "").trim().split(/\s+/)[0] || "";
  const vendedor = d.vendedorNombre?.trim() || "el vendedor";
  const ficha = `${SITE}${d.fichaPath}`;
  // Antes el botón llevaba a la ficha con el ancla #resena-vendedor: ahí el
  // comprador caía en medio de una página de venta y el formulario recién
  // aparecía después de tres consultas del cliente. /resena/{orderId} resuelve
  // el pedido en el servidor y pinta las estrellas de una.
  const resena = `${SITE}/resena/${d.orderId}`;
  const subject = `¿Cómo llegó ${d.titulo}?`;
  const html = `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#1a1a1a;line-height:1.5">
      <p>Hola ${esc(nombre)}!</p>
      <p>Espero que <strong>${esc(d.titulo)}</strong> haya llegado bien y que sea lo que buscabas.</p>
      <p>Una cosa te pido, y te toma un minuto: cuéntale a los demás cómo te fue con ${esc(vendedor)}. Es lo que hace que otra persona se anime a comprarle, y es lo que los vendedores más valoran.</p>
      <p style="margin:20px 0"><a href="${resena}" style="display:inline-block;background:#1a1a1a;color:#fbf7ef;text-decoration:none;padding:11px 18px;border-radius:8px;font-weight:600">Contar cómo me fue con ${esc(vendedor)}</a></p>
      <p>Y si quieres, también puedes dejar unas líneas sobre el libro para quien lo esté buscando: <a href="${ficha}#resenas-libro">Reseñar el libro</a></p>
      <p>Gracias por comprar de segunda mano. Cada libro que circula es uno que no se imprime de nuevo.</p>
      <p style="margin-top:28px">Vero<br/><span style="color:#777">tuslibros.cl</span></p>
    </div>`;
  return { subject, html };
}
