"use client";

import { useState, useMemo } from "react";
import type { ListingWithBook } from "@/types";
import ListingCard from "./ListingCard";

interface Props {
  listings: ListingWithBook[];
}

export default function SellerListingsGrid({ listings }: Props) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return listings;
    return listings.filter((l) => {
      const title = l.book.title?.toLowerCase() ?? "";
      const author = l.book.author?.toLowerCase() ?? "";
      return title.includes(q) || author.includes(q);
    });
  }, [query, listings]);

  return (
    <div>
      {/* Search input */}
      <div className="relative mb-5">
        <svg
          className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted/60 pointer-events-none"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
          />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por título o autor..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-cream-dark/40 bg-cream-warm/50 text-sm text-ink placeholder:text-ink-muted/50 focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-300 transition-colors"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted/60 hover:text-ink transition-colors"
            aria-label="Limpiar búsqueda"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Results count when filtering */}
      {query && (
        <p className="text-xs text-ink-muted mb-3">
          {filtered.length} {filtered.length === 1 ? "resultado" : "resultados"} para &ldquo;{query}&rdquo;
        </p>
      )}

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
          {filtered.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      ) : (
        <div className="text-center py-10 text-ink-muted">
          <p className="text-sm">No se encontraron libros para &ldquo;{query}&rdquo;</p>
        </div>
      )}
    </div>
  );
}
