"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import type { ListingWithBook } from "@/types";

const CONDITION_LABELS: Record<string, string> = {
  new: "Como nuevo",
  good: "Buen estado",
  fair: "Estado regular",
  poor: "Con detalles",
};

interface Props {
  listing: ListingWithBook;
  onClose: () => void;
}

export default function QuickViewModal({ listing, onClose }: Props) {
  const { book } = listing;
  const coverUrl = listing.cover_image_url ?? book.cover_url;

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-ink/50 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-white/80 hover:bg-white text-ink-muted hover:text-ink transition-colors shadow-sm"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="flex flex-col sm:flex-row">
          {/* Cover */}
          <div className="relative aspect-[3/4] sm:w-48 sm:flex-shrink-0 bg-cream-warm flex items-center justify-center">
            {coverUrl ? (
              <Image
                src={coverUrl}
                alt={book.title}
                fill
                className="object-contain p-4"
                sizes="(max-width: 640px) 100vw, 192px"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-brand-50 to-cream-warm flex items-center justify-center">
                <svg className="w-16 h-16 text-brand-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.331 0 4.473.89 6.074 2.356M12 6.042a8.968 8.968 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.356M12 6.042V20.356" />
                </svg>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="p-5 flex-1 flex flex-col">
            <h2 className="font-display text-lg font-bold text-ink leading-tight">{book.title}</h2>
            {book.author && (
              <p className="text-sm text-ink-muted mt-1">{book.author}</p>
            )}

            <div className="flex flex-wrap gap-2 mt-3">
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 border border-gray-200">
                {CONDITION_LABELS[listing.condition] ?? listing.condition}
              </span>
              {book.genre && (
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-brand-50 text-brand-600 border border-brand-100">
                  {book.genre}
                </span>
              )}
            </div>

            {listing.price != null && (
              <p className="font-semibold text-2xl text-ink mt-4 tracking-tight">
                ${listing.price.toLocaleString("es-CL")}
              </p>
            )}

            {book.description && (
              <p className="text-sm text-ink-muted mt-3 line-clamp-3 leading-relaxed">
                {book.description}
              </p>
            )}

            <div className="flex gap-3 mt-auto pt-5">
              {listing.price != null && listing.modality !== "loan" && (
                <Link
                  href={`/checkout/${listing.id}`}
                  className="flex-1 flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
                >
                  Comprar
                </Link>
              )}
              <Link
                href={`/listings/${listing.id}`}
                className="flex-1 flex items-center justify-center gap-2 border-2 border-ink/10 hover:border-brand-500 text-ink hover:text-brand-600 font-semibold py-2.5 rounded-xl transition-colors text-sm"
              >
                Ver detalle
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
