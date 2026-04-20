import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import CategoriesSidebar from "@/components/ui/CategoriesSidebar";
import { buildCategoryTree } from "@/lib/categoryTree";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import ListingToolbar from "@/components/listings/ListingToolbar";
import ListingCard from "@/components/listings/ListingCard";
import PromoBanner from "@/components/ui/PromoBanner";
import { sortListingsForDisplay } from "@/lib/sortListings";
import type { Metadata } from "next";
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
    binding?: string;
    publisher?: string;
    pages_min?: string;
    pages_max?: string;
  };
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const q = searchParams.q;
  const genre = searchParams.genre;
  const title = q
    ? `Resultados para "${q}" — Libros Libres`
    : genre
      ? `${genre} — Libros Libres`
      : "Buscar libros — Libros Libres";
  const description = q
    ? `Encuentra "${q}" en tuslibros.cl. Libros usados cerca de ti, pago seguro con MercadoPago.`
    : "Busca libros usados cerca de ti en tuslibros.cl. Compra, vende y presta libros de forma segura.";

  return {
    title,
    description,
    alternates: {
      canonical: q
        ? `https://tuslibros.cl/search?q=${encodeURIComponent(q)}`
        : genre
          ? `https://tuslibros.cl/search?genre=${encodeURIComponent(genre)}`
          : "https://tuslibros.cl/search",
    },
  };
}

export default async function SearchPage({ searchParams }: Props) {
  const supabase = await createClient();
  const { q, genre, sort, price_min, price_max, condition, modality, binding, publisher, pages_min, pages_max } = searchParams;

  // Si hay búsqueda de texto, primero encontrar los book IDs que coincidan
  let matchingBookIds: string[] | null = null;
  if (q) {
    // Strip parentheses and special chars that break PostgREST or() syntax
    const clean = q.replace(/[()]/g, "").trim();
    const term = `%${clean}%`;
    const { data: matchedBooks } = await supabase
      .from("books")
      .select("id")
      .or(`title.ilike.${term},author.ilike.${term},isbn.ilike.${term}`);
    matchingBookIds = matchedBooks?.map((b) => b.id) ?? [];
  }

  let query = supabase
    .from("listings")
    .select(
      `
      *,
      book:books(*),
      seller:users(id, full_name, avatar_url, phone, username, mercadopago_user_id)
    `
    )
    .in("status", ["active", "completed"]);

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

  query = query.order("deprioritized", { ascending: true });
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

  if (binding) {
    listings = listings.filter(
      (l) => l.book.binding?.toLowerCase() === binding.toLowerCase()
    );
  }
  if (publisher) {
    listings = listings.filter(
      (l) => l.book.publisher?.toLowerCase().includes(publisher.toLowerCase())
    );
  }
  if (pages_min) {
    listings = listings.filter(
      (l) => l.book.pages != null && l.book.pages >= Number(pages_min)
    );
  }
  if (pages_max) {
    listings = listings.filter(
      (l) => l.book.pages != null && l.book.pages <= Number(pages_max)
    );
  }

  // Si no hay sort custom por precio, aplicar el orden de presentación
  // (español arriba, con portada arriba, deprioritized al final).
  if (sort !== "price_asc" && sort !== "price_desc") {
    listings = sortListingsForDisplay(listings);
  }

  const allListings = (rawListings as unknown as ListingWithBook[]) ?? [];
  const categoryTree = await buildCategoryTree(supabase, allListings as any);

  return (
    <div className="min-h-screen bg-white">
      <main className="max-w-7xl mx-auto px-4 py-6">
        <Breadcrumbs
          items={[
            { label: "Inicio", href: "/" },
            { label: q ? `Resultados para "${q}"` : "Búsqueda" },
          ]}
        />
        {q && (
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Resultados para &ldquo;{q}&rdquo;
          </h1>
        )}

        <div className="mb-6">
          <PromoBanner variant="publish" />
        </div>

        <div className="flex gap-8">
          <CategoriesSidebar categoryTree={categoryTree} />

          <div className="flex-1 min-w-0">
            <Suspense fallback={<div className="h-10 bg-gray-100 rounded-lg animate-pulse mb-4" />}>
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
