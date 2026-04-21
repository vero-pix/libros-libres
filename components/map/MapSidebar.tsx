"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { ListingWithBook } from "@/types";
import { translateGenre } from "@/lib/genres";
import { libroUrl } from "@/lib/urls";

type SortMode = "distance" | "author" | "genre";

interface Props {
  listings: ListingWithBook[];
  userLocation: { lat: number; lng: number } | null;
  onListingClick: (listing: ListingWithBook) => void;
}

function haversineKm(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function MapSidebar({ listings, userLocation, onListingClick }: Props) {
  const [sortMode, setSortMode] = useState<SortMode>("distance");
  const [filterGenre, setFilterGenre] = useState<string>("");

  // Build genre list
  const genres = useMemo(() => {
    const set = new Set<string>();
    listings.forEach((l) => {
      if (l.book.genre) set.add(l.book.genre);
    });
    return Array.from(set).sort();
  }, [listings]);

  // Filter + sort
  const sorted = useMemo(() => {
    let filtered = listings;
    if (filterGenre) {
      filtered = filtered.filter((l) => l.book.genre === filterGenre);
    }

    return [...filtered].sort((a, b) => {
      const depA = !!(a as any).deprioritized, depB = !!(b as any).deprioritized;
      if (depA !== depB) return depA ? 1 : -1;
      if (sortMode === "distance" && userLocation) {
        const distA = haversineKm(userLocation.lat, userLocation.lng, a.latitude ?? 0, a.longitude ?? 0);
        const distB = haversineKm(userLocation.lat, userLocation.lng, b.latitude ?? 0, b.longitude ?? 0);
        return distA - distB;
      }
      if (sortMode === "author") {
        return (a.book.author ?? "").localeCompare(b.book.author ?? "");
      }
      if (sortMode === "genre") {
        return (a.book.genre ?? "").localeCompare(b.book.genre ?? "");
      }
      // Sin ubicación: coleccionables primero, luego featured, luego resto
      const colA = !!(a as any).is_collectible, colB = !!(b as any).is_collectible;
      if (colA !== colB) return colA ? -1 : 1;
      const featA = !!(a as any).featured, featB = !!(b as any).featured;
      if (featA !== featB) return featA ? -1 : 1;
      return 0;
    });
  }, [listings, sortMode, filterGenre, userLocation]);

  return (
    <aside className="w-80 bg-white border-r border-gray-200 flex flex-col overflow-hidden">
      {/* Filters header */}
      <div className="p-4 border-b border-gray-100 space-y-3">
        <h2 className="font-bold text-sm uppercase tracking-wider text-gray-900">
          Libros en el mapa
        </h2>

        {/* Sort */}
        <div>
          <label className="text-xs text-gray-500 block mb-1">Ordenar por</label>
          <select
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value as SortMode)}
            className="w-full text-sm border border-gray-200 rounded-md px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-400"
          >
            <option value="distance">Cercanía</option>
            <option value="author">Autor</option>
            <option value="genre">Categoría</option>
          </select>
        </div>

        {/* Genre filter */}
        <div>
          <label className="text-xs text-gray-500 block mb-1">Categoría</label>
          <select
            value={filterGenre}
            onChange={(e) => setFilterGenre(e.target.value)}
            className="w-full text-sm border border-gray-200 rounded-md px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-400"
          >
            <option value="">Todas</option>
            {genres.map((g) => (
              <option key={g} value={g}>{translateGenre(g)}</option>
            ))}
          </select>
        </div>

        <p className="text-xs text-gray-400">
          {sorted.length} {sorted.length === 1 ? "libro" : "libros"}
        </p>
      </div>

      {/* Listing list */}
      <div className="flex-1 overflow-y-auto">
        {sorted.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">
            No hay libros con estos filtros.
          </p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {sorted.map((listing) => {
              const dist =
                userLocation && listing.latitude && listing.longitude
                  ? haversineKm(
                      userLocation.lat,
                      userLocation.lng,
                      listing.latitude,
                      listing.longitude
                    )
                  : null;

              const coverUrl = (listing as any).cover_image_url || listing.book.cover_url;
              const isCollectible = !!(listing as any).is_collectible;
              const isFeatured = !!(listing as any).featured;
              return (
                <li key={listing.id} className="group relative">
                  <Link
                    href={libroUrl(listing)}
                    className="block px-4 py-3 pr-10 hover:bg-cream-warm transition-colors flex gap-3 items-start"
                  >
                    <div className={`relative flex-shrink-0 w-12 h-16 rounded overflow-hidden bg-cream-warm ${isCollectible ? "ring-2 ring-ink" : isFeatured ? "ring-2 ring-amber-400" : "ring-1 ring-gray-200"}`}>
                      {coverUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={coverUrl} alt={listing.book.title} className="w-full h-full object-cover" loading="lazy" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[8px] text-gray-400 p-1 text-center leading-tight">
                          {listing.book.title}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        {isCollectible && (
                          <span className="text-[8px] font-bold uppercase tracking-widest bg-ink text-cream px-1 py-0.5 rounded">
                            Colección
                          </span>
                        )}
                        <p className="text-sm font-medium text-gray-900 leading-tight line-clamp-1 group-hover:text-brand-600">
                          {listing.book.title}
                        </p>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                        {listing.book.author}
                      </p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {listing.price != null && (
                          <span className="text-xs font-semibold text-gray-900">
                            ${listing.price.toLocaleString("es-CL")}
                          </span>
                        )}
                        {listing.book.genre && (
                          <span className="text-xs text-gray-400">
                            {translateGenre(listing.book.genre)}
                          </span>
                        )}
                        {dist != null && (
                          <span className="text-xs text-brand-600 ml-auto">
                            {dist < 1
                              ? `${Math.round(dist * 1000)}m`
                              : `${dist.toFixed(1)}km`}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                  {listing.latitude != null && listing.longitude != null && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        onListingClick(listing);
                      }}
                      title="Ver en el mapa"
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full text-gray-400 hover:text-brand-600 hover:bg-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                      </svg>
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
}
