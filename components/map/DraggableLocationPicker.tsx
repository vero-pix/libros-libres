"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";
mapboxgl.accessToken = TOKEN;

const DEFAULT_CENTER: [number, number] = [-70.6693, -33.4489]; // Santiago

export interface LocationData {
  lat: number;
  lng: number;
  address: string;
}

interface Props {
  onLocationChange: (location: LocationData) => void;
  /** Se llama solo cuando el usuario usa GPS — útil para guardar en perfil */
  onGeolocated?: (location: LocationData) => void;
  initialLat?: number;
  initialLng?: number;
  initialAddress?: string;
}

async function reverseGeocode(lng: number, lat: number): Promise<string> {
  try {
    const res = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${TOKEN}&language=es&types=address,neighborhood,locality`
    );
    const data = await res.json();
    return data.features?.[0]?.place_name ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  } catch {
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  }
}

async function forwardGeocode(query: string): Promise<LocationData | null> {
  try {
    const res = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${TOKEN}&language=es&country=cl&types=address,place,locality`
    );
    const data = await res.json();
    if (!data.features?.length) return null;
    const f = data.features[0];
    const [lng, lat] = f.center as [number, number];
    return { lng, lat, address: f.place_name as string };
  } catch {
    return null;
  }
}

export default function DraggableLocationPicker({
  onLocationChange,
  onGeolocated,
  initialLat,
  initialLng,
  initialAddress,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const onLocationChangeRef = useRef(onLocationChange);
  const onGeolocatedRef = useRef(onGeolocated);
  onLocationChangeRef.current = onLocationChange;
  onGeolocatedRef.current = onGeolocated;

  const hasInitial = initialLat != null && initialLng != null;
  const initialCenter: [number, number] = hasInitial
    ? [initialLng!, initialLat!]
    : DEFAULT_CENTER;

  const [address, setAddress] = useState<string | null>(initialAddress ?? null);
  const [geocoding, setGeocoding] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [geolocating, setGeolocating] = useState(false);
  const [geoError, setGeoError] = useState(false);

  const updateLocation = useCallback(async (lng: number, lat: number, knownAddress?: string) => {
    setGeocoding(!knownAddress);
    const placeName = knownAddress ?? await reverseGeocode(lng, lat);
    setAddress(placeName);
    onLocationChangeRef.current({ lat, lng, address: placeName });
    setGeocoding(false);
  }, []);

  // Mueve marker y centra mapa — usado por GPS y búsqueda de dirección
  const moveMarkerTo = useCallback((lng: number, lat: number) => {
    markerRef.current?.setLngLat([lng, lat]);
    mapRef.current?.easeTo({ center: [lng, lat], zoom: 15 });
  }, []);

  async function handleGeolocate() {
    if (!navigator.geolocation) return;
    setGeolocating(true);
    setGeoError(false);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        moveMarkerTo(lng, lat);
        setGeocoding(true);
        const placeName = await reverseGeocode(lng, lat);
        setAddress(placeName);
        const loc: LocationData = { lat, lng, address: placeName };
        onLocationChangeRef.current(loc);
        onGeolocatedRef.current?.(loc); // notifica para guardar en perfil
        setGeocoding(false);
        setGeolocating(false);
      },
      () => {
        setGeolocating(false);
        setGeoError(true);
      },
      { timeout: 10000 }
    );
  }

  async function handleAddressSearch(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter" || !searchQuery.trim()) return;
    setSearching(true);
    const result = await forwardGeocode(searchQuery.trim());
    setSearching(false);
    if (!result) return;
    moveMarkerTo(result.lng, result.lat);
    setAddress(result.address);
    onLocationChangeRef.current(result);
    setSearchQuery("");
  }

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: initialCenter,
      zoom: hasInitial ? 15 : 12,
    });

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");

    map.on("load", () => {
      const center = map.getCenter();

      const marker = new mapboxgl.Marker({ color: "#f0890f", draggable: true })
        .setLngLat([center.lng, center.lat])
        .addTo(map);

      marker.on("dragend", () => {
        const pos = marker.getLngLat();
        updateLocation(pos.lng, pos.lat);
      });

      map.on("click", (e) => {
        marker.setLngLat([e.lngLat.lng, e.lngLat.lat]);
        updateLocation(e.lngLat.lng, e.lngLat.lat);
      });

      markerRef.current = marker;

      // Si hay ubicación inicial con dirección conocida, no reverse geocodear
      if (hasInitial && initialAddress) {
        onLocationChangeRef.current({
          lat: initialLat!,
          lng: initialLng!,
          address: initialAddress,
        });
      } else {
        updateLocation(center.lng, center.lat);
      }
    });

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-2">
      {/* Búsqueda de dirección */}
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleAddressSearch}
          placeholder="Busca una dirección y presiona Enter..."
          className="w-full px-3 py-2 pr-8 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
        />
        {searching && (
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 border-2 border-gray-300 border-t-brand-500 rounded-full animate-spin" />
        )}
      </div>

      {/* Mapa con botón GPS superpuesto */}
      <div className="relative">
        <div
          ref={containerRef}
          className="w-full h-56 rounded-xl overflow-hidden border border-gray-200"
        />
        <button
          type="button"
          onClick={handleGeolocate}
          disabled={geolocating}
          title="Usar mi ubicación actual"
          className="absolute bottom-2 left-2 z-10 bg-white border border-gray-200 shadow rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60 flex items-center gap-1.5 transition-colors"
        >
          {geolocating ? (
            <span className="w-3.5 h-3.5 border-2 border-gray-300 border-t-brand-500 rounded-full animate-spin" />
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-brand-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
            </svg>
          )}
          {geolocating ? "Obteniendo..." : "Mi ubicación"}
        </button>
      </div>

      {/* Dirección actual */}
      <div className="min-h-[18px]">
        {geocoding ? (
          <p className="text-xs text-gray-400 flex items-center gap-1">
            <span className="w-3 h-3 border border-gray-300 border-t-gray-500 rounded-full animate-spin inline-block" />
            Obteniendo dirección...
          </p>
        ) : geoError ? (
          <p className="text-xs text-red-500">
            No se pudo obtener tu ubicación. Arrastra el pin o busca una dirección.
          </p>
        ) : address ? (
          <p className="text-xs text-gray-600 flex items-start gap-1">
            <span className="mt-0.5 flex-shrink-0">📍</span>
            <span>{address}</span>
          </p>
        ) : (
          <p className="text-xs text-gray-400">
            Arrastra el pin, haz clic en el mapa o usa "Mi ubicación".
          </p>
        )}
      </div>
    </div>
  );
}
