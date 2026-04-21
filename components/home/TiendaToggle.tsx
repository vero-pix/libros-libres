"use client";

import { useState, useCallback, useEffect, type ReactNode } from "react";
import dynamic from "next/dynamic";
import MapSidebar from "@/components/map/MapSidebar";
import MapErrorBoundary from "@/components/map/MapErrorBoundary";
import type { ListingWithBook } from "@/types";

const BookMap = dynamic(() => import("@/components/map/BookMap"), {
  ssr: false,
  loading: () => <div className="w-full h-[60vh] bg-gray-100 animate-pulse" />,
});

interface Props {
  children: ReactNode;
  forceMap?: boolean;
  onForceMapConsumed?: () => void;
}

export default function TiendaToggle({ children, forceMap, onForceMapConsumed }: Props) {
  const [view, setView] = useState<"grid" | "map">("grid");

  useEffect(() => {
    if (forceMap) {
      setView("map");
      onForceMapConsumed?.();
    }
  }, [forceMap, onForceMapConsumed]);
  const [listings, setListings] = useState<ListingWithBook[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [flyTo, setFlyTo] = useState<ListingWithBook | null>(null);

  const handleListingsLoaded = useCallback((data: ListingWithBook[]) => {
    setListings(data);
  }, []);

  const handleUserLocation = useCallback((loc: { lat: number; lng: number }) => {
    setUserLocation(loc);
  }, []);

  const handleListingClick = useCallback((listing: ListingWithBook) => {
    setFlyTo(listing);
  }, []);

  return (
    <div>
      {/* Header row: title + toggle */}
      <div className="flex items-center justify-between mb-8">
        <h2 className="font-display text-2xl sm:text-3xl font-bold text-ink">
          Tienda
        </h2>

        <div className="flex items-center gap-1 bg-cream-warm border border-cream-dark rounded-md p-1">
          <button
            onClick={() => setView("grid")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded transition-colors ${
              view === "grid"
                ? "bg-ink text-cream"
                : "text-ink-muted hover:text-ink"
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
            </svg>
            Grilla
          </button>
          <button
            onClick={() => setView("map")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded transition-colors ${
              view === "map"
                ? "bg-ink text-cream"
                : "text-ink-muted hover:text-ink"
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
            Mapa
          </button>
        </div>
      </div>

      {/* Content */}
      {view === "grid" ? (
        children
      ) : (
        <div className="flex h-[60vh] border border-cream-dark rounded-md overflow-hidden">
          <div className="hidden md:block">
            <MapSidebar
              listings={listings}
              userLocation={userLocation}
              onListingClick={handleListingClick}
            />
          </div>
          <div className="flex-1 relative">
            <MapErrorBoundary>
              <BookMap
                onListingsLoaded={handleListingsLoaded}
                onUserLocation={handleUserLocation}
                flyToListing={flyTo}
              />
            </MapErrorBoundary>
          </div>
        </div>
      )}
    </div>
  );
}
