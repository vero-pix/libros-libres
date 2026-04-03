import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/ui/Navbar";
import CategoriesSidebar from "@/components/ui/CategoriesSidebar";
import ListingToolbar from "@/components/listings/ListingToolbar";
import ListingCard from "@/components/listings/ListingCard";
import type { ListingWithBook } from "@/types";

interface Props {
  searchParams: {
    q?: string;
    genre?: string;
    sort?: string;
    price_min?: string;
    price_max?: string;
    condition?: string;
    modality?: string;
  };
}

export default async function SearchPage({ searchParams }: Props) {
  const supabase = await createClient();
  const { q, genre, sort, price_min, price_max, condition, modality } = searchParams;

  // Si hay búsqueda de texto, primero encontrar los book IDs que coincidan
  let matchingBookIds: string[] | null = null;
  if (q) {
    const term = `%${q}%`;
    const { data: matchedBooks } = await supabase
      .from("books")
      .select("id")
      .or(`title.ilike.${term},author.ilike.${term}`);
    matchingBookIds = matchedBooks?.map((b) => b.id) ?? [];
  }

  let query = supabase
    .from("listings")
    .select(
      `
      *,
      book:books(*),
      seller:users(id, full_name, avatar_url, phone)
    `
    )
    .eq("status", "active");

  // Filtrar por book IDs encontrados en la búsqueda de texto
  if (matchingBookIds !== null) {
    if (matchingBookIds.length === 0) {
      // No hay resultados, devolvemos vacío
      matchingBookIds = ["00000000-0000-0000-0000-000000000000"];
    }
    query = query.in("book_id", matchingBookIds);
  }

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

  // Build category counts from all results (before genre filter)
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
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-6">
        {q && (
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Resultados para &ldquo;{q}&rdquo;
          </h1>
        )}

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
                <p className="text-lg">No se encontraron resultados.</p>
                <p className="text-sm mt-1">Prueba con otra búsqueda o explora el mapa.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
