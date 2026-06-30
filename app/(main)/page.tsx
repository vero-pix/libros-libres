import { Suspense } from "react";
import { unstable_cache } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import CategoriesSidebar from "@/components/ui/CategoriesSidebar";
import ListingToolbar from "@/components/listings/ListingToolbar";
import ListingCard from "@/components/listings/ListingCard";
import ListingCardList from "@/components/listings/ListingCardList";
import RecentlyViewed from "@/components/listings/RecentlyViewed";
import Recommendations from "@/components/listings/Recommendations";
import Pagination from "@/components/ui/Pagination";
import HomeShell from "@/components/home/HomeShell";
import { buildCategoryTree, getAvailableTags } from "@/lib/categoryTree";
import FeaturedRow from "@/components/home/FeaturedRow";
import CollectibleRow from "@/components/home/CollectibleRow";
import RecentRow from "@/components/home/RecentRow";
import ColeccionRow from "@/components/home/ColeccionRow";
import RequestsRow from "@/components/home/RequestsRow";
import HeroRequestStrip from "@/components/home/HeroRequestStrip";
import { sortListingsForDisplay } from "@/lib/sortListings";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import type { ListingWithBook } from "@/types";
import type { Metadata } from "next";
import { categoriaUrl } from "@/lib/urls";

// Nombres legibles para slugs de categoría/subcategoría usados en metadata
const CATEGORY_NAMES: Record<string, string> = {
  "general-adulto": "Literatura General",
  "escolar": "Libros Escolares",
  "lectura-complementaria": "Lectura Complementaria",
  "universitario": "Universitario",
  "tecnico-cft": "Técnico y CFT",
  "idiomas": "Idiomas",
  "otros": "Otros",
  // Subcategorías frecuentes
  "ficcion-novela": "Novela y Ficción",
  "no-ficcion-ensayo": "Ensayo y Divulgación",
  "no-ficcion-historia": "Historia",
  "no-ficcion-ciencia": "Ciencia y Divulgación",
  "no-ficcion-biografia": "Biografías y Memorias",
  "ficcion-policial": "Novela Policial y Suspenso",
  "ficcion-poesia": "Poesía",
  "idiomas-aleman": "Alemán",
  "idiomas-ingles": "Inglés",
  "idiomas-frances": "Francés",
  "academico-escolar": "Escolar",
  "academico-universitario": "Universitario",
  "infantil-juvenil-infantil": "Infantil y Juvenil",
  "otros-comics": "Cómics y Manga",
  "general-adulto-novela": "Novela y Ficción",
  "general-adulto-policial": "Novela Policial",
  "general-adulto-poesia": "Poesía",
  "general-adulto-historia": "Historia",
  "general-adulto-ensayo": "Ensayo",
};

function slugToName(slug: string): string {
  return CATEGORY_NAMES[slug] ?? slug.replace(/-/g, " ");
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { category, subcategory, genre, author, tag, collectible } = searchParams;
  const base = "https://tuslibros.cl";

  let title = "Libros Usados en Chile | Compra y Venta";
  let description = "Haz circular los libros que ya leíste y encuentra los que te faltan en el marketplace chileno tuslibros.cl.";
  let canonical = base;

  if (subcategory) {
    const name = slugToName(subcategory);
    title = `${name} — Libros Usados en Chile | tuslibros.cl`;
    description = `Encuentra libros usados de ${name}. Compra seguro con envío a todo Chile en tuslibros.cl.`;
    canonical = category
      ? `${base}${categoriaUrl(category, subcategory)}`
      : `${base}/categoria/${subcategory}`;
  } else if (category) {
    const name = slugToName(category);
    title = `${name} — Libros Usados en Chile | tuslibros.cl`;
    description = `Encuentra la mejor selección de libros de ${name} usados. Compra seguro con envío a todo Chile.`;
    canonical = `${base}${categoriaUrl(category)}`;
  } else if (genre) {
    title = `Libros de ${genre} Usados | tuslibros.cl`;
  } else if (author) {
    title = `Libros de ${author} Usados | tuslibros.cl`;
  } else if (collectible === "1") {
    title = "Libros de Colección y Ediciones Raras | tuslibros.cl";
    canonical = `${base}/?collectible=1`;
  } else if (tag) {
    title = `Libros sobre ${tag} | tuslibros.cl`;
  }

  return {
    title,
    description,
    alternates: { canonical },
  };
}

const ITEMS_PER_PAGE = 20;

