import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import CategoriesSidebar from "@/components/ui/CategoriesSidebar";
import { buildCategoryTree, getAvailableTags } from "@/lib/categoryTree";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import ListingToolbar from "@/components/listings/ListingToolbar";
import ListingCard from "@/components/listings/ListingCard";
import SearchResultsToggle from "@/components/listings/SearchResultsToggle";
import PromoBanner from "@/components/ui/PromoBanner";
import BookRequestForm from "@/components/listings/BookRequestForm";
import SearchEventTracker from "@/components/analytics/SearchEventTracker";
import { sortListingsForDisplay } from "@/lib/sortListings";
import { translateGenre } from "@/lib/genres";
import type { Metadata } from "next";
import type { ListingWithBook } from "@/types";

interface Props {
  searchParams: {
    q?: string;
    author?: string;
    category?: string;
    subcategory?: string;
    tag?: string;
    sort?: string;
    price_min?: string;
    price_max?: string;
    condition?: string;
    modality?: string;
    binding?: string;
    publisher?: string;
    pages_min?: string;
    pages_max?: string;
    city_id?: string;
  };
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const q = searchParams.q;
  const tag = searchParams.tag;
  const author = searchParams.author;
  const description = author
    ? `Libros de ${author} disponibles en tuslibros.cl. Compra libros usados en Chile.`
    : q
      ? `Busca libros de "${q}" en TusLibros. Encuentra títulos y autores disponibles en Chile.`
      : tag
        ? `Libros con el tema #${tag} en tuslibros.cl. Compra libros usados en Chile.`
        : "Busca libros usados cerca de ti en tuslibros.cl. Compra, vende y presta libros de forma segura.";

  return {
    title: author
      ? { absolute: `${author} — tuslibros.cl` }
      : q
        ? { absolute: `${q} | TusLibros` }
        : tag
          ? { absolute: `#${tag} — tuslibros.cl` }
          : searchParams.category
            ? `${translateGenre(searchParams.category)} — tuslibros.cl`
            : "Buscar libros — tuslibros.cl",
    description,
    alternates: {
      canonical: author
        ? `https://tuslibros.cl/search?author=${encodeURIComponent(author)}`
        : q
          ? `https://tuslibros.cl/search?q=${encodeURIComponent(q)}`
          : tag
            ? `https://tuslibros.cl/search?tag=${encodeURIComponent(tag)}`
            : searchParams.category
              ? `https://tuslibros.cl/search?category=${encodeURIComponent(searchParams.category)}`
              : "https://tuslibros.cl/search",
    },
  };
}

