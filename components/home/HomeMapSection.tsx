"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import MapSidebar from "@/components/map/MapSidebar";
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
        <div className="absolute top-4 left-4 z-10 bg-ink/80 backdrop-blur-sm px-5 py-3 pointer-events-none">
          <h1 className="font-display text-lg sm:text-xl font-bold text-cream leading-tight">
            Libros cerca de ti
          </h1>
          <p className="text-cream/60 text-xs mt-1">
            {listings.length} libros en la red
          </p>
        </div>
        <BookMap
          onListingsLoaded={handleListingsLoaded}
          onUserLocation={handleUserLocation}
          flyToListing={flyTo}
        />
      </div>
    </section>
  );
}
