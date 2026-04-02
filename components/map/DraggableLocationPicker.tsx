"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

const DEFAULT_CENTER: [number, number] = [-70.6693, -33.4489]; // Santiago

interface LocationData {
  lat: number;
  lng: number;
  address: string;
}

interface Props {
  onLocationChange: (location: LocationData) => void;
}

async function reverseGeocode(lng: number, lat: number): Promise<string> {
  try {
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    const res = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${token}&language=es&types=address,neighborhood,locality`
    );
    const data = await res.json();
    return data.features?.[0]?.place_name ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  } catch {
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  }
}

export default function DraggableLocationPicker({ onLocationChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [geocoding, setGeocoding] = useState(false);
  const onLocationChangeRef = useRef(onLocationChange);
  onLocationChangeRef.current = onLocationChange;

  const updateLocation = useCallback(async (lng: number, lat: number) => {
    setGeocoding(true);
    const placeName = await reverseGeocode(lng, lat);
    setAddress(placeName);
    onLocationChangeRef.current({ lat, lng, address: placeName });
    setGeocoding(false);
  }, []);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: DEFAULT_CENTER,
      zoom: 12,
    });

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");

    // Crear marker draggable centrado al cargar el mapa
    map.on("load", () => {
      const center = map.getCenter();

      const marker = new mapboxgl.Marker({
        color: "#f0890f",
        draggable: true,
      })
        .setLngLat([center.lng, center.lat])
        .addTo(map);

      // Al soltar el marker tras arrastrar
      marker.on("dragend", () => {
        const pos = marker.getLngLat();
        updateLocation(pos.lng, pos.lat);
      });

      // También al hacer clic en el mapa: mueve el marker
      map.on("click", (e) => {
        marker.setLngLat([e.lngLat.lng, e.lngLat.lat]);
        updateLocation(e.lngLat.lng, e.lngLat.lat);
      });

      markerRef.current = marker;

      // Posición inicial
      updateLocation(center.lng, center.lat);
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, [updateLocation]);

  return (
    <div className="space-y-2">
      <div
        ref={containerRef}
        className="w-full h-56 rounded-xl overflow-hidden border border-gray-200"
      />
      <div className="flex items-start gap-1.5 min-h-[20px]">
        {geocoding ? (
          <p className="text-xs text-gray-400 flex items-center gap-1">
            <span className="w-3 h-3 border border-gray-300 border-t-gray-500 rounded-full animate-spin inline-block" />
            Obteniendo dirección...
          </p>
        ) : address ? (
          <p className="text-xs text-gray-600 flex items-start gap-1">
            <span className="mt-0.5 flex-shrink-0">📍</span>
            <span>{address}</span>
          </p>
        ) : (
          <p className="text-xs text-gray-400">Arrastra el pin o haz clic para elegir la ubicación.</p>
        )}
      </div>
    </div>
  );
}
