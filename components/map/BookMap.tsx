"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import type { ListingWithBook } from "@/types";
import BookMapPopup from "./BookMapPopup";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

const DEFAULT_CENTER: [number, number] = [-70.6693, -33.4489];
const DEFAULT_ZOOM = 12;
const SOURCE_ID = "books";

function buildGeoJSON(listings: ListingWithBook[]): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: listings
      .filter((l) => l.latitude != null && l.longitude != null)
      .map((l) => ({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [l.longitude!, l.latitude!],
        },
        properties: { id: l.id },
      })),
  };
}

interface BookMapProps {
  onListingsLoaded?: (listings: ListingWithBook[]) => void;
  onUserLocation?: (loc: { lat: number; lng: number }) => void;
  flyToListing?: ListingWithBook | null;
}

export default function BookMap({ onListingsLoaded, onUserLocation, flyToListing }: BookMapProps = {}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const listingsRef = useRef<ListingWithBook[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [listings, setListings] = useState<ListingWithBook[]>([]);
  const [selectedListing, setSelectedListing] = useState<ListingWithBook | null>(null);

  // 1. Initialize map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
    });

    map.addControl(new mapboxgl.NavigationControl(), "top-right");
    const geolocate = new mapboxgl.GeolocateControl({
      positionOptions: { enableHighAccuracy: true },
      trackUserLocation: true,
    });
    map.addControl(geolocate, "top-right");
    geolocate.on("geolocate", (e: GeolocationPosition) => {
      onUserLocation?.({ lat: e.coords.latitude, lng: e.coords.longitude });
    });

    map.on("load", () => {
      // GeoJSON source con clustering habilitado
      map.addSource(SOURCE_ID, {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
        cluster: true,
        clusterMaxZoom: 15,
        clusterRadius: 50,
      });

      // Círculos de cluster (fondo naranja, tamaño según cantidad)
      map.addLayer({
        id: "clusters",
        type: "circle",
        source: SOURCE_ID,
        filter: ["has", "point_count"],
        paint: {
          "circle-color": [
            "step", ["get", "point_count"],
            "#d4a017",   // 1–9
            10,  "#b8860b",  // 10–49
            50,  "#966d09",  // 50+
          ],
          "circle-radius": [
            "step", ["get", "point_count"],
            22,   // 1–9
            10, 30,   // 10–49
            50, 38,   // 50+
          ],
          "circle-stroke-width": 2,
          "circle-stroke-color": "#fff",
        },
      });

      // Número dentro del cluster
      map.addLayer({
        id: "cluster-count",
        type: "symbol",
        source: SOURCE_ID,
        filter: ["has", "point_count"],
        layout: {
          "text-field": "{point_count_abbreviated}",
          "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
          "text-size": 13,
        },
        paint: { "text-color": "#fff" },
      });

      // Pin individual (sin cluster)
      map.addLayer({
        id: "unclustered",
        type: "circle",
        source: SOURCE_ID,
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-color": "#d4a017",
          "circle-radius": 9,
          "circle-stroke-width": 2,
          "circle-stroke-color": "#fff",
        },
      });

      // Click en cluster → zoom para expandir
      map.on("click", "clusters", (e) => {
        const features = map.queryRenderedFeatures(e.point, { layers: ["clusters"] });
        if (!features.length) return;
        const clusterId = features[0].properties?.cluster_id as number;
        const coords = (features[0].geometry as GeoJSON.Point).coordinates as [number, number];
        (map.getSource(SOURCE_ID) as mapboxgl.GeoJSONSource).getClusterExpansionZoom(
          clusterId,
          (err, zoom) => {
            if (err) return;
            map.easeTo({ center: coords, zoom: (zoom ?? DEFAULT_ZOOM) + 1 });
          }
        );
      });

      // Click en pin individual → mostrar popup
      map.on("click", "unclustered", (e) => {
        const id = e.features?.[0]?.properties?.id as string | undefined;
        if (!id) return;
        const listing = listingsRef.current.find((l) => l.id === id);
        if (listing) setSelectedListing(listing);
      });

      // Cursores
      map.on("mouseenter", "clusters", () => { map.getCanvas().style.cursor = "pointer"; });
      map.on("mouseleave", "clusters", () => { map.getCanvas().style.cursor = ""; });
      map.on("mouseenter", "unclustered", () => { map.getCanvas().style.cursor = "pointer"; });
      map.on("mouseleave", "unclustered", () => { map.getCanvas().style.cursor = ""; });

      setMapLoaded(true);
    });

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // 2. Fetch listings
  useEffect(() => {
    async function fetchListings() {
      const res = await fetch("/api/listings");
      if (!res.ok) return;
      const data: ListingWithBook[] = await res.json();
      setListings(data);
      listingsRef.current = data;
      onListingsLoaded?.(data);
    }
    fetchListings();
  }, []);

  // 3. Fly to listing when sidebar item is clicked
  useEffect(() => {
    if (!flyToListing || !mapRef.current || !mapLoaded) return;
    if (flyToListing.latitude && flyToListing.longitude) {
      mapRef.current.flyTo({
        center: [flyToListing.longitude, flyToListing.latitude],
        zoom: 15,
      });
      setSelectedListing(flyToListing);
    }
  }, [flyToListing, mapLoaded]);

  // 4. Actualizar source cuando cambien listings o el mapa esté listo
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;
    const source = mapRef.current.getSource(SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;
    if (!source) return;
    source.setData(buildGeoJSON(listings));
  }, [listings, mapLoaded]);

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
