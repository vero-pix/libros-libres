"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { ListingWithBook } from "@/types";
import QuickViewModal from "./QuickViewModal";

function isNew(createdAt: string) {
  const diff = Date.now() - new Date(createdAt).getTime();
  return diff < 7 * 24 * 60 * 60 * 1000;
}

function hasDiscount(listing: ListingWithBook) {
  const orig = (listing as unknown as Record<string, unknown>).original_price;
  return orig != null && Number(orig) > (listing.price ?? 0);
}

interface Props {
  listing: ListingWithBook;
}

const BLUR_PLACEHOLDER = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjI2NyIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjVmMGU4Ii8+PC9zdmc+";

export default function ListingCard({ listing }: Props) {
  const [showQuickView, setShowQuickView] = useState(false);
  const [imgError, setImgError] = useState(false);
  const { book } = listing;
  const coverUrl = listing.cover_image_url ?? book.cover_url;
  const sellerName = listing.seller?.full_name?.split(" ")[0] ?? "Vendedor";

  const placeholder = (
    <div className="w-full h-full bg-gradient-to-br from-brand-50 to-cream-warm flex flex-col items-center justify-center gap-2 p-4">
      <svg className="w-12 h-12 text-brand-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.331 0 4.473.89 6.074 2.356M12 6.042a8.968 8.968 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.356M12 6.042V20.356" />
      </svg>
      <span className="text-[10px] text-brand-400 font-medium text-center leading-tight">{book.title}</span>
    </div>
  );

  return (
    <>
    <div className="group bg-white overflow-hidden hover:shadow-xl transition-all duration-300 relative border border-cream-dark/30 rounded-lg">
      <Link href={`/listings/${listing.id}`} className="block">
        <div className="relative aspect-[3/4] bg-cream-warm flex items-center justify-center overflow-hidden">
          {coverUrl && !imgError ? (
            <Image
              src={coverUrl}
              alt={book.title}
              fill
              className="object-contain p-3 group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
              placeholder="blur"
              blurDataURL={BLUR_PLACEHOLDER}
              onError={() => setImgError(true)}
              onLoad={(e) => {
                const img = e.currentTarget as HTMLImageElement;
                if (img.naturalWidth < 10 || img.naturalHeight < 10) setImgError(true);
              }}
            />
          ) : (
            placeholder
          )}
          <div className="absolute top-3 right-3 flex flex-col gap-1 items-end">
            {isNew(listing.created_at) && (
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm bg-brand-500 text-white">
                Nuevo
              </span>
            )}
            {hasDiscount(listing) && (
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm bg-red-500 text-white">
                Oferta
              </span>
            )}
          </div>
          {listing._featured && (
            <span className="absolute bottom-3 left-3 w-5 h-5" title="Libro destacado">
              <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 drop-shadow">
                <path d="M12 2L3 7v6c0 5.25 3.83 10.16 9 11.25C17.17 23.16 21 18.25 21 13V7l-9-5z" fill="#D4A017"/>
                <path d="M10 15.5l-3-3 1.4-1.4L10 12.7l5.6-5.6L17 8.5l-7 7z" fill="#fff"/>
              </svg>
            </span>
          )}
        </div>
      </Link>

      {/* Hover actions */}
      <div className="absolute bottom-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200">
        <button
          onClick={() => setShowQuickView(true)}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-white shadow-md text-ink-muted hover:text-brand-600"
          title="Vista rápida"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
        <Link
          href={`/checkout/${listing.id}`}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-brand-500 shadow-md text-white hover:bg-brand-600"
          title="Comprar"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
          </svg>
        </Link>
      </div>

      <div className="p-4">
        <Link href={`/listings/${listing.id}`}>
          <h3 className="text-sm font-semibold text-ink leading-tight line-clamp-2 group-hover:text-brand-700 transition-colors">
            {book.title}
          </h3>
        </Link>
        {book.author && (
          <p className="text-xs text-ink-muted mt-1 truncate">{book.author}</p>
        )}
        {(listing._review_count ?? 0) > 0 && (
          <div className="flex items-center gap-1 mt-1">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <svg
                  key={star}
                  className={`w-3 h-3 ${star <= Math.round(listing._avg_rating ?? 0) ? "text-amber-400" : "text-gray-200"}`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <span className="text-[10px] text-ink-muted">({listing._review_count})</span>
          </div>
        )}

        <div className="flex items-baseline justify-between mt-3">
          {listing.price != null && (
            <div className="flex items-baseline gap-1.5">
              {(listing as unknown as Record<string, unknown>).original_price != null &&
                Number((listing as unknown as Record<string, unknown>).original_price) > listing.price && (
                <span className="text-sm text-gray-400 line-through">
                  ${Number((listing as unknown as Record<string, unknown>).original_price).toLocaleString("es-CL")}
                </span>
              )}
              <p className="font-semibold text-ink text-base tracking-tight">
                ${listing.price.toLocaleString("es-CL")}
              </p>
            </div>
          )}
          <Link
            href={`/vendedor/${listing.seller_id}`}
            className="text-[11px] text-ink-muted hover:text-brand-600 transition-colors flex items-center gap-1"
          >
            <span className="w-4 h-4 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center text-[8px] font-bold flex-shrink-0">
              {sellerName[0].toUpperCase()}
            </span>
            {sellerName}
          </Link>
        </div>
      </div>
    </div>

    {showQuickView && (
      <QuickViewModal listing={listing} onClose={() => setShowQuickView(false)} />
    )}
    </>
  );
}
