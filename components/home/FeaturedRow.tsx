import Link from "next/link";
import Image from "next/image";
import type { ListingWithBook } from "@/types";
import { libroUrl } from "@/lib/urls";

interface Props {
  featuredListings: ListingWithBook[];
}

export default function FeaturedRow({ featuredListings }: Props) {
  // Las tiendas se movieron a TrustedStoresSection (08-09-2026): salían del flag
  // users.featured, sin orden y barajadas en cada carga. Acá quedan solo libros.
  if (featuredListings.length === 0) return null;

  return (
    <div className="space-y-8 mb-8">
      {/* Libros destacados */}
      {featuredListings.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="font-display text-base font-semibold text-ink">Esta semana en el velador</h2>
              <span className="text-[10px] font-mono uppercase tracking-wider text-ink-muted">· Curado por Vero</span>
            </div>
          </div>
          <div className="overflow-hidden -mx-2 px-2">
            <div
              className="marquee-track flex gap-4 w-max pb-2"
              style={{ ["--marquee-duration" as string]: `${featuredListings.length * 7}s` }}
            >
              {[...featuredListings, ...featuredListings].map((listing, i) => {
                const book = listing.book;
                const coverUrl = listing.cover_image_url || book.cover_url;
                return (
                  <Link
                    key={`${listing.id}-${i}`}
                    href={libroUrl(listing)}
                    className="flex-shrink-0 w-36 group"
                  >
                    <div className="relative w-36 h-48 rounded-lg overflow-hidden bg-cream-warm border border-cream-dark/30 shadow-sm group-hover:shadow-md group-hover:-translate-y-1 transition-all duration-300">
                      {coverUrl ? (
                        <Image
                          src={coverUrl}
                          alt={book.title}
                          fill
                          className="object-cover"
                          sizes="144px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-ink-muted text-xs p-2 text-center">
                          {book.title}
                        </div>
                      )}
                      <div className="absolute top-1.5 right-1.5">
                        <svg className="w-4 h-4 text-amber-400 drop-shadow" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      </div>
                    </div>
                    <p className="text-xs font-semibold text-ink mt-2 line-clamp-2 leading-tight group-hover:text-brand-600 transition-colors">
                      {book.title}
                    </p>
                    {listing.price != null && (
                      <p className="text-sm font-semibold text-ink mt-0.5 tracking-tight">
                        ${listing.price.toLocaleString("es-CL")}
                      </p>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

    </div>
  );
}
