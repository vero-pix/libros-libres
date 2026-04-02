"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

// Default center: Santiago de Chile
const DEFAULT_CENTER: [number, number] = [-70.6693, -33.4489];

interface LocationData {
  lat: number;
  lng: number;
  address: string;
}

interface Props {
  onLocationChange: (location: LocationData) => void;
}

export default function LocationPicker({ onLocationChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const [address, setAddress] = useState("");

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: DEFAULT_CENTER,
      zoom: 12,
    });

    map.addControl(new mapboxgl.NavigationControl(), "top-right");

    map.on("click", async (e) => {
      const { lng, lat } = e.lngLat;

      // Place / update marker
      if (markerRef.current) {
        markerRef.current.setLngLat([lng, lat]);
      } else {
        markerRef.current = new mapboxgl.Marker({ color: "#f0890f" })
          .setLngLat([lng, lat])
          .addTo(map);
      }

      // Reverse geocode with Mapbox
      try {
        const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
        const res = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${token}&language=es`
        );
        const data = await res.json();
        const placeName: string = data.features?.[0]?.place_name ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        setAddress(placeName);
        onLocationChange({ lat, lng, address: placeName });
      } catch {
        const fallback = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        setAddress(fallback);
        onLocationChange({ lat, lng, address: fallback });
      }
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [onLocationChange]);

  return (
    <div className="space-y-2">
      <div ref={containerRef} className="w-full h-48 rounded-xl overflow-hidden border border-gray-200" />
      {address ? (
        <p className="text-xs text-gray-600 flex items-center gap-1">
          <span>📍</span> {address}
        </p>
      ) : (
        <p className="text-xs text-gray-400">Hacé clic en el mapa para indicar la ubicación</p>
      )}
    </div>
  );
}
