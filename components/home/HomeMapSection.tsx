"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import MapSidebar from "@/components/map/MapSidebar";
import MapErrorBoundary from "@/components/map/MapErrorBoundary";
import type { ListingWithBook } from "@/types";

const BookMap = dynamic(() => import("@/components/map/BookMap"), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-gray-100 animate-pulse" />,
});

export default function HomeMapSection() {
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
    <section className="relative w-full h-[65vh] sm:h-[70vh] flex border-b border-cream-dark">
      {/* Sidebar — desktop only */}
      <div className="hidden md:block">
        <MapSidebar
          listings={listings}
          userLocation={userLocation}
          onListingClick={handleListingClick}
        />
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        {/* Overlay headline on map */}
        <div className="absolute top-4 left-4 z-10 bg-ink/85 backdrop-blur-sm px-5 py-3 pointer-events-none rounded-sm">
          <h1 className="font-display text-lg sm:text-xl font-bold text-cream leading-tight">
            Libros a la vuelta de la esquina
          </h1>
          <p className="text-cream/70 text-xs mt-1">
            {listings.length > 0
              ? `${listings.length} ${listings.length === 1 ? "libro" : "libros"} esperando lector en Santiago`
              : "Cargando el mapa…"}
          </p>
          <div className="flex items-center gap-3 mt-2 text-[10px] text-cream/60">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-ink border-2 border-[#d4a017]" />
              Colección
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#f5b841] border border-white" />
              Destacado
            </span>
          </div>
        </div>
        <MapErrorBoundary>
          <BookMap
            onListingsLoaded={handleListingsLoaded}
            onUserLocation={handleUserLocation}
            flyToListing={flyTo}
          />
        </MapErrorBoundary>
      </div>
    </section>
  );
}
