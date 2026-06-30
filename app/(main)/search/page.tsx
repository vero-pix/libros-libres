import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createPublicClient } from "@/lib/supabase/public";
import { accentInsensitiveRegex } from "@/lib/accentSearch";
import CategoriesSidebar from "@/components/ui/CategoriesSidebar";
import { getCachedCategoryTree, getAvailableTags } from "@/lib/categoryTree";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import ListingToolbar from "@/components/listings/ListingToolbar";
import ListingCard from "@/components/listings/ListingCard";
import SearchResultsToggle from "@/components/listings/SearchResultsToggle";
import PromoBanner from "@/components/ui/PromoBanner";
import BookRequestForm from "@/components/listings/BookRequestForm";
import Pagination from "@/components/ui/Pagination";
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
    page?: string;
  };
}

const ITEMS_PER_PAGE = 24;

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
    robots: { index: false, follow: true },
  };
}

export default async function SearchPage({ searchParams }: Props) {
  const supabase = createPublicClient();
  const { q, author, category, subcategory, tag, sort, price_min, price_max, condition, modality, binding, publisher, pages_min, pages_max, city_id, page } = searchParams;
  const currentPage = Math.max(1, parseInt(page ?? "1", 10) || 1);

  // Mantiene todos los filtros actuales y solo cambia el número de página.
  const buildHref = (p: number) => {
    const params = new URLSearchParams();
    const entries: [string, string | undefined][] = [
      ["q", q], ["author", author], ["category", category], ["subcategory", subcategory],
      ["tag", tag], ["sort", sort], ["price_min", price_min], ["price_max", price_max],
      ["condition", condition], ["modality", modality], ["binding", binding],
      ["publisher", publisher], ["pages_min", pages_min], ["pages_max", pages_max],
      ["city_id", city_id],
    ];
    for (const [k, v] of entries) if (v) params.set(k, v);
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return qs ? `/search?${qs}` : "/search";
  };

  // Si hay búsqueda de texto, primero encontrar los book IDs que coincidan
  let matchingBookIds: string[] | null = null;
  if (q) {
    // Normalizar guiones a espacios
    const clean = q.replace(/[-_]+/g, " ").replace(/[()]/g, "").replace(/\s+/g, " ").trim();
    const words = clean.split(" ").filter(w => w.length > 1);

    const rx = accentInsensitiveRegex(clean);
    const filters = [
      `title.imatch.${rx}`,
      `author.imatch.${rx}`,
      `isbn.ilike.%${clean}%`,
      ...words.flatMap((word) => {
        const wr = accentInsensitiveRegex(word);
        return [
          `title.imatch.${wr}`,
          `author.imatch.${wr}`,
          `isbn.ilike.%${word}%`,
        ];
      }),
    ].join(",");

    const { data: matchedBooks } = await supabase
      .from("books")
      .select("id")
      .or(filters);

    matchingBookIds = Array.from(new Set(matchedBooks?.map((b) => b.id) ?? []));
  }

  // Si el texto de búsqueda no calzó con ningún libro, forzamos resultado vacío.
  if (matchingBookIds !== null && matchingBookIds.length === 0) {
    matchingBookIds = ["00000000-0000-0000-0000-000000000000"];
  }

  // inner join + TODOS los filtros del libro empujados a la BD. Antes varios
  // (author/binding/publisher/pages) se aplicaban en JS sobre el catálogo entero;
  // con paginación real el conteo tiene que ser exacto en la BD, no post-fetch.
  // Se arma con un builder reusable para poder recontar (head) sin duplicar filtros.
  const buildFiltered = (opts?: { head?: boolean }) => {
    let qb = supabase
      .from("listings")
      .select(
        `
        *,
        book:books!inner(*),
        seller:users(id, full_name, avatar_url, phone, username, mercadopago_user_id)
      `,
        { count: "exact", head: opts?.head ?? false }
      )
      .in("status", ["active", "completed"])
      .neq("deprioritized", true);

    if (matchingBookIds !== null) qb = qb.in("book_id", matchingBookIds);
    if (category) qb = qb.eq("book.category", category);
    if (subcategory) qb = qb.eq("book.subcategory", subcategory);
    if (tag) qb = qb.contains("book.tags", [tag]);
    if (author) qb = qb.ilike("book.author", author); // ilike sin comodín = exacto, case-insensitive
    if (binding) qb = qb.ilike("book.binding", binding);
    if (publisher) qb = qb.ilike("book.publisher", `%${publisher}%`); // contiene
    if (pages_min) qb = qb.gte("book.pages", Number(pages_min));
    if (pages_max) qb = qb.lte("book.pages", Number(pages_max));
    if (condition) qb = qb.eq("condition", condition);
    if (modality) qb = qb.eq("modality", modality);
    if (city_id) qb = qb.eq("city_id", city_id);
    if (price_min) qb = qb.gte("price", Number(price_min));
    if (price_max) qb = qb.lte("price", Number(price_max));
    return qb;
  };

  let dataQuery = buildFiltered().order("deprioritized", { ascending: true });
  if (sort === "price_asc") {
    dataQuery = dataQuery.order("price", { ascending: true });
  } else if (sort === "price_desc") {
    dataQuery = dataQuery.order("price", { ascending: false });
  } else {
    dataQuery = dataQuery.order("created_at", { ascending: false });
  }

  // Paginación real en la BD (antes traía hasta 200 sin paginar).
  const start = (currentPage - 1) * ITEMS_PER_PAGE;
  dataQuery = dataQuery.range(start, start + ITEMS_PER_PAGE - 1);

  const { data: rawListings, count } = await dataQuery;
  let listings = (rawListings as unknown as ListingWithBook[]) ?? [];
  let totalCount = count ?? 0;

  // Página fuera de rango: cuando el range supera el total, PostgREST no devuelve count
  // (queda null) y la data viene vacía. En página >1 eso solo puede ser fuera de rango,
  // así que recontamos sin range y, si hay resultados, mandamos a la última página válida
  // (URL escrita a mano, o se borraron libros y quedaron menos páginas). Si de verdad hay
  // 0 resultados, totalCount queda en 0 y cae al CTA real de "todavía no lo tenemos".
  if (currentPage > 1 && listings.length === 0) {
    const { count: realCount } = await buildFiltered({ head: true });
    totalCount = realCount ?? 0;
    if (totalCount > 0) {
      redirect(buildHref(Math.ceil(totalCount / ITEMS_PER_PAGE)));
    }
  }

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  // Trackear la búsqueda (fire-and-forget, no bloquea render)
  if (q) {
    const normalized = q.toLowerCase().trim();
    supabase
      .from("search_queries")
      .insert({
        query: q,
        normalized_query: normalized,
        results_count: totalCount,
      })
      .then(() => {});
  }

  // Si no hay sort custom por precio, aplicar el orden de presentación
  // (español arriba, con portada arriba, deprioritized al final).
  if (sort !== "price_asc" && sort !== "price_desc") {
    listings = sortListingsForDisplay(listings);
  }

  let popularListings: ListingWithBook[] = [];
  if (totalCount === 0) {
    const { data } = await supabase
      .from("listings")
      .select(`*, book:books(*), seller:users!inner(id, full_name, avatar_url, username)`)
      .eq("status", "active")
      .eq("featured", true)
      .limit(5);
    popularListings = sortListingsForDisplay((data as unknown as ListingWithBook[]) ?? []);
  }

  const [categoryTree, availableTags] = await Promise.all([
    getCachedCategoryTree(),
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
            {totalCount > 0 && (
              <p className="text-sm text-gray-500 mt-1">
                {totalCount} {totalCount === 1 ? "resultado" : "resultados"}
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
              <>
                <SearchResultsToggle listings={listings} resultsCount={totalCount}>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
                    {listings.map((listing) => (
                      <ListingCard key={listing.id} listing={listing} />
                    ))}
                  </div>
                </SearchResultsToggle>
                <Pagination currentPage={currentPage} totalPages={totalPages} buildHref={buildHref} />
              </>
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
