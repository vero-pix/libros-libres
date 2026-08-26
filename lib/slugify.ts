/**
 * Genera un slug URL-friendly desde un texto.
 * Ej: "Cien años de soledad" → "cien-anos-de-soledad"
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/**
 * Slug de una publicación: título + autor.
 *
 * Antes era solo el título y quedaban URLs como `/libro/vero/libertad` o
 * `/libro/vero/1984` — 325 de las 2.038 publicaciones activas tenían el slug en
 * una o dos palabras. Con el autor adentro la URL gana el long tail por el que
 * la gente busca de verdad ("libertad jonathan franzen") sin alargarse tanto
 * como para volverse ilegible. La editorial se dejó fuera a propósito: falta en
 * un tercio del catálogo y aportaría poco.
 *
 * No se repite el autor si ya está en el título ("Cuentos de Borges").
 */
export function slugListing(title: string, author?: string | null): string {
  const base = slugify(title || "libro");
  const autor = slugify(author ?? "");
  if (!autor || !base || base.includes(autor)) return base || "libro";

  // Recortar por palabra completa: cortar a la mitad deja restos como
  // "-jonath" que no ayudan ni a Google ni a quien lee la URL.
  const partes = `${base}-${autor}`.split("-");
  let slug = "";
  for (const parte of partes) {
    const siguiente = slug ? `${slug}-${parte}` : parte;
    if (siguiente.length > 80) break;
    slug = siguiente;
  }
  return slug || base;
}

/**
 * Devuelve un slug libre para ese vendedor, agregando -2, -3… si hace falta.
 *
 * La unicidad se verificaba contra TODO el sitio, y por eso el segundo Drácula
 * del catálogo quedó como `dracula-l4b2`: un sufijo aleatorio que no le sirve a
 * nadie. La URL es /libro/[username]/[slug], así que basta con que el slug sea
 * único dentro del vendedor.
 */
export async function slugUnicoParaVendedor(
  supabase: { from: (t: string) => any },
  sellerId: string,
  base: string
): Promise<string> {
  const { data } = await supabase
    .from("listings")
    .select("slug")
    .eq("seller_id", sellerId)
    .like("slug", `${base}%`);

  const tomados = new Set<string>((data ?? []).map((l: { slug: string | null }) => l.slug ?? ""));
  if (!tomados.has(base)) return base;
  for (let n = 2; n < 100; n++) {
    const intento = `${base}-${n}`;
    if (!tomados.has(intento)) return intento;
  }
  return `${base}-${Date.now().toString(36).slice(-4)}`;
}
