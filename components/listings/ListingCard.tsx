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
    <div className="group bg-white border border-gray-200 rounded-sm overflow-hidden hover:shadow-md transition-shadow">
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
            <span className="text-5xl">📚</span>
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
          <p className="font-bold text-gray-900 text-sm mt-1">
            ${listing.price.toLocaleString("es-CL")}
          </p>
        )}

        <p className="text-xs text-gray-400 mt-2">
          Vendido por:{" "}
          <span className="text-gray-600">{sellerName}</span>
        </p>
      </div>
    </div>
  );
}
