import type { MisDatos } from "@/lib/misDatos";

/**
 * "Descargar mis datos" en formato legible: un HTML autocontenido (CSS en
 * línea, sin scripts ni recursos externos) que se abre con doble clic en
 * cualquier computador o celular y se imprime o guarda como PDF desde el
 * navegador. Recibe exactamente lo mismo que el JSON (`recopilarMisDatos`).
 *
 * TODO lo que viene de la base pasa por `esc()`: mensajes, títulos y nombres
 * los escribió alguien, y un `<script>` en un mensaje tiene que verse como
 * texto, no ejecutarse.
 */

type Fila = Record<string, unknown>;

// ── utilidades ──────────────────────────────────────────────────────────────

export function esc(v: unknown): string {
  return String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const VACIO = '<span class="nd">—</span>';

/** Texto escapado, o una raya si no hay nada. */
function t(v: unknown): string {
  if (v === null || v === undefined || v === "") return VACIO;
  return esc(v);
}

/** Texto largo (mensajes, comentarios): escapado y con sus saltos de línea. */
function largo(v: unknown): string {
  if (v === null || v === undefined || v === "") return VACIO;
  return esc(v).replace(/\r?\n/g, "<br>");
}

function partesChile(v: unknown) {
  if (typeof v !== "string" && !(v instanceof Date)) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  const p: Record<string, string> = {};
  for (const x of new Intl.DateTimeFormat("es-CL", {
    timeZone: "America/Santiago",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(d)) {
    p[x.type] = x.value;
  }
  return p;
}

/** dd-mm-aaaa en hora de Chile. */
export function fecha(v: unknown): string {
  const p = partesChile(v);
  return p ? `${p.day}-${p.month}-${p.year}` : VACIO;
}

/** dd-mm-aaaa hh:mm en hora de Chile. */
export function fechaHora(v: unknown): string {
  const p = partesChile(v);
  return p ? `${p.day}-${p.month}-${p.year} ${p.hour}:${p.minute}` : VACIO;
}

/** $12.990 */
export function pesos(v: unknown): string {
  const n = typeof v === "number" ? v : typeof v === "string" && v.trim() !== "" ? Number(v) : NaN;
  if (!Number.isFinite(n)) return VACIO;
  return "$" + Math.round(n).toLocaleString("es-CL");
}

function siNo(v: unknown): string {
  if (v === true) return "Sí";
  if (v === false) return "No";
  return VACIO;
}

function traducir(mapa: Record<string, string>, v: unknown): string {
  if (v === null || v === undefined || v === "") return VACIO;
  return esc(mapa[String(v)] ?? v);
}

function estrellas(v: unknown): string {
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0) return VACIO;
  const k = Math.max(0, Math.min(5, Math.round(n)));
  return `<span class="est" aria-label="${k} de 5">${"★".repeat(k)}${"☆".repeat(5 - k)}</span>`;
}

function libroTxt(l: unknown): string {
  const b = l as { title?: string | null; author?: string | null } | null;
  if (!b || (!b.title && !b.author)) return VACIO;
  return `<strong>${t(b.title)}</strong>${b.author ? `<br><span class="sub">${esc(b.author)}</span>` : ""}`;
}

function usuarioTxt(u: unknown): string {
  return u ? `@${esc(u)}` : '<span class="nd">(cuenta cerrada)</span>';
}

/** Puntos de retiro y otras listas que vienen como JSON. */
function puntoTxt(p: unknown): string {
  if (p === null || p === undefined) return "";
  if (typeof p !== "object") return esc(p);
  const o = p as Fila;
  const partes = [o.label, o.address, o.direccion, o.comuna]
    .filter((x) => typeof x === "string" && x.trim() !== "")
    .map((x) => esc(x));
  if (partes.length) return Array.from(new Set(partes)).join(", ");
  return esc(
    Object.values(o)
      .filter((x) => typeof x === "string" || typeof x === "number")
      .join(", ")
  );
}

// ── traducciones ────────────────────────────────────────────────────────────

const ESTADO_PEDIDO: Record<string, string> = {
  pending: "Pendiente de pago",
  paid: "Pagado",
  shipped: "Enviado",
  delivered: "Entregado",
  cancelled: "Cancelado",
  canceled: "Cancelado",
  expired: "Caducado",
  refunded: "Reembolsado",
};

const ESTADO_PUBLICACION: Record<string, string> = {
  active: "A la venta",
  paused: "Pausada",
  completed: "Vendida",
  rented: "Arrendada",
  deleted: "Eliminada",
};

const ESTADO_OFERTA: Record<string, string> = {
  pending: "Esperando respuesta",
  accepted: "Aceptada",
  rejected: "Rechazada",
  expired: "Venció",
  used: "Usada en una compra",
  countered: "Contraofertada",
};

const ESTADO_RESENA_LIBRO: Record<string, string> = {
  published: "Publicada",
  hidden: "Oculta",
};

const CONDICION: Record<string, string> = {
  new: "Como nuevo",
  very_good: "Muy buen estado",
  good: "Buen estado",
  fair: "Estado regular",
  poor: "Con detalles",
};

const MODALIDAD: Record<string, string> = {
  sale: "Venta",
  loan: "Arriendo",
  both: "Venta y arriendo",
};

const PAGO: Record<string, string> = {
  mercadopago: "MercadoPago",
  transfer: "Transferencia",
};

const VELOCIDAD: Record<string, string> = {
  standard: "Normal",
  express: "Express",
};

const ROL_OFERTA: Record<string, string> = {
  comprador: "Comprabas",
  vendedor: "Vendías",
};

const ACCESO: Record<string, string> = {
  email: "Correo y contraseña",
  google: "Google",
  linkedin: "LinkedIn",
  linkedin_oidc: "LinkedIn",
  apple: "Apple",
  facebook: "Facebook",
};

const ROL: Record<string, string> = {
  user: "Usuario",
  admin: "Administración",
  seller: "Vendedor",
};

// ── piezas ──────────────────────────────────────────────────────────────────

function tabla(cabeceras: string[], filas: string[][], clase = ""): string {
  return `<div class="tw"><table${clase ? ` class="${clase}"` : ""}><thead><tr>${cabeceras
    .map((c) => `<th>${c}</th>`)
    .join("")}</tr></thead><tbody>${filas
    .map((f) => `<tr>${f.map((c, i) => `<td data-k="${cabeceras[i]}">${c}</td>`).join("")}</tr>`)
    .join("")}</tbody></table></div>`;
}

function ficha(pares: [string, string][]): string {
  return `<dl class="ficha">${pares.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join("")}</dl>`;
}

function seccion(id: string, titulo: string, intro: string, cuerpo: string, n?: number): string {
  const cuenta = typeof n === "number" ? ` <span class="n">${n}</span>` : "";
  return `<section id="${id}"><h2>${titulo}${cuenta}</h2>${intro ? `<p class="intro">${intro}</p>` : ""}${cuerpo}</section>`;
}

function vacio(texto: string): string {
  return `<p class="vacio">${texto}</p>`;
}

function lista<T>(arr: unknown): T[] {
  return Array.isArray(arr) ? (arr as T[]) : [];
}

// ── render ──────────────────────────────────────────────────────────────────

export function renderMisDatosHtml(datos: MisDatos): string {
  const d = datos as unknown as Fila;
  const cuenta = (d.cuenta ?? {}) as Fila;
  const perfil = (d.perfil ?? null) as Fila | null;
  const dirs = (d.direcciones_guardadas ?? null) as Fila | null;

  const publicaciones = lista<Fila>(d.publicaciones);
  const compras = lista<Fila>(d.compras);
  const ventas = lista<Fila>(d.ventas);
  const mensajes = lista<Fila>(d.mensajes_que_escribiste);
  const ofertas = lista<Fila>(d.ofertas);
  const resEscritas = lista<Fila>(d.reseñas_que_escribiste);
  const resLibros = lista<Fila>(d.reseñas_de_libros_que_escribiste);
  const resRecibidas = lista<Fila>(d.reseñas_que_recibiste);
  const preguntas = lista<Fila>(d.preguntas_que_hiciste);
  const seBusca = lista<Fila>(d.se_busca);
  const carrito = lista<Fila>(d.carrito);
  const busquedas = lista<Fila>(d.busquedas_con_sesion);
  const newsletter = (d.newsletter ?? null) as Fila | null;

  const nombre = (perfil?.full_name as string | undefined) || (perfil?.username as string | undefined) || "";

  // Tu cuenta
  const secCuenta = seccion(
    "cuenta",
    "Tu cuenta",
    "Cómo entras al sitio.",
    ficha([
      ["Correo con que entras", t(cuenta.correo_de_acceso)],
      ["Cuenta creada el", fecha(cuenta.creada_el)],
      ["Último ingreso", fechaHora(cuenta.ultimo_ingreso)],
      [
        "Formas de entrar",
        lista<string>(cuenta.formas_de_entrar).length
          ? Array.from(new Set(lista<string>(cuenta.formas_de_entrar).map((p) => ACCESO[p] ?? p)))
              .map(esc)
              .join(", ")
          : VACIO,
      ],
    ])
  );

  // Tu perfil
  const puntos = lista<unknown>(dirs?.puntos_de_retiro);
  const secPerfil = seccion(
    "perfil",
    "Tu perfil",
    "Lo que pusiste en tu perfil y tus datos de contacto.",
    perfil
      ? ficha([
          ["Nombre", t(perfil.full_name)],
          ["Nombre de usuario", perfil.username ? `@${esc(perfil.username)}` : VACIO],
          ["Correo", t(perfil.email)],
          ["Teléfono", t(perfil.phone)],
          ["Ciudad", t(perfil.city)],
          ["Sobre ti", largo(perfil.bio)],
          ["Correo público", t(perfil.public_email)],
          ["Instagram", t(perfil.instagram)],
          ["Dirección guardada", t(dirs?.direccion_por_defecto)],
          [
            "Puntos de retiro",
            puntos.length ? puntos.map(puntoTxt).filter(Boolean).join("<br>") : VACIO,
          ],
          ["Tipo de cuenta", traducir(ROL, perfil.role)],
          ["Plan", t(perfil.plan)],
          ["Código para invitar", t(perfil.referral_code)],
          ["Modo vacaciones", siNo(perfil.on_vacation)],
          ["Mensaje de vacaciones", largo(perfil.vacation_message)],
          ["Aceptas transferencia", siNo(perfil.acepta_transferencia)],
          ["MercadoPago conectado el", fecha(perfil.mercadopago_connected_at)],
          ["Comuna de despacho", t(perfil.shipit_origin_commune)],
          ["Perfil creado el", fecha(perfil.created_at)],
          ["Última actualización", fecha(perfil.updated_at)],
        ])
      : vacio("No encontré un perfil guardado.")
  );

  // Tus publicaciones
  const secPublicaciones = seccion(
    "publicaciones",
    "Tus publicaciones",
    "Los libros que publicaste para vender.",
    publicaciones.length
      ? tabla(
          ["Libro", "Estado", "Precio", "Condición", "Modalidad", "Notas", "Publicado el"],
          publicaciones.map((l) => [
            libroTxt(l.book),
            traducir(ESTADO_PUBLICACION, l.status),
            pesos(l.price),
            traducir(CONDICION, l.condition),
            traducir(MODALIDAD, l.modality),
            largo(l.notes),
            fecha(l.created_at),
          ])
        )
      : vacio("No tienes publicaciones."),
    publicaciones.length
  );

  // Tus compras
  const secCompras = seccion(
    "compras",
    "Tus compras",
    "Los libros que compraste. El total incluye envío y cargo de servicio, si hubo.",
    compras.length
      ? tabla(
          ["Fecha", "Libro", "Vendedor", "Estado", "Precio", "Envío", "Descuento", "Total", "Pago", "Despacho", "Dirección de entrega"],
          compras.map((o) => [
            fechaHora(o.created_at),
            libroTxt(o.libro),
            usuarioTxt(o.vendedor),
            traducir(ESTADO_PEDIDO, o.status),
            pesos(o.book_price),
            pesos(o.shipping_cost),
            o.discount_amount ? `${pesos(o.discount_amount)}${o.discount_code ? ` <span class="sub">(${esc(o.discount_code)})</span>` : ""}` : VACIO,
            `<strong>${pesos(o.total)}</strong>`,
            traducir(PAGO, o.payment_method),
            [o.courier ? esc(o.courier) : "", o.shipping_speed ? traducir(VELOCIDAD, o.shipping_speed) : "", o.tracking_code ? `Seguimiento: ${esc(o.tracking_code)}` : ""]
              .filter(Boolean)
              .join("<br>") || VACIO,
            [o.buyer_address, o.buyer_commune].filter(Boolean).map(esc).join(", ") || VACIO,
          ])
        )
      : vacio("No tienes compras."),
    compras.length
  );

  // Tus ventas
  const secVentas = seccion(
    "ventas",
    "Tus ventas",
    "Los libros que vendiste. Del comprador va solo su nombre de usuario.",
    ventas.length
      ? tabla(
          ["Fecha", "Libro", "Comprador", "Estado", "Precio", "Envío", "Cargo de servicio", "Total", "Pago", "Seguimiento"],
          ventas.map((o) => [
            fechaHora(o.created_at),
            libroTxt(o.libro),
            usuarioTxt(o.comprador),
            traducir(ESTADO_PEDIDO, o.status),
            pesos(o.book_price),
            pesos(o.shipping_cost),
            pesos(o.service_fee),
            `<strong>${pesos(o.total)}</strong>`,
            traducir(PAGO, o.payment_method),
            [o.courier, o.tracking_code].filter(Boolean).map(esc).join(" · ") || VACIO,
          ])
        )
      : vacio("No tienes ventas."),
    ventas.length
  );

  // Tus mensajes
  const secMensajes = seccion(
    "mensajes",
    "Tus mensajes",
    "Los mensajes que escribiste tú. Las respuestas de la otra persona son datos suyos y no van acá.",
    mensajes.length
      ? tabla(
          ["Fecha", "Para", "Mensaje"],
          mensajes.map((m) => [fechaHora(m.enviado_el), usuarioTxt(m.con), largo(m.texto)]),
          "msj"
        )
      : vacio("No tienes mensajes."),
    mensajes.length
  );

  // Tus ofertas
  const secOfertas = seccion(
    "ofertas",
    "Tus ofertas",
    "Las ofertas de precio que hiciste o recibiste.",
    ofertas.length
      ? tabla(
          ["Fecha", "Libro", "Tu papel", "Tipo", "Con", "Monto ofrecido", "Precio publicado", "Estado"],
          ofertas.map((o) => [
            fechaHora(o.created_at),
            libroTxt(o.libro),
            traducir(ROL_OFERTA, o.rol),
            o.made_by === "seller" ? "Contraoferta del vendedor" : "Oferta del comprador",
            usuarioTxt(o.con),
            `<strong>${pesos(o.amount)}</strong>`,
            pesos(o.listing_price),
            traducir(ESTADO_OFERTA, o.status),
          ])
        )
      : vacio("No tienes ofertas."),
    ofertas.length
  );

  // Tus reseñas
  const resCuerpo =
    `<h3>Las que escribiste a vendedores</h3>` +
    (resEscritas.length
      ? tabla(
          ["Fecha", "Vendedor", "Puntaje", "Comentario"],
          resEscritas.map((r) => [fecha(r.created_at), usuarioTxt(r.vendedor), estrellas(r.rating), largo(r.comment)])
        )
      : vacio("No tienes reseñas escritas a vendedores.")) +
    `<h3>Las que escribiste sobre libros</h3>` +
    (resLibros.length
      ? tabla(
          ["Fecha", "Libro", "Puntaje", "Título", "Reseña", "Estado"],
          resLibros.map((r) => [
            fecha(r.created_at),
            libroTxt(r.book),
            estrellas(r.rating),
            t(r.title),
            largo(r.body),
            traducir(ESTADO_RESENA_LIBRO, r.status),
          ])
        )
      : vacio("No tienes reseñas de libros.")) +
    `<h3>Las que recibiste</h3>` +
    (resRecibidas.length
      ? tabla(
          ["Fecha", "De", "Puntaje", "Comentario"],
          resRecibidas.map((r) => [fecha(r.created_at), usuarioTxt(r.de), estrellas(r.rating), largo(r.comment)])
        )
      : vacio("No tienes reseñas recibidas."));
  const secResenas = seccion(
    "resenas",
    "Tus reseñas",
    "",
    resCuerpo,
    resEscritas.length + resLibros.length + resRecibidas.length
  );

  // Tus preguntas
  const secPreguntas = seccion(
    "preguntas",
    "Tus preguntas a vendedores",
    "Lo que preguntaste en las fichas de libros, y la respuesta si la hubo.",
    preguntas.length
      ? tabla(
          ["Fecha", "Pregunta", "Respuesta", "Respondida el"],
          preguntas.map((q) => [fecha(q.created_at), largo(q.question), largo(q.answer), fecha(q.answered_at)])
        )
      : vacio("No tienes preguntas."),
    preguntas.length
  );

  // Se busca
  const secSeBusca = seccion(
    "se-busca",
    "Tus pedidos en Se busca",
    "Los libros que pediste que te avisara si aparecían.",
    seBusca.length
      ? tabla(
          ["Fecha", "Libro buscado", "Tema", "Notas", "Tus datos de contacto", "¿Apareció?"],
          seBusca.map((s) => [
            fecha(s.created_at),
            libroTxt({ title: s.title ?? s.isbn, author: s.author }),
            t(s.tema),
            largo(s.notes),
            [s.requester_name, s.requester_email, s.requester_whatsapp, s.requester_location]
              .filter(Boolean)
              .map(esc)
              .join("<br>") || VACIO,
            s.fulfilled ? `Sí${s.fulfilled_at ? `, el ${fecha(s.fulfilled_at)}` : ""}` : "Todavía no",
          ])
        )
      : vacio("No tienes pedidos en Se busca."),
    seBusca.length
  );

  // Otros
  const otros =
    `<h3>Tu carrito</h3>` +
    (carrito.length
      ? `<p>Tienes ${carrito.length} ${carrito.length === 1 ? "libro" : "libros"} en el carrito, agregado${carrito.length === 1 ? "" : "s"} entre el ${fecha(carrito[0].added_at)} y el ${fecha(carrito[carrito.length - 1].added_at)}.</p>`
      : vacio("No tienes libros en el carrito.")) +
    `<h3>Lo que buscaste con tu sesión abierta</h3>` +
    (busquedas.length
      ? tabla(
          ["Fecha", "Búsqueda"],
          busquedas.map((b) => [fechaHora(b.created_at), t(b.query)])
        )
      : vacio("No tienes búsquedas guardadas.")) +
    `<h3>Newsletter</h3>` +
    (newsletter
      ? `<p>Te suscribiste el ${fecha(newsletter.subscribed_at)}${
          newsletter.unsubscribed_at ? ` y te diste de baja el ${fecha(newsletter.unsubscribed_at)}` : " y sigues suscrita o suscrito"
        }.</p>`
      : vacio("No estás suscrita ni suscrito al newsletter."));
  const secOtros = seccion("otros", "Otros datos", "", otros);

  const indice: [string, string][] = [
    ["cuenta", "Tu cuenta"],
    ["perfil", "Tu perfil"],
    ["publicaciones", "Tus publicaciones"],
    ["compras", "Tus compras"],
    ["ventas", "Tus ventas"],
    ["mensajes", "Tus mensajes"],
    ["ofertas", "Tus ofertas"],
    ["resenas", "Tus reseñas"],
    ["preguntas", "Tus preguntas"],
    ["se-busca", "Se busca"],
    ["otros", "Otros datos"],
  ];

  const generado = fechaHora(d.generado_el);

  return `<!doctype html>
<html lang="es-CL">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Tus datos en tuslibros.cl</title>
<style>
:root{--fondo:#faf7f2;--papel:#fffdf9;--tinta:#2d2620;--suave:#6b6157;--linea:#e6ddd0;--acento:#8b5e3c;--franja:#f4eee5}
*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--fondo);color:var(--tinta);font:15px/1.55 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif}
main{max-width:1000px;margin:0 auto;padding:32px 16px 64px}
h1,h2,h3{font-family:Georgia,"Times New Roman",Times,serif;font-weight:normal;color:var(--tinta);line-height:1.25}
h1{font-size:2rem;margin:0 0 .25rem}
h2{font-size:1.45rem;margin:0 0 .35rem;padding-bottom:.35rem;border-bottom:1px solid var(--linea)}
h3{font-size:1.1rem;margin:1.4rem 0 .5rem}
header{padding-bottom:1.25rem;margin-bottom:1.5rem;border-bottom:2px solid var(--acento)}
.marca{font-family:Georgia,serif;color:var(--acento);font-size:.95rem;letter-spacing:.02em;margin:0 0 .75rem}
.gen{color:var(--suave);margin:.25rem 0 1rem}
.explica{background:var(--papel);border:1px solid var(--linea);border-radius:10px;padding:14px 16px;margin:0}
.explica p{margin:.3rem 0}
nav{margin:1.25rem 0 0;font-size:.92rem;display:flex;flex-wrap:wrap;gap:0 .9rem}
nav a{color:var(--acento);text-decoration:none;white-space:nowrap;line-height:2}
nav a:hover{text-decoration:underline}
section{background:var(--papel);border:1px solid var(--linea);border-radius:12px;padding:20px 18px;margin:0 0 18px;break-inside:auto}
.n{display:inline-block;font:600 .8rem/1 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;color:var(--suave);background:var(--franja);border-radius:999px;padding:4px 9px;vertical-align:middle;margin-left:.35rem}
.intro{color:var(--suave);margin:0 0 .9rem}
.vacio{color:var(--suave);font-style:italic;margin:.4rem 0}
.nota{color:var(--suave);font-size:.88rem;margin:.6rem 0 0}
.nd{color:#a39889}
.sub{color:var(--suave);font-size:.88em}
.est{color:var(--acento);letter-spacing:1px;white-space:nowrap}
.ficha{display:grid;grid-template-columns:minmax(150px,220px) 1fr;gap:6px 18px;margin:0}
.ficha dt{color:var(--suave)}
.ficha dd{margin:0;overflow-wrap:anywhere}
.tw{overflow-x:auto;-webkit-overflow-scrolling:touch}
table{width:100%;border-collapse:collapse;font-size:.92rem}
th{text-align:left;font-weight:600;color:var(--suave);font-size:.8rem;text-transform:uppercase;letter-spacing:.04em;border-bottom:1px solid var(--linea);padding:8px 10px;white-space:nowrap}
td{border-bottom:1px solid var(--linea);padding:9px 10px;vertical-align:top;overflow-wrap:break-word}
table.msj td:last-child{overflow-wrap:anywhere}
tbody tr:nth-child(even) td{background:var(--franja)}
table.msj td:last-child{min-width:260px}
footer{color:var(--suave);font-size:.88rem;text-align:center;margin-top:2rem}
@media (max-width:640px){
  main{padding:20px 12px 48px}
  h1{font-size:1.6rem}
  .ficha{grid-template-columns:1fr;gap:0}
  .ficha dt{margin-top:.6rem;font-size:.85rem}
  table,thead,tbody,tr,td{display:block;width:100%}
  thead{display:none}
  tr{border:1px solid var(--linea);border-radius:8px;margin:0 0 10px;padding:4px 0;background:var(--papel)}
  tbody tr:nth-child(even) td{background:transparent}
  td{border:0;padding:4px 12px}
  td::before{content:attr(data-k);display:block;font-size:.72rem;text-transform:uppercase;letter-spacing:.04em;color:var(--suave)}
  table.msj td:last-child{min-width:0}
}
@media print{
  body{background:#fff;font-size:11pt}
  main{max-width:none;padding:0}
  nav{display:none}
  section{border:0;border-radius:0;padding:0;margin:0 0 18pt}
  h2{break-after:avoid}
  tr{break-inside:avoid}
  tbody tr:nth-child(even) td{background:#f6f2ec}
  .tw{overflow:visible}
}
</style>
</head>
<body>
<main>
<header>
<p class="marca">tuslibros.cl</p>
<h1>Tus datos en tuslibros.cl</h1>
<p class="gen">${nombre ? `De ${esc(nombre)} · ` : ""}Generado el ${generado} (hora de Chile)</p>
<div class="explica">
<p>Este archivo es una copia de todo lo que guardo de ti en tuslibros.cl: tu perfil, tus publicaciones, compras, ventas, los mensajes que escribiste, ofertas, reseñas y tus pedidos en Se busca. De las otras personas va solo su nombre de usuario.</p>
<p>Lo puedes abrir cuando quieras, imprimirlo o guardarlo como PDF desde el menú de imprimir de tu navegador. Si necesitas los mismos datos para llevarlos a otro servicio, en tu perfil está también la versión técnica (archivo .json).</p>
<p>Si algo no cuadra o quieres que lo corrija, escríbeme. — Vero</p>
</div>
<nav aria-label="Secciones">${indice.map(([id, txt]) => `<a href="#${id}">${txt}</a>`).join("")}</nav>
</header>
${secCuenta}
${secPerfil}
${secPublicaciones}
${secCompras}
${secVentas}
${secMensajes}
${secOfertas}
${secResenas}
${secPreguntas}
${secSeBusca}
${secOtros}
<footer>tuslibros.cl · Archivo generado el ${generado}</footer>
</main>
</body>
</html>
`;
}
