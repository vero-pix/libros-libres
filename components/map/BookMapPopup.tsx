"use client";

import Image from "next/image";
import Link from "next/link";
import type { ListingWithBook } from "@/types";

const MODALITY_LABELS = {
  sale: "Venta",
  loan: "Préstamo",
  both: "Venta y préstamo",
};

const MODALITY_COLORS = {
  sale: "bg-green-100 text-green-800",
  loan: "bg-blue-100 text-blue-800",
  both: "bg-purple-100 text-purple-800",
};

interface Props {
  listing: ListingWithBook;
  onClose: () => void;
}

export default function BookMapPopup({ listing, onClose }: Props) {
  const { book } = listing;

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 p-4">
      <button
        onClick={onClose}
        className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
        aria-label="Cerrar"
      >
        ✕
      </button>
      <div className="flex gap-3">
        {book.cover_url ? (
          <Image
            src={book.cover_url}
            alt={book.title}
            width={56}
            height={80}
            className="rounded-lg object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-14 h-20 bg-gray-100 rounded-lg flex items-center justify-center text-2xl flex-shrink-0">
            📚
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 text-sm leading-tight truncate">
            {book.title}
          </h3>
          <p className="text-xs text-gray-500 mt-0.5 truncate">{book.author}</p>
          <span
            className={`inline-block text-xs px-2 py-0.5 rounded-full mt-2 font-medium ${
              MODALITY_COLORS[listing.modality]
            }`}
          >
            {MODALITY_LABELS[listing.modality]}
          </span>
          {listing.price != null && (
            <p className="text-sm font-bold text-gray-900 mt-1">
              ${listing.price.toLocaleString("es-AR")}
            </p>
          )}
        </div>
      </div>
      <Link
        href={`/listings/${listing.id}`}
        className="mt-3 block w-full text-center bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium py-2 rounded-xl transition-colors"
      >
        Ver publicación
      </Link>
    </div>
  );
}
