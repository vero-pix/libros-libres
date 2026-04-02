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

  // Fetch listings
  let query = supabase
    .from("listings")
    .select(
      `
      *,
      book:books(*),
      seller:users(id, full_name, avatar_url)
    `
    )
    .eq("status", "active");

  // Server-side filters
  if (condition) {
    query = query.eq("condition", condition);
  }
  if (modality) {
    query = query.eq("modality", modality);
  }
  if (price_min) {
    query = query.gte("price", Number(price_min));
  }
  if (price_max) {
    query = query.lte("price", Number(price_max));
  }

  // Sort
  if (sort === "price_asc") {
    query = query.order("price", { ascending: true });
  } else if (sort === "price_desc") {
    query = query.order("price", { ascending: false });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  const { data: rawListings } = await query;
  let listings = (rawListings as unknown as ListingWithBook[]) ?? [];

  // Filter by genre client-side (genre is on the book relation)
  if (genre) {
    listings = listings.filter(
      (l) => l.book.genre?.toLowerCase() === genre.toLowerCase()
    );
  }

  // Build category counts from all listings (before genre filter)
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
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Section — only on unfiltered home */}
      {!hasFilters && (
        <>
          <section className="relative overflow-hidden">
            {/* Background image */}
            <Image
              src="https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=1400&q=80"
              alt="Biblioteca"
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/70" />

            <div className="relative max-w-5xl mx-auto px-4 py-24 sm:py-32 text-center">
              <p className="text-brand-400 font-semibold text-sm uppercase tracking-widest mb-4">
                Libre, sin comisiones
              </p>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-tight">
                Cada libro merece{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-brand-300">
                  una segunda oportunidad
                </span>
              </h1>

              <p className="mt-6 text-lg sm:text-xl text-gray-200 max-w-2xl mx-auto leading-relaxed">
                Conectamos personas que buscan y ofrecen libros cerca de ti. Publica gratis, encuentra lo que buscas, recibe en tu casa.
              </p>

              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <a
                  href="#tienda"
                  className="inline-flex items-center px-8 py-4 rounded-lg text-base font-semibold bg-white text-navy hover:bg-gray-100 shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-200"
                >
                  Explorar libros
                </a>
                <Link
                  href="/publish"
                  className="inline-flex items-center px-8 py-4 rounded-lg text-base font-semibold bg-brand-500 text-white hover:bg-brand-600 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
                >
                  Publicar gratis
                </Link>
              </div>

              {/* Stats */}
              <div className="mt-16 flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-12">
                <div className="text-center">
                  <span className="text-3xl font-extrabold text-white">{totalListings}</span>
                  <p className="text-sm text-gray-300 mt-1">libros disponibles</p>
                </div>
                <div className="hidden sm:block w-px h-10 bg-white/20" />
                <div className="text-center">
                  <span className="text-3xl font-extrabold text-white">100%</span>
                  <p className="text-sm text-gray-300 mt-1">gratis para vendedores</p>
                </div>
                <div className="hidden sm:block w-px h-10 bg-white/20" />
                <div className="text-center">
                  <span className="text-3xl font-extrabold text-white">Chile</span>
                  <p className="text-sm text-gray-300 mt-1">envío a todo el país</p>
                </div>
              </div>
            </div>
          </section>

          {/* Preguntas reales */}
          <section className="bg-white">
            <div className="max-w-5xl mx-auto px-4 py-16">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-brand-600 text-center mb-3">
                ¿Te ha pasado?
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
                {[
                  "Necesito saber si alguien cerca tiene disponible los libros de Ken Wilber",
                  "Tengo una colección de García Márquez que ya leí y quiero que alguien más la disfrute",
                  "Busco un libro que ya no se edita y no lo encuentro en ninguna librería",
                  "Quiero vender mis libros de la universidad pero no sé dónde publicarlos",
                  "Me mudé y necesito deshacerme de cajas de libros sin botarlos",
                  "Busco libros infantiles baratos para el colegio de mis hijos",
                ].map((q, i) => (
                  <div
                    key={i}
                    className="bg-gray-50 border border-gray-100 rounded-xl px-5 py-4 text-sm text-gray-700 leading-relaxed italic"
                  >
                    &ldquo;{q}&rdquo;
                  </div>
                ))}
              </div>
              <p className="text-center text-gray-500 text-sm mt-8">
                Libros Libres conecta personas que buscan y ofrecen libros en tu ciudad.
              </p>
            </div>
          </section>

          {/* Cómo funciona */}
          <section className="bg-gray-50 border-y border-gray-100">
            <div className="max-w-5xl mx-auto px-4 py-16">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-12">
                Cómo funciona
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                  <div className="text-4xl mb-4">📱</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Busca tu libro</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    Encuentra por título, autor o categoría. Usa el mapa para ver libros cerca de ti.
                  </p>
                </div>

                <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                  <div className="text-4xl mb-4">💳</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Compra seguro</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    Paga con MercadoPago. Elige envío estándar o rápido a tu puerta.
                  </p>
                </div>

                <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                  <div className="text-4xl mb-4">📚</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Publica gratis</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    Escanea el código de barras, ponle precio y listo. Sin comisiones.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </>
      )}

      <main id="tienda" className="max-w-7xl mx-auto px-4 py-6 scroll-mt-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Tienda de Libros Libres
        </h2>

        <div className="flex gap-8">
          <CategoriesSidebar categories={categories} activeGenre={genre} />

          <div className="flex-1 min-w-0">
            <Suspense>
              <ListingToolbar />
            </Suspense>

            {listings.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
                {listings.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 text-gray-500">
                <p className="text-lg">No hay libros disponibles todavía.</p>
                <p className="text-sm mt-1">
                  Sé el primero en publicar un libro.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
