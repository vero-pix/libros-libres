import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/ui/Navbar";
import SearchBar from "@/components/books/SearchBar";
import ListingCard from "@/components/listings/ListingCard";
import type { ListingWithBook } from "@/types";

interface Props {
  searchParams: { q?: string; genre?: string; modality?: string };
}

export default async function SearchPage({ searchParams }: Props) {
  const supabase = await createClient();
  const { q, genre, modality } = searchParams;

  let query = supabase
    .from("listings")
    .select(
      `
      *,
      book:books(*),
      seller:users(id, full_name, avatar_url)
    `
    )
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (q) {
    query = query.or(`title.ilike.%${q}%,author.ilike.%${q}%`, { foreignTable: "books" });
  }
  if (modality) {
    query = query.eq("modality", modality);
  }

  const { data: rawListings } = await query;
  const listings = rawListings as unknown as ListingWithBook[];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Suspense>
            <SearchBar />
          </Suspense>
        </div>

        {listings && listings.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-gray-500">
            <p className="text-lg">No se encontraron resultados.</p>
            <p className="text-sm mt-1">Probá con otra búsqueda o exploré el mapa.</p>
          </div>
        )}
      </main>
    </div>
  );
}
