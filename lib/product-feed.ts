/**
 * Feed de producto para Google Merchant Center y el catálogo de Meta.
 *
 * FORMATO: RSS 2.0 con el namespace `g:` de Google. Es el único que ambas
 * plataformas aceptan sin transformación intermedia — Meta soporta el formato de
 * feed de Google tal cual, mientras que en CSV los nombres de columna difieren
 * entre las dos.
 *
 * ⚠️ REGLA QUE NO SE NEGOCIA: solo entran listings que se pueden PAGAR. Si el
 * vendedor no tiene MercadoPago conectado, mandar tráfico de Shopping a su ficha
 * es causal de suspensión de Merchant Center, además de una mala experiencia.
 * Al 25 ago 2026 eso deja fuera 458 de 2.022 listings activos (23%).
 */

import { calcularEnvioPromo } from "@/lib/shipping-promo";

export const SITE = "https://tuslibros.cl";

/**
 * Costo de despacho declarado en el feed y en el JSON-LD de la ficha.
 *
 * El JSON-LD declaraba $3.500 fijos, que nunca fue cierto: la mediana real de
 * las órdenes con despacho es $5.433 y el máximo histórico $9.508. Declarar
 * menos de lo que se cobra es exactamente lo que Merchant Center penaliza.
 *
 * Se declara la mediana redondeada. Si Google reclama discrepancia en comunas
 * caras, el siguiente paso es `g:shipping` por región en vez de un valor único.
 */
export const FEED_SHIPPING_CLP = 5490;

export type CanalFeed = "merchant" | "meta";

export interface ItemFeed {
  id: string;
  title: string;
  description: string;
  link: string;
  imageLink: string;
  price: number;
  availability: "in_stock";
  condition: "new" | "used";
  brand: string;
  isbn: string | null;
  shipping: number;
}

export interface MotivoExclusion {
  listingId: string;
  titulo: string;
  motivo:
    | "vendedor sin MercadoPago"
    | "sin imagen usable"
    | "sin precio"
    | "sin título"
    | "sin URL amigable";
}

/** Fila cruda que espera el generador (lo que devuelve la query de abajo). */
export interface FilaListing {
  id: string;
  price: number | null;
  condition: string | null;
  slug: string | null;
  cover_image_url: string | null;
  seller: { username: string | null; mercadopago_user_id: string | null } | null;
  book: {
    title: string | null;
    author: string | null;
    description: string | null;
    cover_url: string | null;
    isbn: string | null;
    publisher: string | null;
  } | null;
}

/**
 * Convierte listings crudos en ítems del feed, separando los excluidos y por qué.
 *
 * Imágenes: se prioriza `book.cover_url` (la tapa de catálogo) por sobre
 * `cover_image_url`. Es al revés que en el sitio a propósito — la foto propia de
 * muchos listings es la contratapa, y en un feed la tapa vende. Ver
 * [[reference_portada_cover_image_url]].
 */
export function construirItems(
  filas: FilaListing[],
  canal: CanalFeed
): { items: ItemFeed[]; excluidos: MotivoExclusion[] } {
  const items: ItemFeed[] = [];
  const excluidos: MotivoExclusion[] = [];
  const utm = canal === "merchant" ? "merchant" : "meta";

  for (const l of filas) {
    const titulo = l.book?.title?.trim() ?? "";
    const registrar = (motivo: MotivoExclusion["motivo"]) =>
      excluidos.push({ listingId: l.id, titulo: titulo || "(sin título)", motivo });

    if (!l.seller?.mercadopago_user_id) {
      registrar("vendedor sin MercadoPago");
      continue;
    }
    if (!titulo) {
      registrar("sin título");
      continue;
    }
    if (!l.price || l.price <= 0) {
      registrar("sin precio");
      continue;
    }
    // La tapa de catálogo primero; la foto del vendedor como respaldo.
    const imagen = l.book?.cover_url || l.cover_image_url;
    if (!imagen) {
      registrar("sin imagen usable");
      continue;
    }
    if (!l.slug || !l.seller.username) {
      // Sin URL amigable el link caería a /listings/[uuid], que no queremos
      // publicar en un feed: es la URL que el sitio trata como fallback.
      registrar("sin URL amigable");
      continue;
    }

    const autor = l.book?.author?.trim() || "Autor desconocido";
    const promo = calcularEnvioPromo({
      sellerId: (l as any).seller_id,
      totalBookPrice: l.price,
      fleteCotizado: FEED_SHIPPING_CLP,
      esCourier: true,
    });

    items.push({
      id: l.id,
      title: `${titulo} — ${autor}`.slice(0, 150),
      description: (
        limpiarDescripcion(l.book?.description ?? "") ||
        `${titulo}, de ${autor}. Libro usado publicado por un vendedor de tuslibros.cl. Despacho a todo Chile o retiro en persona.`
      ).slice(0, 5000),
      link: `${SITE}/libro/${l.seller.username}/${l.slug}?utm_source=${utm}&utm_medium=shopping&utm_campaign=feed-catalogo`,
      imageLink: imagen,
      price: l.price,
      availability: "in_stock",
      condition: l.condition === "new" ? "new" : "used",
      brand: l.book?.publisher?.trim() || autor,
      isbn: l.book?.isbn?.trim() || null,
      shipping: promo.aplica ? 0 : FEED_SHIPPING_CLP,
    });
  }

  return { items, excluidos };
}

