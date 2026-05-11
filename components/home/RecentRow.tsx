import Link from "next/link";
import Image from "next/image";
import type { ListingWithBook } from "@/types";
import { libroUrl } from "@/lib/urls";

interface Props {
  listings: ListingWithBook[];
}

export default function RecentRow({ listings }: Props) {
  if (listings.length < 3) return null;

  return (
    <section className="mb-8">
      <div className="flex items-baseline gap-3 mb-4">
        <span className="inline-block w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        <h2 className="text-sm font-semibold text-ink uppercase tracking-wide">
          Recién llegados
        </h2>
        <p className="text-xs text-ink-muted">últimos 7 días</p>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-hide">
        {listings.filter((l) => l.book).map((listing) => {
          const book = listing.book;
          const coverUrl = listing.cover_image_url || book.cover_url;
          const daysAgo = Math.floor(
            (Date.now() - new Date(listing.created_at).getTime()) / (1000 * 60 * 60 * 24)
          );
          const label = daysAgo === 0 ? "hoy" : daysAgo === 1 ? "ayer" : `hace ${daysAgo}d`;

          return (
            <Link
              key={listing.id}
              href={libroUrl(listing)}
              className="flex-shrink-0 w-36 group"
            >
              <div className="relative w-36 h-48 rounded-lg overflow-hidden bg-cream-warm border border-cream-dark/30 shadow-sm group-hover:shadow-md transition-shadow">
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
                <div className="absolute bottom-1.5 left-1.5">
                  <span className="text-[10px] font-medium bg-black/60 text-white px-1.5 py-0.5 rounded-full">
                    {label}
                  </span>
                </div>
              </div>
              <p className="text-xs font-semibold text-ink mt-2 line-clamp-2 leading-tight group-hover:text-brand-600 transition-colors">
                {book.title}
              </p>
              {book.author && (
                <p className="text-[11px] text-ink-muted line-clamp-1 italic">
                  {book.author}
                </p>
              )}
              {listing.price != null && (
                <p className="text-sm font-semibold text-ink mt-0.5 tracking-tight">
                  ${listing.price.toLocaleString("es-CL")}
                </p>
              )}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
