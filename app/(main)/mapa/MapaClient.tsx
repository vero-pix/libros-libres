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

export default function MapaClient() {
  const [listings, setListings] = useState<ListingWithBook[]>([]);
  // Hasta que el mapa entrega los libros, la barra lateral no debe decir
  // "0 libros · No hay libros con estos filtros": eso se veía en cada carga.
  const [loaded, setLoaded] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [flyTo, setFlyTo] = useState<ListingWithBook | null>(null);

  const handleListingsLoaded = useCallback((data: ListingWithBook[]) => {
    setListings(data);
    setLoaded(true);
  }, []);

  const handleUserLocation = useCallback((loc: { lat: number; lng: number }) => {
    setUserLocation(loc);
  }, []);

  const handleListingClick = useCallback((listing: ListingWithBook) => {
    setFlyTo(listing);
  }, []);

  return (
    <div className="flex flex-1 overflow-hidden">
      <div className="hidden md:block">
        <MapSidebar
          listings={listings}
          loading={!loaded}
          userLocation={userLocation}
          onListingClick={handleListingClick}
        />
      </div>
      <main className="flex-1 relative">
        <MapErrorBoundary>
          <BookMap
            onListingsLoaded={handleListingsLoaded}
            onUserLocation={handleUserLocation}
            flyToListing={flyTo}
          />
        </MapErrorBoundary>
      </main>
    </div>
  );
}
