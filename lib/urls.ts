/**
 * Genera la URL de un libro/listing.
 * Usa slug si disponible, fallback a /listings/id.
 */
export function libroUrl(listing: { id: string; slug?: string | null }): string {
  return listing.slug ? `/libro/${listing.slug}` : `/listings/${listing.id}`;
}
