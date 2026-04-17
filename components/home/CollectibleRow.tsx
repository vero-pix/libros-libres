import Link from "next/link";
import Image from "next/image";
import type { ListingWithBook } from "@/types";
import { libroUrl } from "@/lib/urls";

interface Props {
  listings: ListingWithBook[];
}

export default function CollectibleRow({ listings }: Props) {
  if (listings.length === 0) return null;

  return (
    <section className="mb-8">
      <div className="flex items-baseline gap-3 mb-4">
        <h2 className="text-sm font-semibold text-ink uppercase tracking-wide">
          Ediciones especiales y coleccionables
        </h2>
        <p className="text-xs text-ink-muted italic">
          Objetos con historia: ediciones raras, agotadas, de colección
        </p>
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
              <div className="relative w-36 h-48 rounded-lg overflow-hidden bg-ink/5 border-2 border-amber-700/40 shadow-sm group-hover:shadow-lg group-hover:border-amber-700/80 transition-all">
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
                <div className="absolute top-1.5 left-1.5">
                  <span className="bg-ink text-cream text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded">
                    Colección
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