// Queries cacheadas (datos públicos, no dependen de sesión).
// Usan createPublicClient porque unstable_cache no permite cookies().
const getTotalActiveCount = unstable_cache(
  async () => {
    const supabase = createPublicClient();
    const { count } = await supabase
      .from("listings")
      .select("*", { count: "exact", head: true })
      .eq("status", "active");
    return count ?? 0;
  },
  ["total-active-count"],
  { revalidate: 300 }
);


const getFeaturedListings = unstable_cache(
  async () => {
    const supabase = createPublicClient();
    const SEL = `*, book:books(*), seller:users(id, full_name, avatar_url, username, mercadopago_user_id)`;

    // 1. Curados manualmente (los que Vero destaca a mano)
    const { data: curated } = await supabase
      .from("listings")
      .select(SEL)
      .eq("status", "active")
      .eq("featured", true)
      .order("featured_rank", { ascending: true, nullsFirst: false })
      .limit(10);

    // 2. Descubrimientos rotativos: libros NO destacados (mayoría sin una sola visita).
    //    Ventana diaria sobre el catálogo ordenado por antigüedad → cada día expone otros.
    const DISCOVERIES = 6;
    const { count } = await supabase
      .from("listings")
      .select("*", { count: "exact", head: true })
      .eq("status", "active")
      .eq("featured", false)
      .neq("deprioritized", true);

    let discoveries: any[] = [];
    if (count && count > 0) {
      const day = Math.floor(Date.now() / 86_400_000);
      const offset = (day * DISCOVERIES) % count;
      const { data: win } = await supabase
        .from("listings")
        .select(SEL)
        .eq("status", "active")
        .eq("featured", false)
        .neq("deprioritized", true) // no exponer contenido despriorizado (p.ej. Mein Kampf)
        .order("created_at", { ascending: true })
        .range(offset, offset + DISCOVERIES * 2 - 1); // buffer para filtrar sin portada
      discoveries = (win ?? [])
        .filter((l) => l.book && (l.cover_image_url || l.book.cover_url))
        .slice(0, DISCOVERIES);
    }

    // 3. Combinar sin duplicar (curados primero)
    const seen = new Set((curated ?? []).map((l) => l.id));
    return [...(curated ?? []), ...discoveries.filter((l) => !seen.has(l.id))];
  },
  ["home-featured-listings-v3"],
  { revalidate: 120 }
);

const getCollectibleListings = unstable_cache(
  async () => {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from("listings")
      .select(`*, book:books(*), seller:users(id, full_name, avatar_url, username, mercadopago_user_id)`)
      .eq("status", "active")
      .eq("is_collectible", true)
      .limit(12);
    return data ?? [];
  },
  ["home-collectible-listings"],
  { revalidate: 120 }
);

const EXCLUDED_SUBCATEGORIES = ["no-ficcion-ensayo", "no-ficcion-humanidades"];

// Colecciones editoriales curadas por Vero (orden = prioridad al deduplicar).
const COLLECTION_CONFIGS = [
  { tag: "tarde-de-lluvia", title: "Para una tarde de lluvia", subtitle: "Curado por Vero · lectura lenta, sin apuro" },
  { tag: "literatura-chilena", title: "Literatura chilena", subtitle: "Escritoras y escritores de acá" },
  { tag: "latinoamerica-contemp", title: "Latinoamérica contemporánea", subtitle: "Lo que se está escribiendo ahora mismo" },
  { tag: "historia-chile", title: "Historia de Chile", subtitle: "Memoria, política, identidad" },
  { tag: "clasicos", title: "Clásicos que no caducan", subtitle: "Los que siempre vuelven" },
  { tag: "novela-negra", title: "Novela negra y suspenso", subtitle: "Para no soltar el libro" },
  { tag: "filosofia", title: "Filosofía accesible", subtitle: "Pensar sin sufrir" },
  { tag: "ensayo", title: "Ensayo y pensamiento", subtitle: "Ideas que cambian cómo ves las cosas" },
  { tag: "ciencia-divulgacion", title: "Ciencia y divulgación", subtitle: "Para entender el mundo sin título universitario" },
  { tag: "para-regalar", title: "Para regalar", subtitle: "Libros que no fallan como regalo" },
];

