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
        properties: {
          id: l.id,
          featured: !!(l as any).featured,
          collectible: !!(l as any).is_collectible,
          tier: (l as any).is_collectible ? 2 : (l as any).featured ? 1 : 0,
        },
      })),
  };
}

interface BookMapProps {
  onListingsLoaded?: (listings: ListingWithBook[]) => void;
  onUserLocation?: (loc: { lat: number; lng: number }) => void;
  flyToListing?: ListingWithBook | null;
  /** Si se provee, usamos estos listings en vez de hacer fetch a /api/listings.
   *  Útil para vistas filtradas (ej. /search) que ya resolvieron los listings server-side. */
  listings?: ListingWithBook[];
}

export default function BookMap({ onListingsLoaded, onUserLocation, flyToListing, listings: externalListings }: BookMapProps = {}) {
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

      // Pin individual (sin cluster) — color según tier:
      //   0 = regular (dorado estándar)
      //   1 = featured (ámbar vibrante, más grande)
      //   2 = coleccionable (ink con borde dorado, más grande aún)
      map.addLayer({
        id: "unclustered",
        type: "circle",
        source: SOURCE_ID,
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-color": [
            "match", ["get", "tier"],
            2, "#1a1a1a",   // coleccionable → ink
            1, "#f5b841",   // featured → ámbar vibrante
            "#d4a017",      // regular → dorado
          ],
          "circle-radius": [
            "match", ["get", "tier"],
            2, 12,
            1, 11,
            9,
          ],
          "circle-stroke-width": [
            "match", ["get", "tier"],
            2, 3,
            1, 2.5,
            2,
          ],
          "circle-stroke-color": [
            "match", ["get", "tier"],
            2, "#d4a017",   // coleccionable → borde dorado
            "#fff",
          ],
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

  // 2. Resolver listings: si vienen como prop, usarlos directo (ej. /search);
  //    si no, fetch del API (comportamiento legacy para home y /mapa).
  useEffect(() => {
    if (externalListings) {
      setListings(externalListings);
      listingsRef.current = externalListings;
      onListingsLoaded?.(externalListings);
      return;
    }
    async function fetchListings() {
      const res = await fetch("/api/listings");
      if (!res.ok) return;
      const data: ListingWithBook[] = await res.json();
      setListings(data);
      listingsRef.current = data;
      onListingsLoaded?.(data);
    }
    fetchListings();
  }, [externalListings]);

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
