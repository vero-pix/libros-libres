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
          {/* Hero — Libros vivos circulando */}
          <section className="relative overflow-hidden bg-ink min-h-[90vh] flex items-center">
            {/* Abstract flowing lines — representing circulation */}
            <div className="absolute inset-0 overflow-hidden">
              <svg className="absolute w-full h-full opacity-[0.06]" viewBox="0 0 1200 800" fill="none">
                <path d="M0 400 C300 100, 600 700, 900 300 S1200 500, 1500 200" stroke="#d4a017" strokeWidth="2" />
                <path d="M-100 500 C200 200, 500 600, 800 200 S1100 400, 1400 100" stroke="#d4a017" strokeWidth="1.5" />
                <path d="M0 600 C300 300, 700 500, 1000 200 S1200 300, 1500 100" stroke="#d4a017" strokeWidth="1" />
                <path d="M-200 300 C100 600, 400 100, 700 500 S1000 200, 1300 400" stroke="#faf8f4" strokeWidth="1" />
              </svg>
            </div>

            <div className="relative max-w-7xl mx-auto px-6 sm:px-12 py-20 w-full">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                {/* Left — Message */}
                <div>
                  <p className="text-brand-400 text-xs tracking-[0.4em] uppercase mb-8">
                    Libros vivos &middot; Circulando &middot; Cerca de ti
                  </p>

                  <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold text-cream leading-[1.05] tracking-tight">
                    Los libros
                    <br />
                    no se guardan.
                    <br />
                    <span className="italic text-brand-400">Circulan.</span>
                  </h1>

                  <p className="mt-8 text-lg text-cream/70 leading-relaxed max-w-lg">
                    Alguien cerca tiene el libro que buscas. Y alguien cerca busca
                    el libro que tú ya leíste. Libros Libres es el punto donde se encuentran.
                  </p>

                  <div className="mt-10 flex flex-wrap items-center gap-4">
                    <a
                      href="#tienda"
                      className="inline-flex items-center px-8 py-4 bg-brand-500 text-white font-semibold text-sm tracking-wide uppercase hover:bg-brand-600 transition-all duration-300"
                    >
                      Encontrar libros
                    </a>
                    <Link
                      href="/publish"
                      className="inline-flex items-center px-8 py-4 border border-cream/30 text-cream font-semibold text-sm tracking-wide uppercase hover:bg-cream/5 hover:border-cream/50 transition-all duration-300"
                    >
                      Liberar un libro
                    </Link>
                  </div>
                </div>

                {/* Right — The connection visual */}
                <div className="hidden lg:flex flex-col items-center gap-6">
                  <div className="bg-cream/5 border border-cream/10 p-6 w-full max-w-sm">
                    <p className="text-xs text-brand-400 uppercase tracking-widest mb-2">Alguien busca</p>
                    <p className="font-display text-xl text-cream italic">
                      &ldquo;Necesito los libros de Ken Wilber&rdquo;
                    </p>
                    <p className="text-cream/40 text-sm mt-2">Santiago, a 2 km de ti</p>
                  </div>

                  {/* Connection line */}
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-px h-6 bg-brand-500/50" />
                    <div className="w-8 h-8 rounded-full border-2 border-brand-500 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-brand-500" />
                    </div>
                    <div className="w-px h-6 bg-brand-500/50" />
                  </div>

                  <div className="bg-cream/5 border border-cream/10 p-6 w-full max-w-sm">
                    <p className="text-xs text-brand-400 uppercase tracking-widest mb-2">Alguien ofrece</p>
                    <p className="font-display text-xl text-cream italic">
                      &ldquo;Tengo 3 de Ken Wilber, los leí todos&rdquo;
                    </p>
                    <p className="text-cream/40 text-sm mt-2">Estación Central, a 4 km</p>
                  </div>

                  <p className="text-brand-400 font-display italic text-sm mt-2">
                    Libros Libres los conecta
                  </p>
                </div>
              </div>

              {/* Stats */}
              <div className="mt-20 pt-10 border-t border-cream/10 flex flex-wrap items-center justify-center gap-12 text-cream/60 text-sm">
                <div className="text-center">
                  <span className="font-display text-3xl font-bold text-cream block">{totalListings}</span>
                  libros circulando
                </div>
                <div className="w-px h-10 bg-cream/15 hidden sm:block" />
                <div className="text-center">
                  <span className="font-display text-3xl font-bold text-cream block">Gratis</span>
                  publicar siempre
                </div>
                <div className="w-px h-10 bg-cream/15 hidden sm:block" />
                <div className="text-center">
                  <span className="font-display text-3xl font-bold text-cream block">Chile</span>
                  envío a todo el país
                </div>
              </div>
            </div>
          </section>

          {/* The flow — buscar ↔ ofrecer */}
          <section className="bg-cream-warm border-y border-cream-dark">
            <div className="max-w-6xl mx-auto px-6 py-20">
              <p className="text-xs font-medium tracking-[0.3em] uppercase text-brand-600 text-center mb-3">
                Así de simple
              </p>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-ink text-center mb-4">
                Libros que no se estancan
              </h2>
              <p className="text-ink-muted text-center max-w-xl mx-auto mb-16">
                Cada libro publicado es un libro que encuentra un nuevo lector.
                Cada búsqueda es una historia que quiere continuar.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-0 divide-y sm:divide-y-0 sm:divide-x divide-cream-dark">
                {[
                  { num: "01", title: "Busca", desc: "Por título, autor o en el mapa. Alguien cerca tiene lo que buscas." },
                  { num: "02", title: "Conecta", desc: "Compra seguro con MercadoPago o contacta directo por WhatsApp." },
                  { num: "03", title: "Libera", desc: "Publica tus libros en segundos. Escanea, ponle precio, listo." },
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

          {/* Voices */}
          <section className="bg-ink text-cream">
            <div className="max-w-6xl mx-auto px-6 py-20">
              <p className="text-xs font-medium tracking-[0.3em] uppercase text-brand-400 text-center mb-12">
                Voces reales
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-10">
                {[
                  { q: "Tengo una colección de García Márquez que ya leí y quiero que alguien más la disfrute", tag: "Ofrece" },
                  { q: "Busco un libro que ya no se edita y no lo encuentro en ninguna librería", tag: "Busca" },
                  { q: "Quiero vender mis libros de la universidad pero no sé dónde", tag: "Ofrece" },
                  { q: "Busco libros infantiles para el colegio de mis hijos", tag: "Busca" },
                ].map((item, i) => (
                  <blockquote key={i} className="border-l-2 border-brand-500 pl-6 py-2">
                    <p className="text-xs text-brand-400 uppercase tracking-widest mb-2">{item.tag}</p>
                    <p className="font-display text-lg italic text-cream/85 leading-relaxed">
                      &ldquo;{item.q}&rdquo;
                    </p>
                  </blockquote>
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