// Trae todas las colecciones y deduplica: un libro va a la PRIMERA colección que lo
// contiene (por orden de COLLECTION_CONFIGS), nunca a dos. Antes cada ColeccionRow
// buscaba aislada y un libro multi-tag salía repetido en varias filas.
const getCollections = unstable_cache(
  async () => {
    const supabase = createPublicClient();
    const SEL = `*, book:books!inner(*), seller:users(id, username, full_name, avatar_url)`;
    const raw = await Promise.all(
      COLLECTION_CONFIGS.map((c) =>
        supabase
          .from("listings")
          .select(SEL)
          .eq("status", "active")
          .neq("deprioritized", true)
          .contains("book.tags", [c.tag])
          .order("featured_rank", { ascending: true, nullsFirst: false })
          .limit(16)
          .then((r) => ({ ...c, items: (r.data ?? []).filter((l: any) => l.book) }))
      )
    );
    const used = new Set<string>();
    return raw.map((c) => {
      const listings: any[] = [];
      for (const l of c.items) {
        if (used.has(l.id) || listings.length >= 8) continue;
        used.add(l.id);
        listings.push(l);
      }
      return { tag: c.tag, title: c.title, subtitle: c.subtitle, listings };
    });
  },
  ["home-collections-v1"],
  { revalidate: 300 }
);

const getRecentListings = unstable_cache(
  async () => {
    const supabase = createPublicClient();
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data } = await supabase
      .from("listings")
      .select(`*, book:books(*), seller:users(id, full_name, avatar_url, username, mercadopago_user_id)`)
      .eq("status", "active")
      .neq("deprioritized", true)
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(40);
    return (data ?? []).filter(
      (l) => l.book && !EXCLUDED_SUBCATEGORIES.includes(l.book.subcategory ?? "")
    ).slice(0, 20);
  },
  ["home-recent-listings"],
  { revalidate: 300 }
);

const getFeaturedSellers = unstable_cache(
  async () => {
    const supabase = createPublicClient();
    const BARBARA_ID = "b075dd7f-bb0c-4379-8e60-1585bebdcb44";
    
    // 1. Buscamos a los destacados pero priorizando a Barbara
    const { data } = await supabase
      .from("users")
      .select("id, full_name, avatar_url, city, bio, username")
      .eq("featured", true)
      .limit(10);
      
    if (!data) return [];
    
    // 2. Mover a Barbara al inicio si está en la lista, o asegurar que esté
    let sortedSellers = [...data];
    const barbaraIndex = sortedSellers.findIndex(s => s.id === BARBARA_ID);
    if (barbaraIndex > -1) {
      const [barbara] = sortedSellers.splice(barbaraIndex, 1);
      sortedSellers.unshift(barbara);
    }

    return Promise.all(
      sortedSellers.map(async (seller) => {
        const { count } = await supabase
          .from("listings")
          .select("id", { count: "exact", head: true })
          .eq("seller_id", seller.id)
          .eq("status", "active");
        return { ...seller, _listing_count: count ?? 0 };
      })
    );
  },
  ["home-featured-sellers-v2"],
  { revalidate: 300 }
);

// Grilla principal (home sin filtros ni sort custom) — datos públicos, cacheable.
// Antes corría con el cliente con cookies en CADA visita (no-store) y era el query
// más pesado del camino caliente. excludeIds entra como parte de la key del cache;
// como se deriva de filas ya cacheadas, es estable dentro de la ventana de revalidate.
const getMainGridListings = unstable_cache(
  async (currentPage: number, excludeIds: string[]) => {
    const supabase = createPublicClient();
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    let gridQuery = supabase
      .from("listings")
      .select(`*, book:books(*), seller:users(id, full_name, avatar_url, username, mercadopago_user_id, plan), reviews:reviews(rating)`, { count: "exact" })
      .in("status", ["active", "completed"])
      .neq("deprioritized", true)
      .order("created_at", { ascending: false });
    if (excludeIds.length) gridQuery = gridQuery.not("id", "in", `(${excludeIds.join(",")})`);
    const { data, count } = await gridQuery.range(start, start + ITEMS_PER_PAGE - 1);
    return { data: data ?? [], count: count ?? 0 };
  },
  ["home-main-grid-v1"],
  { revalidate: 120 }
);

// Árbol de categorías con conteos reales — no depende de filtros ni de sesión.
// Corría en cada request; ahora cacheado (buildCategoryTree ignora los listings de muestra).
const getCategoryTreeCached = unstable_cache(
  async () => buildCategoryTree(createPublicClient()),
  ["home-category-tree-v1"],
  { revalidate: 300 }
);

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

