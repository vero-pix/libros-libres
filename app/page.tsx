import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/ui/Navbar";
import CategoriesSidebar from "@/components/ui/CategoriesSidebar";
import ListingToolbar from "@/components/listings/ListingToolbar";
import ListingCard from "@/components/listings/ListingCard";
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

      {!hasFilters && (
        <>
          {/* Hero — Editorial */}
          <section className="relative overflow-hidden min-h-[85vh] flex items-center">
            <Image
              src="https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=1400&q=80"
              alt="Biblioteca"
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-r from-ink/90 via-ink/70 to-transparent" />

            <div className="relative max-w-7xl mx-auto px-6 sm:px-12 py-20 w-full">
              <div className="max-w-2xl">
                <p className="font-display text-brand-400 text-sm tracking-[0.3em] uppercase mb-6">
                  Libre &middot; Sin comisiones &middot; Cerca de ti
                </p>

                <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-[1.1] tracking-tight">
                  Cada libro
                  <br />
                  merece ser
                  <br />
                  <span className="italic text-brand-400">descubierto</span>
                </h1>

                <p className="mt-8 text-lg text-cream-dark/90 leading-relaxed max-w-lg">
                  Conectamos lectores que buscan y ofrecen libros en su ciudad.
                  Publica gratis, paga seguro, recibe en tu casa.
                </p>

                <div className="mt-10 flex flex-wrap items-center gap-4">
                  <a
                    href="#tienda"
                    className="inline-flex items-center px-8 py-4 bg-cream text-ink font-semibold text-sm tracking-wide uppercase hover:bg-white transition-all duration-300 shadow-2xl"
                  >
                    Explorar libros
                  </a>
                  <Link
                    href="/publish"
                    className="inline-flex items-center px-8 py-4 border-2 border-cream/30 text-cream font-semibold text-sm tracking-wide uppercase hover:bg-cream/10 hover:border-cream/60 transition-all duration-300"
                  >
                    Publicar gratis
                  </Link>
                </div>

                {/* Stats */}
                <div className="mt-16 flex items-center gap-8 text-cream/70 text-sm">
                  <div>
                    <span className="font-display text-3xl font-bold text-white block">{totalListings}</span>
                    libros disponibles
                  </div>
                  <div className="w-px h-12 bg-cream/20" />
                  <div>
                    <span className="font-display text-3xl font-bold text-white block">100%</span>
                    gratis para vendedores
                  </div>
                  <div className="w-px h-12 bg-cream/20 hidden sm:block" />
                  <div className="hidden sm:block">
                    <span className="font-display text-3xl font-bold text-white block">Chile</span>
                    envío nacional
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Testimonial quotes — Editorial style */}
          <section className="bg-ink text-cream">
            <div className="max-w-6xl mx-auto px-6 py-20">
              <p className="text-xs font-medium tracking-[0.3em] uppercase text-brand-400 text-center mb-12">
                Historias reales
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-10">
                {[
                  "Necesito saber si alguien cerca tiene disponible los libros de Ken Wilber",
                  "Tengo una colección de García Márquez que ya leí y quiero que alguien más la disfrute",
                  "Busco un libro que ya no se edita y no lo encuentro en ninguna librería",
                  "Me mudé y necesito deshacerme de cajas de libros sin botarlos",
                ].map((q, i) => (
                  <blockquote
                    key={i}
                    className="border-l-2 border-brand-500 pl-6 py-2"
                  >
                    <p className="font-display text-lg italic text-cream-warm/90 leading-relaxed">
                      &ldquo;{q}&rdquo;
                    </p>
                  </blockquote>
                ))}
              </div>
              <p className="text-center text-cream/50 text-sm mt-12 tracking-wide">
                Libros Libres conecta personas que buscan y ofrecen libros en tu ciudad.
              </p>
            </div>
          </section>

          {/* Cómo funciona — Magazine layout */}
          <section className="bg-cream-warm">
            <div className="max-w-6xl mx-auto px-6 py-20">
              <p className="text-xs font-medium tracking-[0.3em] uppercase text-brand-600 text-center mb-3">
                Así de fácil
              </p>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-ink text-center mb-16">
                Cómo funciona
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-0 divide-y sm:divide-y-0 sm:divide-x divide-cream-dark">
                {[
                  { num: "01", title: "Busca", desc: "Encuentra por título, autor o categoría. Explora el mapa para ver libros cerca de ti." },
                  { num: "02", title: "Compra", desc: "Paga seguro con MercadoPago. Elige entre envío estándar o rápido a tu puerta." },
                  { num: "03", title: "Publica", desc: "Escanea el código de barras, ponle precio y listo. Sin comisiones. Siempre gratis." },
                ].map((step) => (
                  <div key={step.num} className="px-8 py-8 sm:py-0 text-center group">
                    <span className="font-display text-5xl font-bold text-brand-500/20 group-hover:text-brand-500/40 transition-colors">
                      {step.num}
                    </span>
                    <h3 className="font-display text-xl font-bold text-ink mt-2 mb-3">
                      {step.title}
                    </h3>
                    <p className="text-ink-muted text-sm leading-relaxed">
                      {step.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </>
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
