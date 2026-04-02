import Image from "next/image";
import Link from "next/link";
import type { ListingWithBook } from "@/types";

const CONDITION_LABELS: Record<string, string> = {
  new: "Nuevo",
  good: "Usado",
  fair: "Usado",
  poor: "Usado",
};

const CONDITION_BADGE: Record<string, string> = {
  new: "bg-brand-500 text-white",
  good: "bg-gray-200 text-gray-700",
  fair: "bg-gray-200 text-gray-700",
  poor: "bg-gray-200 text-gray-700",
};

interface Props {
  listing: ListingWithBook;
}

export default function ListingCard({ listing }: Props) {
  const { book } = listing;
  const sellerName = listing.seller?.full_name?.split(" ")[0] ?? "Vendedor";

  return (
    <div className="group bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-all duration-200 border-b-2 border-b-brand-500/30 hover:border-b-brand-500">
      <Link href={`/listings/${listing.id}`} className="block">
        <div className="relative aspect-[3/4] bg-gray-50 flex items-center justify-center">
          {book.cover_url ? (
            <Image
              src={book.cover_url}
              alt={book.title}
              fill
              className="object-contain p-2"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-brand-100 to-brand-50 flex flex-col items-center justify-center gap-2">
              <svg className="w-12 h-12 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.331 0 4.473.89 6.074 2.356M12 6.042a8.968 8.968 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.356M12 6.042V20.356" />
              </svg>
              <span className="text-xs text-brand-500 font-medium">Sin portada</span>
            </div>
          )}
          <span
            className={`absolute top-2 right-2 text-xs font-semibold px-2 py-0.5 rounded ${
              CONDITION_BADGE[listing.condition]
            }`}
          >
            {CONDITION_LABELS[listing.condition] ?? "Usado"}
          </span>
        </div>
      </Link>

      <div className="p-3">
        <Link href={`/listings/${listing.id}`}>
          <h3 className="text-sm text-link hover:underline leading-tight line-clamp-2">
            {book.title}
            {book.author ? ` — ${book.author}` : ""}
          </h3>
        </Link>

        {listing.price != null && (
          <p className="font-extrabold text-gray-900 text-base mt-1">
            ${listing.price.toLocaleString("es-CL")}
          </p>
        )}

        <p className="text-xs text-gray-500 mt-2">
          Vendido por:{" "}
          <span className="text-gray-700 font-medium">{sellerName}</span>
        </p>
      </div>
    </div>
  );
}
