import { notFound } from "next/navigation";
import { createPublicClient } from "@/lib/supabase/public";
import ListingCard from "@/components/listings/ListingCard";
import type { Metadata } from "next";
import type { ListingWithBook } from "@/types";

export const revalidate = 3600;

// Coordenadas del centro de cada capital regional
const CIUDADES: Record<string, { label: string; lat: number; lng: number; description: string }> = {
  santiago: {
    label: "Santiago",
    lat: -33.4569,
    lng: -70.6483,
    description: "El mayor catálogo de libros usados de la Región Metropolitana. Retira en mano en Providencia, Ñuñoa, Las Condes y comunas cercanas, o recíbelos por courier en tu casa.",
  },
  valparaiso: {
    label: "Valparaíso",
    lat: -33.0458,
    lng: -71.6197,
    description: "Libros usados en Valparaíso y el Gran Valparaíso. Compra con envío a domicilio o coordina retiro directo con el vendedor.",
  },
  "vina-del-mar": {
    label: "Viña del Mar",
    lat: -33.0245,
    lng: -71.5518,
    description: "Libros usados en Viña del Mar y alrededores. Pago seguro con MercadoPago, despacho a tu puerta o retiro en persona.",
  },
  concepcion: {
    label: "Concepción",
    lat: -36.8201,
    lng: -73.0444,
    description: "Libros usados en Concepción y el Gran Biobío. Compra y vende con pago seguro, envío por courier o retiro en mano.",
  },
  temuco: {
    label: "Temuco",
    lat: -38.7359,
    lng: -72.5904,
    description: "Libros usados en Temuco y la Araucanía. Catálogo actualizado con envío a todo Chile o retiro directo.",
  },
  antofagasta: {
    label: "Antofagasta",
    lat: -23.6509,
    lng: -70.3975,
    description: "Libros usados en Antofagasta. Pago seguro con MercadoPago y envío por courier a tu dirección.",
  },
  "la-serena": {
    label: "La Serena",
    lat: -29.9027,
    lng: -71.2519,
    description: "Libros usados en La Serena y Coquimbo. Compra con garantía de pago seguro y envío a domicilio.",
  },
};

const RADIUS_KM = 50;

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function generateStaticParams() {
  return Object.keys(CIUDADES).map((ciudad) => ({ ciudad }));
}

export async function generateMetadata({ params }: { params: { ciudad: string } }): Promise<Metadata> {
  const city = CIUDADES[params.ciudad];
  if (!city) return { title: "Ciudad no encontrada — tuslibros.cl" };

  const title = `Libros usados en ${city.label} | tuslibros.cl`;
  const url = `https://tuslibros.cl/ciudad/${params.ciudad}`;

  return {
    title,
    description: city.description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description: city.description,
      url,
      siteName: "tuslibros.cl",
      type: "website",
      locale: "es_CL",
    },
  };
}

async function getListingsNearCity(lat: number, lng: number): Promise<ListingWithBook[]> {
  const supabase = createPublicClient();

  // Bounding box ~50km: 1° lat ≈ 111km, 1° lng ≈ 111km·cos(lat)
  const deltaLat = RADIUS_KM / 111;
  const deltaLng = RADIUS_KM / (111 * Math.cos((lat * Math.PI) / 180));

  const { data } = await supabase
    .from("listings")
    .select(`*, book:books(*), seller:users(id, full_name, avatar_url, username, mercadopago_user_id)`)
    .eq("status", "active")
    .not("latitude", "is", null)
    .not("longitude", "is", null)
    .gte("latitude", lat - deltaLat)
    .lte("latitude", lat + deltaLat)
    .gte("longitude", lng - deltaLng)
    .lte("longitude", lng + deltaLng)
    .order("created_at", { ascending: false })
    .limit(200);

  if (!data) return [];

  // Filtro exacto con Haversine sobre el bounding box
  return (data as unknown as ListingWithBook[])
    .filter((l) => {
      const lLat = (l as any).latitude;
      const lLng = (l as any).longitude;
      return lLat != null && lLng != null && haversineKm(lat, lng, lLat, lLng) <= RADIUS_KM;
    })
    .slice(0, 60);
}

export default async function CiudadPage({ params }: { params: { ciudad: string } }) {
  const city = CIUDADES[params.ciudad];
  if (!city) notFound();

  const listings = await getListingsNearCity(city.lat, city.lng);

  return (
    <div className="min-h-screen bg-cream">
      <main className="max-w-7xl mx-auto px-6 py-10">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-widest text-ink-muted mb-2">Libros usados · {city.label}</p>
          <h1 className="font-display text-3xl sm:text-4xl text-ink mb-3">
            Libros usados en {city.label}
          </h1>
          <p className="text-ink-muted max-w-2xl leading-relaxed">{city.description}</p>
        </div>

        {listings.length > 0 ? (
          <>
            <p className="text-sm text-ink-muted mb-6">
              {listings.length} libro{listings.length !== 1 ? "s" : ""} disponible{listings.length !== 1 ? "s" : ""} en un radio de {RADIUS_KM} km
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-5">
              {listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-20">
            <p className="font-display text-2xl text-ink-light mb-2">
              Aún no hay libros publicados en {city.label}.
            </p>
            <p className="text-sm text-ink-muted">
              Si tienes libros en {city.label}, publica gratis y llega a compradores locales.
            </p>
            <a
              href="/publish"
              className="inline-block mt-6 px-6 py-2.5 bg-brand-600 text-white rounded-full text-sm font-semibold hover:bg-brand-700 transition-colors"
            >
              Publicar un libro →
            </a>
          </div>
        )}
      </main>
    </div>
  );
}
