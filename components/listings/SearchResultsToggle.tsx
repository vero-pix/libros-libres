"use client";

import { useState, useCallback, type ReactNode } from "react";
import dynamic from "next/dynamic";
import MapSidebar from "@/components/map/MapSidebar";
import MapErrorBoundary from "@/components/map/MapErrorBoundary";
import type { ListingWithBook } from "@/types";

const BookMap = dynamic(() => import("@/components/map/BookMap"), {
  ssr: false,
  loading: () => <div className="w-full h-[60vh] bg-gray-100 animate-pulse rounded-md" />,
});

interface Props {
  listings: ListingWithBook[];
  resultsCount: number;
  children: ReactNode; // grid server-rendered
}

export default function SearchResultsToggle({ listings, resultsCount, children }: Props) {
  const [view, setView] = useState<"grid" | "map">("grid");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [flyTo, setFlyTo] = useState<ListingWithBook | null>(null);

  const handleUserLocation = useCallback((loc: { lat: number; lng: number }) => {
    setUserLocation(loc);
  }, []);

  const handleListingClick = useCallback((listing: ListingWithBook) => {
    setFlyTo(listing);
  }, []);

  const listingsWithCoords = listings.filter((l) => l.latitude != null && l.longitude != null);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-ink-muted">
          {resultsCount} {resultsCount === 1 ? "libro" : "libros"}
          {view === "map" && listingsWithCoords.length !== listings.length && (
            <span className="text-ink-muted/70">
              {" "}
              · {listingsWithCoords.length} con ubicación en el mapa
            </span>
          )}
        </p>

        <div className="flex items-center gap-1 bg-cream-warm border border-cream-dark rounded-md p-1">
          <button
            onClick={() => setView("grid")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded transition-colors ${
              view === "grid" ? "bg-ink text-cream" : "text-ink-muted hover:text-ink"
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
              />
            </svg>
            Grilla
          </button>
          <button
            onClick={() => setView("map")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded transition-colors ${
              view === "map" ? "bg-ink text-cream" : "text-ink-muted hover:text-ink"
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
              />
            </svg>
            Mapa
          </button>
        </div>
      </div>

      {view === "grid" ? (
        children
      ) : listingsWithCoords.length > 0 ? (
        <div className="flex h-[65vh] border border-cream-dark rounded-md overflow-hidden">
          <div className="hidden md:block">
            <MapSidebar
              listings={listingsWithCoords}
              userLocation={userLocation}
              onListingClick={handleListingClick}
            />
          </div>
          <div className="flex-1 relative">
            <MapErrorBoundary>
              <BookMap
                listings={listingsWithCoords}
                onUserLocation={handleUserLocation}
                flyToListing={flyTo}
              />
            </MapErrorBoundary>
          </div>
        </div>
      ) : (
        <div className="text-center py-16 bg-cream-warm/40 border border-cream-dark/30 rounded-md">
          <p className="text-ink-muted">
            Ninguno de los libros filtrados tiene ubicación registrada.
          </p>
          <p className="text-xs text-ink-muted/70 mt-1">
            Probá ampliar los filtros o volver a la grilla.
          </p>
        </div>
      )}
    </div>
  );
}