/**
 * Limpia la descripción que escribió el vendedor antes de mandarla al feed.
 *
 * Muchas descripciones vienen copiadas de publicaciones de Instagram y traen
 * teléfono, correo, handle de redes y condiciones propias de despacho. En un
 * feed eso es un problema doble:
 *
 *  1. Merchant Center rechaza descripciones con datos de contacto — empujan al
 *     comprador fuera del sitio— y Meta las trata igual.
 *  2. Frases como "envío gratis a todo Chile" contradicen el `g:shipping` que
 *     declara el feed, y una discrepancia entre feed y landing es motivo de
 *     suspensión de la cuenta.
 *
 * Además evita publicar el teléfono y el correo de un tercero en un archivo
 * abierto: el vendedor los puso en su ficha, no autorizó un feed comercial.
 */
export function limpiarDescripcion(texto: string): string {
  const limpio = texto
    // Correos y URLs
    .replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, " ")
    .replace(/https?:\/\/\S+/gi, " ")
    .replace(/\bwww\.\S+/gi, " ")
    // Teléfonos chilenos en cualquier formato razonable
    .replace(/(\+?56)?[\s.-]*9[\s.-]*\d{4}[\s.-]*\d{4}/g, " ")
    .replace(/\b\d{8,}\b/g, " ")
    // Handles y hashtags
    .replace(/[@#][\w.À-ſ]+/g, " ")
    // Promesas de despacho que pueden contradecir lo que declara el feed
    .replace(/^.*\b(env[ií]o|despacho)s?\s+gratis?\b.*$/gim, " ")
    .replace(/^.*\b(whatsapp|instagram|facebook|correo|contacto|mensaje directo)\b.*$/gim, " ")
    // Mínimos de compra propios del vendedor: no son los del checkout y en el
    // feed leen como una condición de la tienda que después no se cumple.
    .replace(/^.*\b(compras?\s+desde|pedido\s+m[ií]nimo|m[ií]nimo\s+de\s+compra)\b.*$/gim, " ")
    // Emojis y símbolos decorativos. Se escriben como pares suplentes en vez de
    // `\u{...}` con flag `u` porque el tsconfig no apunta a ES6 y el build
    // falla: "This regular expression flag is only available when targeting
    // 'es6' or later".
    .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, " ")
    .replace(/[←-⇿☀-➿⬀-⯿️•]/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\s*\n\s*/g, "\n")
    .replace(/\n{2,}/g, "\n")
    .trim();

  // Si la limpieza dejó algo demasiado corto para ser útil, el llamador usa la
  // descripción generada. Diez palabras es el piso.
  return limpio.split(/\s+/).length >= 10 ? limpio : "";
}

const escapar = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/** Serializa los ítems como RSS 2.0 con el namespace de Google. */
export function serializarXml(items: ItemFeed[], canal: CanalFeed): string {
  const cuerpo = items
    .map(
      (i) => `    <item>
      <g:id>${i.id}</g:id>
      <g:title>${escapar(i.title)}</g:title>
      <g:description>${escapar(i.description)}</g:description>
      <g:link>${escapar(i.link)}</g:link>
      <g:image_link>${escapar(i.imageLink)}</g:image_link>
      <g:availability>${i.availability}</g:availability>
      <g:price>${i.price} CLP</g:price>
      <g:condition>${i.condition}</g:condition>
      <g:brand>${escapar(i.brand)}</g:brand>${
        i.isbn ? `\n      <g:gtin>${escapar(i.isbn)}</g:gtin>` : ""
      }
      <g:google_product_category>784</g:google_product_category>
      <g:product_type>Libros usados</g:product_type>
      <g:identifier_exists>${i.isbn ? "yes" : "no"}</g:identifier_exists>
      <g:shipping>
        <g:country>CL</g:country>
        <g:service>Courier</g:service>
        <g:price>${i.shipping} CLP</g:price>
      </g:shipping>
    </item>`
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>tuslibros.cl — libros usados en Chile</title>
    <link>${SITE}</link>
    <description>Catálogo de libros usados con pago por MercadoPago y despacho a todo Chile. Feed: ${canal}.</description>
${cuerpo}
  </channel>
</rss>
`;
}

/** El select que necesita `construirItems`. Se usa igual en la ruta y en el validador. */
export const SELECT_FEED =
  "id, price, condition, slug, cover_image_url, seller_id, seller:users!inner(username, mercadopago_user_id), book:books!inner(title, author, description, cover_url, isbn, publisher)";
