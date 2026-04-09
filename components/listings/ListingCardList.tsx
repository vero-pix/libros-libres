"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { ListingWithBook } from "@/types";
import QuickViewModal from "./QuickViewModal";

const CONDITION_LABELS: Record<string, string> = {
  new: "Como nuevo",
  good: "Buen estado",
  fair: "Estado regular",
  poor: "Con detalles",
};

interface Props {
  listing: ListingWithBook;
}

export default function ListingCardList({ listing }: Props) {
  const [showQuickView, setShowQuickView] = useState(false);
  const { book } = listing;
  const coverUrl = listing.cover_image_url ?? book.cover_url;
  const sellerName = listing.seller?.full_name?.split(" ")[0] ?? "Vendedor";

  return (
    <>
      <div className="group bg-white overflow-hidden hover:shadow-xl transition-all duration-300 flex">
        {/* Cover */}
        <Link href={`/listings/${listing.id}`} className="relative w-32 sm:w-40 flex-shrink-0 bg-cream-warm flex items-center justify-center overflow-hidden">
          {coverUrl ? (
            <Image
              src={coverUrl}
              alt={book.title}
              fill
              className="object-contain p-3 group-hover:scale-105 transition-transform duration-500"
              sizes="160px"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-brand-50 to-cream-warm flex items-center justify-center">
              <svg className="w-10 h-10 text-brand-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.331 0 4.473.89 6.074 2.356M12 6.042a8.968 8.968 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.356M12 6.042V20.356" />
              </svg>
            </div>
          )}
          {listing.condition === "new" && (
            <span className="absolute top-2 left-2 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 bg-brand-500 text-white">
              Nuevo
            </span>
          )}
        </Link>

        {/* Info */}
        <div className="flex-1 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1 min-w-0">
            <Link href={`/listings/${listing.id}`}>
              <h3 className="text-sm font-semibold text-ink leading-tight line-clamp-2 group-hover:text-brand-700 transition-colors">
                {book.title}
              </h3>
            </Link>
            {book.author && (
              <p className="text-xs text-ink-muted mt-1 truncate">{book.author}</p>
            )}
            <div className="flex flex-wrap gap-1.5 mt-2">
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                {CONDITION_LABELS[listing.condition] ?? listing.condition}
              </span>
              {book.genre && (
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-brand-50 text-brand-600">
                  {book.genre}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 sm:flex-col sm:items-end sm:gap-2">
            {listing.price != null && (
              <p className="font-semibold text-ink text-lg tracking-tight">
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

          {/* Quick view button */}
          <button
            onClick={() => setShowQuickView(true)}
            className="hidden sm:flex items-center justify-center w-9 h-9 rounded-full border border-cream-dark text-ink-muted hover:text-brand-600 hover:border-brand-500 transition-colors flex-shrink-0"
            title="Vista rápida"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </div>

      {showQuickView && (
        <QuickViewModal listing={listing} onClose={() => setShowQuickView(false)} />
      )}
    </>
  );
}
