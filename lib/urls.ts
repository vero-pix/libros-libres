/**
 * Genera la URL de un libro/listing.
 * Formato amigable: /libro/[username]/[slug] cuando el vendedor tiene username.
 * Fallback: /listings/[id] cuando no hay username (no existe la ruta /libro/[slug] sola).
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