export default async function SearchPage({ searchParams }: Props) {
  const supabase = await createClient();
  const { q, author, category, subcategory, tag, sort, price_min, price_max, condition, modality, binding, publisher, pages_min, pages_max, city_id } = searchParams;

  // Si hay búsqueda de texto, primero encontrar los book IDs que coincidan
  let matchingBookIds: string[] | null = null;
  if (q) {
    // Normalizar guiones a espacios
    const clean = q.replace(/[-_]+/g, " ").replace(/[()]/g, "").replace(/\s+/g, " ").trim();
    const words = clean.split(" ").filter(w => w.length > 1);

    const term = `%${clean}%`;
    const filters = [
      `title.ilike.${term}`,
      `author.ilike.${term}`,
      `isbn.ilike.${term}`,
      ...words.flatMap((word) => [
        `title.ilike.%${word}%`,
        `author.ilike.%${word}%`,
        `isbn.ilike.%${word}%`,
      ]),
    ].join(",");

    const { data: matchedBooks } = await supabase
      .from("books")
      .select("id")
      .or(filters);

    matchingBookIds = Array.from(new Set(matchedBooks?.map((b) => b.id) ?? []));
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
    .in("status", ["active", "completed"])
    .neq("deprioritized", true);

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
  if (city_id) {
    query = query.eq("city_id", city_id);
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

  // Trackear la búsqueda (fire-and-forget, no bloquea render)
  if (q) {
    const normalized = q.toLowerCase().trim();
    supabase
      .from("search_queries")
      .insert({
        query: q,
        normalized_query: normalized,
        results_count: listings.length,
      })
      .then(() => {});
  }

  if (author) {
    listings = listings.filter(
      (l) => l.book.author?.toLowerCase() === author.toLowerCase()
    );
  }
  if (tag) {
    listings = listings.filter(
      (l) => (l.book as any).tags?.includes(tag)
    );
  }
  if (category) {
    listings = listings.filter(
      (l) => l.book.category === category
    );
  }
  if (subcategory) {
    listings = listings.filter(
      (l) => l.book.subcategory === subcategory
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

  let popularListings: ListingWithBook[] = [];
  if (listings.length === 0) {
    const { data } = await supabase
      .from("listings")
      .select(`*, book:books(*), seller:users!inner(id, full_name, avatar_url, username)`)
      .eq("status", "active")
      .eq("featured", true)
      .limit(5);
    popularListings = sortListingsForDisplay((data as unknown as ListingWithBook[]) ?? []);
  }

  const allListings = (rawListings as unknown as ListingWithBook[]) ?? [];
  const [categoryTree, availableTags] = await Promise.all([
    buildCategoryTree(supabase, allListings as any),
    getAvailableTags(),
  ]);

  return (
    <div className="min-h-screen bg-white">
      <SearchEventTracker query={q} />
      <main className="max-w-7xl mx-auto px-4 py-6">
        <Breadcrumbs
          items={[
            { label: "Inicio", href: "/" },
            { label: author ? author : q ? `Resultados para "${q}"` : tag ? `#${tag}` : "Búsqueda" },
          ]}
        />
        {(q || tag || author) && (
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              {author
                ? <>Libros de {author}</>
                : q
                  ? <>Resultados para &ldquo;{q}&rdquo;</>
                  : <>#{ tag}</>}
            </h1>
            {listings.length > 0 && (
              <p className="text-sm text-gray-500 mt-1">
                {listings.length} {listings.length === 1 ? "resultado" : "resultados"}
              </p>
            )}
          </div>
        )}

        <div className="mb-6">
          <PromoBanner variant="publish" />
        </div>

        <div className="flex gap-8">
          <CategoriesSidebar
            categoryTree={categoryTree}
            activeCategory={category}
            activeSubcategory={subcategory}
            activeTag={tag}
            availableTags={availableTags}
          />

          <div className="flex-1 min-w-0">
            <Suspense fallback={<div className="h-10 bg-gray-100 rounded-lg animate-pulse mb-4" />}>
              <ListingToolbar />
            </Suspense>

            {listings.length > 0 ? (
              <SearchResultsToggle listings={listings} resultsCount={listings.length}>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
                  {listings.map((listing) => (
                    <ListingCard key={listing.id} listing={listing} />
                  ))}
                </div>
              </SearchResultsToggle>
            ) : (
              <div className="py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Economy Inversa CTA */}
                <div className="bg-amber-50 rounded-2xl border border-amber-200 p-8 mb-12 shadow-sm text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-amber-100 text-amber-600 rounded-full mb-4">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16l2.879-2.879m0 0a3 3 0 104.243-4.242 3 3 0 00-4.243 4.242zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-display font-bold text-ink mb-2">
                    Todavía no lo tenemos
                  </h2>
                  <p className="text-ink-muted max-w-lg mx-auto mb-8 text-lg">
                    Pero no te preocupes. Nuestra comunidad está constantemente publicando joyas. 
                    <strong className="text-ink font-semibold"> Déjanos tu pedido</strong> y te avisaremos apenas alguien lo suba a la plataforma.
                  </p>
                  
                  <div className="max-w-xl mx-auto bg-white p-6 rounded-xl shadow-sm border border-cream-dark text-left relative z-10">
                    <BookRequestForm initialTitle={q} />
                  </div>
                </div>

                {popularListings.length > 0 && (
                  <div>
                    <h3 className="font-display text-2xl font-bold text-ink mb-6">
                      Mientras tanto, quizás te interese...
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
                      {popularListings.map((listing) => (
                        <ListingCard key={listing.id} listing={listing} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
