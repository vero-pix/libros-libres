/**
 * Genera la URL de un libro/listing.
 * Formato amigable: /libro/[username]/[slug] cuando el vendedor tiene username.
 * Fallback: /listings/[id] cuando no hay username.
 */
export function libroUrl(listing: {
  id: string;
  slug?: string | null;
  seller?: { username?: string | null } | null;
}): string {
  if (listing.slug && listing.seller?.username) {
    return `/libro/${listing.seller.username}/${listing.slug}`;
  }
  return `/listings/${listing.id}`;
}

/**
 * Genera la URL canónica de una categoría/subcategoría.
 * Fase 1: apunta a la futura ruta /categoria/[slug] (se crea en Fase 2).
 * Fase 2: estas URLs tendrán rutas reales + redirects 308 desde /?category=.
 *
 * Simplificación de subcategoría: stripea el prefijo del padre.
 * Ej: category="general-adulto", subcategory="general-adulto-novela" → /categoria/general-adulto/novela
 */
export function categoriaUrl(category: string, subcategory?: string): string {
  if (!subcategory) return `/categoria/${category}`;
  const sub = subcategory.startsWith(`${category}-`)
    ? subcategory.slice(category.length + 1)
    : subcategory;
  return `/categoria/${category}/${sub}`;
}
