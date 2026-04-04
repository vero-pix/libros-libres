import { Suspense } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/ui/Navbar";
import CategoriesSidebar from "@/components/ui/CategoriesSidebar";
import ListingToolbar from "@/components/listings/ListingToolbar";
import ListingCard from "@/components/listings/ListingCard";
import HomeMapSection from "@/components/home/HomeMapSection";
import type { ListingWithBook } from "@/types";

interface Props {
  searchParams: {
    genre?: string;
    sort?: string;
    price_min?: string;
    price_max?: string;
    condition?: string;
    modality?: string;
  };
}

export default async function HomePage({ searchParams }: Props) {
  const supabase = await createClient();
  const { genre, sort, price_min, price_max, condition, modality } = searchParams;

  const hasFilters = !!(genre || sort || price_min || price_max || condition || modality);

  let query = supabase
    .from("listings")
    .select(`*, book:books(*), seller:users(id, full_name, avatar_url)`)
    .eq("status", "active");

  if (condition) query = query.eq("condition", condition);
  if (modality) query = query.eq("modality", modality);
  if (price_min) query = query.gte("price", Number(price_min));
  if (price_max) query = query.lte("price", Number(price_max));

  if (sort === "price_asc") {
    query = query.order("price", { ascending: true });
  } else if (sort === "price_desc") {
    query = query.order("price", { ascending: false });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  const { data: rawListings } = await query;
  let listings = (rawListings as unknown as ListingWithBook[]) ?? [];

  if (genre) {
    listings = listings.filter(
      (l) => l.book.genre?.toLowerCase() === genre.toLowerCase()
    );
  }

  const allListings = (rawListings as unknown as ListingWithBook[]) ?? [];
  const genreMap = new Map<string, number>();
  for (const l of allListings) {
    const g = l.book.genre;
    if (g) genreMap.set(g, (genreMap.get(g) ?? 0) + 1);
  }
  const categories = Array.from(genreMap.entries())
    .map(([genre, count]) => ({ genre, count }))
    .sort((a, b) => b.count - a.count);

  return (
    <div className="min-h-screen bg-cream">
      <Navbar />

      {/* Map — first thing a new user sees */}
      <HomeMapSection />

      {/* Quick value prop bar */}
      {!hasFilters && (
        <section className="bg-ink text-cream">
          <div className="max-w-7xl mx-auto px-6 py-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-8">
              {[
                { icon: "📍", text: "Libros geolocalizados" },
                { icon: "💳", text: "Pago seguro con MercadoPago" },
                { icon: "🚀", text: "Envío mismo día disponible" },
              ].map((item) => (
                <span key={item.text} className="flex items-center gap-2 text-xs text-cream/70">
                  <span>{item.icon}</span>
                  {item.text}
                </span>
              ))}
            </div>
            <Link
              href="/publish"
              className="inline-flex items-center px-5 py-2 bg-brand-500 text-white text-xs font-semibold uppercase tracking-wide hover:bg-brand-600 transition-colors"
            >
              Publicar libro gratis
            </Link>
          </div>
        </section>
      )}

      {/* Tienda */}
      <main id="tienda" className="max-w-7xl mx-auto px-6 py-10 scroll-mt-4">
        <div className="flex items-baseline justify-between mb-8">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-ink">
            {hasFilters ? "Resultados" : "Tienda"}
          </h2>
          <span className="text-sm text-ink-muted">
            {listings.length} {listings.length === 1 ? "libro" : "libros"}
          </span>
        </div>

        <div className="flex gap-10">
          <CategoriesSidebar categories={categories} activeGenre={genre} />

          <div className="flex-1 min-w-0">
            <Suspense>
              <ListingToolbar />
            </Suspense>

            {listings.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-5">
                {listings.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <p className="font-display text-2xl text-ink-light">No hay libros disponibles todavía.</p>
                <p className="text-sm text-ink-muted mt-2">Sé el primero en publicar un libro.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
