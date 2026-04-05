import { Suspense } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/ui/Navbar";
import CategoriesSidebar from "@/components/ui/CategoriesSidebar";
import ListingToolbar from "@/components/listings/ListingToolbar";
import ListingCard from "@/components/listings/ListingCard";
import TiendaToggle from "@/components/home/TiendaToggle";
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
  const totalListings = allListings.length;
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

      {/* ── Hero compacto con scroll horizontal ── */}
      {!hasFilters && (
        <section className="bg-ink overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 py-6 flex items-center gap-8">
            {/* Tagline */}
            <div className="flex-shrink-0">
              <h1 className="font-display text-xl sm:text-2xl font-bold text-cream leading-tight">
                Cada estantería es una{" "}
                <span className="italic text-brand-400">librería.</span>
              </h1>
              <p className="text-cream/50 text-xs mt-1">
                {totalListings} libros en la red
              </p>
            </div>

            {/* Scroll horizontal de cards */}
            <div className="flex-1 overflow-x-auto scrollbar-hide">
              <div className="flex gap-4 min-w-max pr-6">
                {[
                  {
                    icon: (
                      <svg className="w-5 h-5 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                      </svg>
                    ),
                    title: "Mapa en tiempo real",
                    desc: "Libros geolocalizados cerca tuyo",
                  },
                  {
                    icon: (
                      <svg className="w-5 h-5 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
                      </svg>
                    ),
                    title: "Escanea y publica",
                    desc: "Del ISBN al mapa en 10 segundos",
                  },
                  {
                    icon: (
                      <svg className="w-5 h-5 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                      </svg>
                    ),
                    title: "Pago seguro",
                    desc: "MercadoPago protege cada compra",
                  },
                  {
                    icon: (
                      <svg className="w-5 h-5 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                      </svg>
                    ),
                    title: "Envío mismo día",
                    desc: "Chilexpress, Rappi o retiro",
                  },
                  {
                    icon: (
                      <svg className="w-5 h-5 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.331 0 4.473.89 6.074 2.356M12 6.042a8.968 8.968 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.356M12 6.042V20.356" />
                      </svg>
                    ),
                    title: "Arrienda libros",
                    desc: "Lee, devuelve, ahorra",
                  },
                ].map((card) => (
                  <div
                    key={card.title}
                    className="flex-shrink-0 w-44 bg-cream/[0.04] border border-cream/10 p-4 hover:bg-cream/[0.08] transition-colors"
                  >
                    {card.icon}
                    <h3 className="font-display font-bold text-cream text-xs mt-2 leading-tight">
                      {card.title}
                    </h3>
                    <p className="text-cream/50 text-[11px] mt-1 leading-snug">
                      {card.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <Link
              href="/publish"
              className="flex-shrink-0 hidden sm:inline-flex items-center px-5 py-2.5 bg-brand-500 text-white text-xs font-semibold uppercase tracking-wide hover:bg-brand-600 transition-colors"
            >
              Publicar gratis
            </Link>
          </div>
        </section>
      )}

      {/* ── Tienda ── */}
      <main id="tienda" className="max-w-7xl mx-auto px-6 py-10 scroll-mt-4">
        <TiendaToggle>
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
        </TiendaToggle>
      </main>
    </div>
  );
}
