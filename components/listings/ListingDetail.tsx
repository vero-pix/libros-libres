import Image from "next/image";
import type { ListingWithBook } from "@/types";

const MODALITY_LABELS = {
  sale: "Venta",
  loan: "Préstamo",
  both: "Venta y préstamo",
};

const CONDITION_LABELS: Record<string, string> = {
  new: "Como nuevo",
  good: "Buen estado",
  fair: "Estado regular",
  poor: "Con detalles",
};

interface Props {
  listing: ListingWithBook;
}

export default function ListingDetail({ listing }: Props) {
  const { book } = listing;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div className="flex flex-col sm:flex-row gap-6 p-6">
        {/* Cover */}
        <div className="flex-shrink-0 flex justify-center">
          {book.cover_url ? (
            <Image
              src={book.cover_url}
              alt={book.title}
              width={120}
              height={170}
              className="rounded-lg shadow object-cover"
            />
          ) : (
            <div className="w-32 h-44 bg-gray-100 rounded-lg flex items-center justify-center text-5xl">
              📚
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">{book.title}</h1>
          <p className="text-gray-600 mt-1">{book.author}</p>
          {book.genre && (
            <p className="text-sm text-gray-400 mt-0.5">{book.genre}</p>
          )}

          <div className="flex flex-wrap gap-2 mt-4">
            <span className="text-sm px-3 py-1 rounded-full bg-gray-100 text-gray-700">
              {CONDITION_LABELS[listing.condition] ?? listing.condition}
            </span>
            <span className="text-sm px-3 py-1 rounded-full bg-brand-100 text-brand-700">
              {MODALITY_LABELS[listing.modality]}
            </span>
          </div>

          {listing.price != null && listing.modality !== "loan" && (
            <p className="text-2xl font-bold text-gray-900 mt-4">
              ${listing.price.toLocaleString("es-AR")}
            </p>
          )}

          {listing.notes && (
            <p className="text-sm text-gray-600 mt-4 bg-gray-50 rounded-xl p-3">
              {listing.notes}
            </p>
          )}

          {listing.address && (
            <p className="text-sm text-gray-500 mt-3 flex items-center gap-1">
              <span>📍</span> {listing.address}
            </p>
          )}
        </div>
      </div>

      {/* Book description */}
      {book.description && (
        <div className="border-t border-gray-100 px-6 py-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-2">Sinopsis</h2>
          <p className="text-sm text-gray-600 leading-relaxed line-clamp-4">
            {book.description}
          </p>
        </div>
      )}

      {/* Contact CTA */}
      <div className="border-t border-gray-100 px-6 py-4 bg-gray-50">
        <button className="w-full bg-brand-500 hover:bg-brand-600 text-white font-semibold py-3 rounded-xl transition-colors">
          Contactar vendedor
        </button>
      </div>
    </div>
  );
}