interface Props {
  searchParams: {
    genre?: string;
    category?: string;
    subcategory?: string;
    tag?: string;
    sort?: string;
    price_min?: string;
    price_max?: string;
    condition?: string;
    modality?: string;
    author?: string;
    binding?: string;
    publisher?: string;
    pages_min?: string;
    pages_max?: string;
    page?: string;
    view?: string;
    lat?: string;
    lng?: string;
    collectible?: string;
  };
}

export default async function HomePage({ searchParams }: Props) {
  const { genre, category, subcategory, tag, sort, price_min, price_max, condition, modality, author, binding, publisher, pages_min, pages_max, page, view, lat, lng, collectible } = searchParams;
  const currentPage = Math.max(1, parseInt(page ?? "1", 10) || 1);
  const viewMode = view === "list" ? "list" : "grid";
  const userLat = lat ? parseFloat(lat) : null;
  const userLng = lng ? parseFloat(lng) : null;
  const collectibleOnly = collectible === "1";

  const hasFilters = !!(genre || category || subcategory || tag || sort || price_min || price_max || condition || modality || author || binding || publisher || pages_min || pages_max || collectibleOnly);

  // Featured (cacheados — no dependen de filtros ni de sesión)
  const [featuredListings, featuredSellers, collectibleListings, recentListings, collectionsRaw, totalActiveCount, availableTags] = await Promise.all([
    getFeaturedListings() as unknown as Promise<ListingWithBook[]>,
    getFeaturedSellers(),
    getCollectibleListings() as unknown as Promise<ListingWithBook[]>,
    getRecentListings() as unknown as Promise<ListingWithBook[]>,
    getCollections() as unknown as Promise<{ tag: string; title: string; subtitle: string; listings: ListingWithBook[] }[]>,
    getTotalActiveCount(),
    getAvailableTags(),
  ]);

  // Dedupe entre filas de la portada: un libro no puede salir en dos filas.
  // Prioridad: Destacados › Recién subidos › Coleccionables.
  const usedRowIds = new Set<string>();
  const dedupeRow = (arr: ListingWithBook[]) =>
    arr.filter((l) => (usedRowIds.has(l.id) ? false : (usedRowIds.add(l.id), true)));
  const featuredRowListings = dedupeRow(featuredListings);
  const recentRowListings = dedupeRow(recentListings);
  const collectibleRowListings = dedupeRow(collectibleListings);
  // Las colecciones ya vienen deduplicadas entre sí; además les quitamos lo que ya
  // apareció en las filas de arriba y ocultamos las que queden con <3.
  const collections = collectionsRaw
    .map((c) => ({ ...c, listings: c.listings.filter((l) => !usedRowIds.has(l.id)) }))
    .filter((c) => c.listings.length >= 3);
  // Todo lo ya visible en filas + colecciones → se excluye de la grilla principal
  // para que no se repita justo debajo (la grilla rellena con los siguientes reales).
  const shownAboveIds = new Set<string>(usedRowIds);
  collections.forEach((c) => c.listings.forEach((l) => shownAboveIds.add(l.id)));

  // Listings principales: sin filtros ni sort custom → versión cacheada
  const hasCustomSort = sort === "price_asc" || sort === "price_desc" || sort === "distance";
  let rawListings: any[] = [];
  let totalCount = totalActiveCount;

  if (!hasFilters && !hasCustomSort) {
    // Grilla principal sin lo ya mostrado arriba (filas + colecciones) → cero repetidos.
    // Versión cacheada (datos públicos): saca el query más pesado del camino caliente.
    const excludeIds = Array.from(shownAboveIds);
    const { data, count } = await getMainGridListings(currentPage, excludeIds);
    rawListings = data;
    totalCount = count || totalActiveCount;
  } else {
    const supabase = createPublicClient();
    let query = supabase
      .from("listings")
      .select(`*, book:books!inner(*), seller:users(id, full_name, avatar_url, username, mercadopago_user_id, plan), reviews:reviews(rating)`, { count: "exact" })
      .in("status", ["active", "completed"])
      .neq("deprioritized", true);

    if (category) query = query.eq("book.category", category);
    if (subcategory) query = query.eq("book.subcategory", subcategory);
    if (tag) query = query.contains("book.tags", [tag]);
    if (condition) query = query.eq("condition", condition);
    if (modality) query = query.in("modality", modality === "both" ? ["both"] : [modality, "both"]);
    if (price_min) query = query.gte("price", Number(price_min));
    if (price_max) query = query.lte("price", Number(price_max));
    if (collectibleOnly) query = query.eq("is_collectible", true);

    if (sort === "price_asc") query = query.order("price", { ascending: true });
    else if (sort === "price_desc") query = query.order("price", { ascending: false });
    else query = query.order("created_at", { ascending: false });

    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE - 1;
    
    const { data, count } = await query.range(start, end);
    rawListings = data ?? [];
    totalCount = count ?? 0;
  }

  // Map and sort for display
  let listings = (rawListings as (ListingWithBook & { reviews?: { rating: number }[] })[]).map((l) => {
    const reviews = l.reviews ?? [];
    return {
      ...l,
      _avg_rating: reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0,
      _review_count: reviews.length,
      _featured: l.seller?.plan === "librero" || l.seller?.plan === "libreria",
    };
  });
  listings = sortListingsForDisplay(listings);

  // For the sidebar category tree, we use the current page's listings as a sample 
  // or we could fetch a slightly larger set if needed, but let's keep it lean.
  const categoryTree = await getCategoryTreeCached();
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <div className="min-h-screen bg-cream">

      <HomeShell
        totalListings={totalActiveCount}
        hasFilters={hasFilters}
        featuredRow={
          !hasFilters && (featuredRowListings.length > 0 || featuredSellers.length > 0) ? (
            <FeaturedRow featuredListings={featuredRowListings} featuredSellers={featuredSellers} />
          ) : null
        }
        testimonialBanner={null /* testimonios viejos (Z./Camilo, abr) ocultos hasta tener nuevos */}
        requestsRow={!hasFilters ? <RequestsRow /> : null}
        heroRequestStrip={!hasFilters ? <HeroRequestStrip /> : null}
        liquidacionBanner={null /* campaña liquidación 50% vacaciones terminada (26 jun) — descuento revertido */}
      >
        <Breadcrumbs items={[
          { label: "Inicio", href: "/" },
          { label: "Tienda", href: (category || subcategory || tag) ? "/" : undefined },
          ...(category ? [{ label: categoryTree.find((c) => c.slug === category)?.name ?? category, href: subcategory ? `/?category=${category}` : undefined }] : []),
          ...(subcategory ? [{ label: categoryTree.flatMap((c) => c.children).find((c) => c.slug === subcategory)?.name ?? subcategory }] : []),
          ...(tag ? [{ label: `#${tag}` }] : []),
        ]} />
        <div className="flex gap-10">
          <CategoriesSidebar categoryTree={categoryTree} activeCategory={category} activeSubcategory={subcategory} activeTag={tag} totalCount={totalCount} availableTags={availableTags} />

          <div className="flex-1 min-w-0">
            {!hasFilters && recentRowListings.length > 0 && (
              <RecentRow listings={recentRowListings} />
            )}

            {/* Colecciones editoriales curadas por Vero — deduplicadas entre sí y contra las filas */}
            {!hasFilters &&
              collections.map((c) => (
                <ColeccionRow key={c.tag} tag={c.tag} title={c.title} subtitle={c.subtitle} listings={c.listings} />
              ))}

            {!hasFilters && collectibleRowListings.length > 0 && (
              <CollectibleRow listings={collectibleRowListings} />
            )}

            <Suspense fallback={<div className="h-10 bg-gray-100 rounded-lg animate-pulse mb-4" />}>
              <ListingToolbar />
            </Suspense>

            {listings.length > 0 ? (
              <>
                {(() => {
                  const pageListings = listings;
                  const firstHalf = pageListings.slice(0, 10);
                  const secondHalf = pageListings.slice(10);

                  const buildHref = (p: number) => {
                    const params = new URLSearchParams();
                    if (category) params.set("category", category);
                    if (subcategory) params.set("subcategory", subcategory);
                    if (tag) params.set("tag", tag);
                    if (genre) params.set("genre", genre);
                    if (sort) params.set("sort", sort);
                    if (price_min) params.set("price_min", price_min);
                    if (price_max) params.set("price_max", price_max);
                    if (condition) params.set("condition", condition);
                    if (modality) params.set("modality", modality);
                    if (author) params.set("author", author);
                    if (lat) params.set("lat", lat);
                    if (lng) params.set("lng", lng);
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

        </div>

        <Recommendations />
        <RecentlyViewed />
      </HomeShell>
    </div>
  );
}
