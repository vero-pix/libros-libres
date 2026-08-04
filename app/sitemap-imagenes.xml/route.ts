import { createServerClient } from "@supabase/ssr";

/**
 * Sitemap de imágenes: le declara a Google las portadas del catálogo.
 *
 * Julio 2026 cerró con **0 clics** desde búsqueda de imágenes teniendo 1.671
 * libros con portada. No era un bug: nunca se le habían declarado. Un catálogo
 * de libros usados es contenido visual — la gente busca portadas para
 * identificar ediciones — así que es tráfico que estaba tirado.
 *
 * Va aparte de `app/sitemap.ts` porque el campo `images` de
 * MetadataRoute.Sitemap recién existe en Next 15 y este repo va en 14.2: ahí el
 * campo se ignora en silencio. Acá el XML se arma a mano con el namespace
 * `image` que pide Google.
 *
 * Las portadas se sirven por el optimizador de Next (mismo dominio) y no por la
 * URL cruda de Supabase, para que Google atribuya las imágenes a tuslibros.cl
 * sin tener que verificar aparte el host del storage.
 */
export const revalidate = 3600;

const BASE = "https://tuslibros.cl";

/** & < > " ' rompen el XML si van crudos en una URL o en un título. */
function xmlEscape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );

  // Paginado: Supabase corta en 1.000 filas y el catálogo ya pasó de eso.
  const listings: any[] = [];
  for (let from = 0; from < 10000; from += 1000) {
    const { data } = await supabase
      .from("listings")
      .select(
        "id, slug, cover_image_url, seller:users(username), book:books(title, author, cover_url)"
      )
      .eq("status", "active")
      .order("updated_at", { ascending: false })
      .range(from, from + 999);
    if (!data?.length) break;
    listings.push(...data);
    if (data.length < 1000) break;
  }

  const entries: string[] = [];
  for (const l of listings) {
    const cover = l.cover_image_url ?? l.book?.cover_url;
    if (!cover) continue;

    const username = l.seller?.username;
    const pageUrl =
      username && l.slug
        ? `${BASE}/libro/${username}/${l.slug}`
        : `${BASE}/listings/${l.id}`;

    const imgUrl = `${BASE}/_next/image?url=${encodeURIComponent(cover)}&w=1200&q=75`;
    const title = l.book?.title ?? "";
    const caption = l.book?.author
      ? `${title} — ${l.book.author}, libro usado en Chile`
      : `${title}, libro usado en Chile`;

    entries.push(
      `  <url>\n` +
        `    <loc>${xmlEscape(pageUrl)}</loc>\n` +
        `    <image:image>\n` +
        `      <image:loc>${xmlEscape(imgUrl)}</image:loc>\n` +
        `      <image:title>${xmlEscape(title)}</image:title>\n` +
        `      <image:caption>${xmlEscape(caption)}</image:caption>\n` +
        `    </image:image>\n` +
        `  </url>`
    );
  }

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n` +
    `        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n` +
    entries.join("\n") +
    `\n</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
