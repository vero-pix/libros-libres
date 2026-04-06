import Image from "next/image";
import Link from "next/link";
import type { ListingWithBook } from "@/types";

const CONDITION_LABELS: Record<string, string> = {
  new: "Nuevo",
  good: "Usado",
  fair: "Usado",
  poor: "Usado",
};

interface Props {
  listing: ListingWithBook;
}

export default function ListingCard({ listing }: Props) {
  const { book } = listing;
  const coverUrl = listing.cover_image_url ?? book.cover_url;
  const sellerName = listing.seller?.full_name?.split(" ")[0] ?? "Vendedor";

  return (
    <div className="group bg-white overflow-hidden hover:shadow-xl transition-all duration-300">
      <Link href={`/listings/${listing.id}`} className="block">
        <div className="relative aspect-[3/4] bg-cream-warm flex items-center justify-center overflow-hidden">
          {coverUrl ? (
            <Image
              src={coverUrl}
              alt={book.title}
              fill
              className="object-contain p-3 group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-brand-50 to-cream-warm flex flex-col items-center justify-center gap-2 p-4">
              <svg className="w-12 h-12 text-brand-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.331 0 4.473.89 6.074 2.356M12 6.042a8.968 8.968 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.356M12 6.042V20.356" />
              </svg>
              <span className="text-[10px] text-brand-400 font-medium text-center leading-tight">{book.title}</span>
            </div>
          )}
          {listing.condition === "new" && (
            <span className="absolute top-3 right-3 text-[10px] font-semibold uppercase tracking-wider px-2 py-1 bg-brand-500 text-white">
              Nuevo
            </span>
          )}
        </div>
      </Link>

      <div className="p-4">
        <Link href={`/listings/${listing.id}`}>
          <h3 className="font-display text-sm font-semibold text-ink leading-tight line-clamp-2 group-hover:text-brand-700 transition-colors">
            {book.title}
          </h3>
        </Link>
        {book.author && (
          <p className="text-xs text-ink-muted mt-1 truncate">{book.author}</p>
        )}

        <div className="flex items-baseline justify-between mt-3">
          {listing.price != null && (
            <p className="font-display font-bold text-ink text-lg">
              ${listing.price.toLocaleString("es-CL")}
            </p>
          )}
          <Link
            href={`/vendedor/${listing.seller_id}`}
            className="text-[10px] text-ink-muted uppercase tracking-wider hover:text-brand-600 transition-colors"
          >
            {sellerName}
          </Link>
        </div>
      </div>
    </div>
  );
}
