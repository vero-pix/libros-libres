import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import CategoriesSidebar from "@/components/ui/CategoriesSidebar";
import CategoriesMobileDrawer from "@/components/ui/CategoriesMobileDrawer";
import AdSlot from "@/components/ui/AdSlot";
import ListingToolbar from "@/components/listings/ListingToolbar";
import ListingCard from "@/components/listings/ListingCard";
import ListingCardList from "@/components/listings/ListingCardList";
import RecentlyViewed from "@/components/listings/RecentlyViewed";
import Pagination from "@/components/ui/Pagination";
import HomeShell from "@/components/home/HomeShell";
import type { ListingWithBook } from "@/types";

const ITEMS_PER_PAGE = 20;

interface Props {
  searchParams: {
    genre?: string;
    sort?: string;
    price_min?: string;
    price_max?: string;
    condition?: string;
    modality?: string;
    author?: string;
    page?: string;
    view?: string;
  };
}

export default async function HomePage({ searchParams }: Props) {
  const supabase = await createClient();
  const { genre, sort, price_min, price_max, condition, modality, author, page, view } = searchParams;
  const currentPage = Math.max(1, parseInt(page ?? "1", 10) || 1);
  const viewMode = view === "list" ? "list" : "grid";

  const hasFilters = !!(genre || sort || price_min || price_max || condition || modality || author);

  let query = supabase
    .from("listings")
    .select(`*, book:books(*), seller:users(id, full_name, avatar_url, mercadopago_user_id)`)
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

  if (author) {
    listings = listings.filter(
      (l) => l.book.author?.toLowerCase().includes(author.toLowerCase())
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

      <HomeShell totalListings={totalListings} hasFilters={hasFilters}>
        <CategoriesMobileDrawer categories={categories} activeGenre={genre} />
        <div className="flex gap-10">
          <CategoriesSidebar categories={categories} activeGenre={genre} />

          <div className="flex-1 min-w-0">
            <Suspense>
              <ListingToolbar />
            </Suspense>

            {listings.length > 0 ? (
              <>
                {(() => {
                  const totalPages = Math.ceil(listings.length / ITEMS_PER_PAGE);
                  const start = (currentPage - 1) * ITEMS_PER_PAGE;
                  const pageListings = listings.slice(start, start + ITEMS_PER_PAGE);
                  const firstHalf = pageListings.slice(0, 10);
                  const secondHalf = pageListings.slice(10);

                  const buildHref = (p: number) => {
                    const params = new URLSearchParams();
                    if (genre) params.set("genre", genre);
                    if (sort) params.set("sort", sort);
                    if (price_min) params.set("price_min", price_min);
                    if (price_max) params.set("price_max", price_max);
                    if (condition) params.set("condition", condition);
                    if (modality) params.set("modality", modality);
                    if (author) params.set("author", author);
                    if (viewMode === "list") params.set("view", "list");
                    if (p > 1) params.set("page", String(p));
                    const qs = params.toString();
                    return qs ? `/?${qs}` : "/";
                  };

                  const gridClass = viewMode === "list"
                    ? "flex flex-col gap-3"
                    : "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-5";

                  const CardComponent = viewMode === "list" ? ListingCardList : ListingCard;

                  return (
                    <>
                      <div className={gridClass}>
                        {firstHalf.map((listing) => (
                          <CardComponent key={listing.id} listing={listing} />
                        ))}
                      </div>
                      {secondHalf.length > 0 && (
                        <>
                          <AdSlot slot="in-feed" format="horizontal" className="my-6" />
                          <div className={gridClass}>
                            {secondHalf.map((listing) => (
                              <CardComponent key={listing.id} listing={listing} />
                            ))}
                          </div>
                        </>
                      )}
                      <Pagination currentPage={currentPage} totalPages={totalPages} buildHref={buildHref} />
                    </>
                  );
                })()}
              </>
            ) : (
              <div className="text-center py-20">
                <p className="font-display text-2xl text-ink-light">No hay libros disponibles todavía.</p>
                <p className="text-sm text-ink-muted mt-2">Sé el primero en publicar un libro.</p>
              </div>
            )}
          </div>

          {/* Ad slot — sidebar right */}
          <div className="hidden xl:block w-40 shrink-0">
            <div className="sticky top-4">
              <AdSlot slot="sidebar-right" format="vertical" />
            </div>
          </div>
        </div>

        <RecentlyViewed />
      </HomeShell>
    </div>
  );
}
