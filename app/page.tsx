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
          {/* Hero — The Uber for Books */}
          <section className="relative overflow-hidden bg-ink min-h-[90vh] flex items-center">
            {/* Network nodes — representing the distributed bookshelf */}
            <div className="absolute inset-0 overflow-hidden">
              <svg className="absolute w-full h-full opacity-[0.07]" viewBox="0 0 1200 800" fill="none">
                {/* Network connections */}
                <circle cx="200" cy="200" r="4" fill="#d4a017" />
                <circle cx="450" cy="350" r="4" fill="#d4a017" />
                <circle cx="300" cy="500" r="4" fill="#d4a017" />
                <circle cx="700" cy="150" r="4" fill="#d4a017" />
                <circle cx="900" cy="400" r="4" fill="#d4a017" />
                <circle cx="600" cy="600" r="4" fill="#d4a017" />
                <circle cx="1050" cy="250" r="4" fill="#d4a017" />
                <circle cx="800" cy="650" r="4" fill="#d4a017" />
                <circle cx="150" cy="650" r="4" fill="#d4a017" />
                <circle cx="1000" cy="550" r="4" fill="#d4a017" />
                <line x1="200" y1="200" x2="450" y2="350" stroke="#d4a017" strokeWidth="0.5" />
                <line x1="450" y1="350" x2="300" y2="500" stroke="#d4a017" strokeWidth="0.5" />
                <line x1="450" y1="350" x2="700" y2="150" stroke="#d4a017" strokeWidth="0.5" />
                <line x1="700" y1="150" x2="900" y2="400" stroke="#d4a017" strokeWidth="0.5" />
                <line x1="700" y1="150" x2="1050" y2="250" stroke="#d4a017" strokeWidth="0.5" />
                <line x1="900" y1="400" x2="600" y2="600" stroke="#d4a017" strokeWidth="0.5" />
                <line x1="900" y1="400" x2="1000" y2="550" stroke="#d4a017" strokeWidth="0.5" />
                <line x1="600" y1="600" x2="800" y2="650" stroke="#d4a017" strokeWidth="0.5" />
                <line x1="300" y1="500" x2="150" y2="650" stroke="#d4a017" strokeWidth="0.5" />
                <line x1="300" y1="500" x2="600" y2="600" stroke="#d4a017" strokeWidth="0.5" />
                <line x1="200" y1="200" x2="700" y2="150" stroke="#faf8f4" strokeWidth="0.3" />
                <line x1="1050" y1="250" x2="1000" y2="550" stroke="#faf8f4" strokeWidth="0.3" />
              </svg>
            </div>

            <div className="relative max-w-7xl mx-auto px-6 sm:px-12 py-20 w-full">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                {/* Left — The big idea */}
                <div>
                  <div className="inline-flex items-center gap-2 bg-brand-500/10 border border-brand-500/20 px-4 py-2 mb-8">
                    <div className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
                    <p className="text-brand-400 text-xs tracking-[0.3em] uppercase">
                      Red activa en Chile
                    </p>
                  </div>

                  <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold text-cream leading-[1.05] tracking-tight">
                    Cada estantería
                    <br />
                    es una{" "}
                    <span className="italic text-brand-400">librería.</span>
                  </h1>

                  <p className="mt-6 font-display text-xl text-cream/50 italic">
                    Solo faltaba hacerlas visibles.
                  </p>

                  <p className="mt-6 text-base text-cream/65 leading-relaxed max-w-lg">
                    Uber convirtió cada auto en un taxi. Nosotros convertimos cada
                    estantería en una librería. Geolocalización en tiempo real, pago
                    seguro, despacho a tu puerta. La red de libros más grande de Chile.
                  </p>

                  <div className="mt-10 flex flex-wrap items-center gap-4">
                    <a
                      href="#tienda"
                      className="inline-flex items-center px-8 py-4 bg-brand-500 text-white font-semibold text-sm tracking-wide uppercase hover:bg-brand-600 transition-all duration-300"
                    >
                      Explorar la red
                    </a>
                    <Link
                      href="/publish"
                      className="inline-flex items-center px-8 py-4 border border-cream/30 text-cream font-semibold text-sm tracking-wide uppercase hover:bg-cream/5 hover:border-cream/50 transition-all duration-300"
                    >
                      Activar mi estantería
                    </Link>
                  </div>
                </div>

                {/* Right — How the network works */}
                <div className="hidden lg:flex flex-col gap-4">
                  {/* Simulated real-time feed */}
                  <p className="text-xs text-cream/40 uppercase tracking-[0.2em] mb-2">En la red ahora</p>

                  <div className="bg-cream/[0.03] border border-cream/10 p-5 flex items-start gap-4">
                    <div className="w-10 h-10 bg-brand-500/20 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-display text-cream text-sm font-semibold">Alguien busca Ken Wilber</p>
                      <p className="text-cream/40 text-xs mt-1">Providencia &middot; hace 3 min</p>
                    </div>
                    <span className="ml-auto text-xs text-brand-400 font-medium">2 km</span>
                  </div>

                  <div className="bg-cream/[0.03] border border-cream/10 p-5 flex items-start gap-4">
                    <div className="w-10 h-10 bg-green-500/20 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.331 0 4.473.89 6.074 2.356M12 6.042a8.968 8.968 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.356M12 6.042V20.356" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-display text-cream text-sm font-semibold">3 libros de Ken Wilber disponibles</p>
                      <p className="text-cream/40 text-xs mt-1">Estación Central &middot; $10.000 c/u</p>
                    </div>
                    <span className="ml-auto text-xs text-green-400 font-medium">Match</span>
                  </div>

                  <div className="bg-brand-500/10 border border-brand-500/20 p-5 flex items-start gap-4">
                    <div className="w-10 h-10 bg-brand-500/20 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-display text-cream text-sm font-semibold">Envío en camino</p>
                      <p className="text-cream/40 text-xs mt-1">Rappi &middot; Llega en 2 horas</p>
                    </div>
                    <span className="ml-auto text-xs text-brand-400 font-medium">Rápido</span>
                  </div>

                  <p className="text-center text-cream/30 text-xs mt-2 italic">
                    Geolocalización &middot; MercadoPago &middot; Despacho a domicilio
                  </p>
                </div>
              </div>

              {/* Stats */}
              <div className="mt-20 pt-10 border-t border-cream/10 grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
                {[
                  { value: `${totalListings}`, label: "libros en la red" },
                  { value: "GPS", label: "geolocalización real" },
                  { value: "Gratis", label: "publicar siempre" },
                  { value: "2hrs", label: "envío más rápido" },
                ].map((stat) => (
                  <div key={stat.label}>
                    <span className="font-display text-3xl font-bold text-cream block">{stat.value}</span>
                    <p className="text-cream/50 text-xs mt-1 uppercase tracking-wider">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* The tech pitch */}
          <section className="bg-cream border-b border-cream-dark">
            <div className="max-w-6xl mx-auto px-6 py-20">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                <div>
                  <p className="text-xs font-medium tracking-[0.3em] uppercase text-brand-600 mb-4">
                    La tecnología
                  </p>
                  <h2 className="font-display text-3xl sm:text-4xl font-bold text-ink leading-tight">
                    Como Uber, pero
                    <br />
                    <span className="italic text-brand-600">para libros.</span>
                  </h2>
                  <p className="mt-6 text-ink-muted leading-relaxed">
                    Uber hizo visible cada auto disponible en tu ciudad. Nosotros hacemos
                    visible cada libro. Escaneas el código de barras, aparece en el mapa.
                    Alguien a 500 metros lo necesita y ni lo sabía. La tecnología conecta
                    oferta y demanda en tiempo real, con pago seguro y despacho a domicilio.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { icon: "📍", title: "Mapa en tiempo real", desc: "Ve qué libros hay cerca tuyo ahora mismo" },
                    { icon: "📱", title: "Escanea y publica", desc: "Del código de barras al mapa en 10 segundos" },
                    { icon: "💳", title: "Pago seguro", desc: "MercadoPago protege cada transacción" },
                    { icon: "🚀", title: "Envío mismo día", desc: "Rappi, Chilexpress o Blue Express a tu puerta" },
                  ].map((f) => (
                    <div key={f.title} className="bg-cream-warm p-5 border border-cream-dark">
                      <span className="text-2xl">{f.icon}</span>
                      <h3 className="font-display font-bold text-ink text-sm mt-3 mb-1">{f.title}</h3>
                      <p className="text-ink-muted text-xs leading-relaxed">{f.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* How it works */}
          <section className="bg-cream-warm border-b border-cream-dark">
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
