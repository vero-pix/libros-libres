/**
 * Genera la URL de un libro/listing.
 * Formato: /libro/[username]/[slug]
 * Fallback: /libro/[slug] si no hay username, /listings/[id] si no hay slug.
 */
export function libroUrl(listing: {
  id: string;
  slug?: string | null;
  seller?: { username?: string | null } | null;
}): string {
  if (listing.slug && listing.seller?.username) {
    return `/libro/${listing.seller.username}/${listing.slug}`;
  }
  if (listing.slug) {
    return `/libro/${listing.slug}`;
  }
  return `/listings/${listing.id}`;
}
