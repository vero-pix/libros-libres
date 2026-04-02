import Image from "next/image";
import Link from "next/link";
import type { ListingWithBook } from "@/types";

const MODALITY_LABELS = {
  sale: "Venta",
  loan: "Préstamo",
  both: "Venta y préstamo",
};

const MODALITY_COLORS = {
  sale: "bg-green-100 text-green-700",
  loan: "bg-blue-100 text-blue-700",
  both: "bg-purple-100 text-purple-700",
};

const CONDITION_LABELS: Record<string, string> = {
  new: "Como nuevo",
  good: "Buen estado",
  fair: "Regular",
  poor: "Con detalles",
};

interface Props {
  listing: ListingWithBook;
}

export default function ListingCard({ listing }: Props) {
  const { book } = listing;

  return (
    <Link
      href={`/listings/${listing.id}`}
      className="group block bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
    >
      <div className="relative h-40 bg-gray-50 flex items-center justify-center">
        {book.cover_url ? (
          <Image
            src={book.cover_url}
            alt={book.title}
            fill
            className="object-contain p-4"
          />
        ) : (
          <span className="text-5xl">📚</span>
        )}
        <span
          className={`absolute top-2 right-2 text-xs font-medium px-2 py-0.5 rounded-full ${
            MODALITY_COLORS[listing.modality]
          }`}
        >
          {MODALITY_LABELS[listing.modality]}
        </span>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2 group-hover:text-brand-600">
          {book.title}
        </h3>
        <p className="text-xs text-gray-500 mt-0.5 truncate">{book.author}</p>
        <div className="flex items-center justify-between mt-3">
          <span className="text-xs text-gray-400">
            {CONDITION_LABELS[listing.condition] ?? listing.condition}
          </span>
          {listing.price != null && (
            <span className="font-bold text-gray-900 text-sm">
              ${listing.price.toLocaleString("es-AR")}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
