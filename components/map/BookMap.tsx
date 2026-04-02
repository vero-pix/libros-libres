"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import type { ListingWithBook } from "@/types";
import BookMapPopup from "./BookMapPopup";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

// Default center: Buenos Aires
const DEFAULT_CENTER: [number, number] = [-58.3816, -34.6037];
const DEFAULT_ZOOM = 12;

export default function BookMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [selectedListing, setSelectedListing] = useState<ListingWithBook | null>(null);
  const [listings, setListings] = useState<ListingWithBook[]>([]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
    });

    map.addControl(new mapboxgl.NavigationControl(), "top-right");
    map.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
      }),
      "top-right"
    );

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Fetch listings and add markers
  useEffect(() => {
    async function fetchListings() {
      const res = await fetch("/api/listings");
      if (!res.ok) return;
      const data: ListingWithBook[] = await res.json();
      setListings(data);
    }
    fetchListings();
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove existing markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    listings.forEach((listing) => {
      if (!listing.latitude || !listing.longitude) return;

      const el = document.createElement("div");
      el.className =
        "w-9 h-9 rounded-full bg-brand-500 border-2 border-white shadow-lg cursor-pointer flex items-center justify-center text-white font-bold text-xs hover:scale-110 transition-transform";
      el.innerHTML =
        listing.modality === "loan"
          ? "📖"
          : listing.modality === "sale"
          ? "🏷️"
          : "📚";

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([listing.longitude, listing.latitude])
        .addTo(map);

      el.addEventListener("click", () => setSelectedListing(listing));

      markersRef.current.push(marker);
    });
  }, [listings]);

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" />
      {selectedListing && (
        <BookMapPopup
          listing={selectedListing}
          onClose={() => setSelectedListing(null)}
        />
      )}
    </div>
  );
}
