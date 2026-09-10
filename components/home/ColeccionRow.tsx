import Link from "next/link";
import BookCover from "@/components/listings/BookCover";
import { libroUrl } from "@/lib/urls";
import type { ListingWithBook } from "@/types";
import Chupalla from "@/components/ui/Chupalla";

interface Props {
  tag: string;
  collectionSlug?: string;
  title: string;
  subtitle: string;
  listings: ListingWithBook[];
  /** Adorno estacional del destacado (`site_config.destacado_home.adorno`). Hoy solo "chupalla". */
  adorno?: string;
}

// Presentacional: los listings (ya deduplicados entre colecciones y filas) llegan por prop.
export default function ColeccionRow({ tag, collectionSlug, title, subtitle, listings, adorno }: Props) {
  if (!listings || listings.length < 3) return null;

  return (
    <section className="mb-8">
      <div className="flex items-baseline justify-between mb-4">
        <div>
          <h2 className="font-display text-base font-semibold text-ink relative inline-block">
            {title}
            {adorno === "chupalla" && (
              <Chupalla id="chupalla-fila" className="chupalla-float absolute -top-3 -right-5 w-9 h-auto pointer-events-none" />
            )}
          </h2>
          <p className="text-[11px] font-mono text-ink-muted mt-0.5">{subtitle}</p>
        </div>
        <Link
          href={collectionSlug ? `/coleccion/${collectionSlug}` : `/?tag=${tag}`}
          className="text-xs font-medium text-brand-600 hover:underline flex-shrink-0"
        >
          Ver todos →
        </Link>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-hide">
        {listings.map((listing) => {
          const book = listing.book;
          const coverUrl = listing.cover_image_url || book.cover_url;
          return (
            <Link
              key={listing.id}
              href={libroUrl(listing)}
              className="flex-shrink-0 w-36 group"
            >
              <div className="relative w-36">
                <BookCover
                  title={book.title}
                  author={book.author}
                  coverUrl={coverUrl}
                  ratio="portrait"
                  sizes="144px"
                  className="rounded-lg bg-cream-warm border border-cream-dark/30 shadow-sm group-hover:shadow-md group-hover:-translate-y-0.5 transition-all duration-300"
                />
                {listing.price != null && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-2 pb-2 pt-4">
                    <span className="text-white text-xs font-semibold font-mono">
                      ${listing.price.toLocaleString("es-CL")}
                    </span>
                  </div>
                )}
              </div>
              <p className="text-xs font-semibold text-ink mt-2 line-clamp-2 leading-tight group-hover:text-brand-600 transition-colors">
                {book.title}
              </p>
              {book.author && (
                <p className="text-[11px] text-ink-muted font-display italic line-clamp-1 mt-0.5">
                  {book.author}
                </p>
              )}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
