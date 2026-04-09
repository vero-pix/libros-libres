import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import ListingDetail from "@/components/listings/ListingDetail";
import ListingCard from "@/components/listings/ListingCard";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import CategoriesSidebar from "@/components/ui/CategoriesSidebar";
import type { Metadata } from "next";
import type { ListingWithBook } from "@/types";

export const revalidate = 60;

interface Props {
  params: { slug: string };
}

async function getListingBySlug(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("listings")
    .select(`*, book:books(*), seller:users(id, full_name, avatar_url, phone, public_email, instagram)`)
    .eq("slug", slug)
    .single();
  return data;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const listing = await getListingBySlug(params.slug);

  if (!listing) {
    return { title: "Libro no encontrado — tuslibros.cl" };
  }

  const title = `${listing.book.title} — ${listing.book.author} | tuslibros.cl`;
  const description = listing.book.description
    ? listing.book.description.slice(0, 160)
    : `${listing.modality === "loan" ? "Arrienda" : "Compra"} "${listing.book.title}" de ${listing.book.author} en tuslibros.cl. ${listing.price ? `$${listing.price.toLocaleString("es-CL")} CLP.` : ""} Publicado por ${listing.seller?.full_name || "un vendedor"}.`;
  const image = listing.book.cover_url || "/og-image.png";

  return {
    title,
    description,
    alternates: {
      canonical: `https://tuslibros.cl/libro/${params.slug}`,
    },
    openGraph: {
      title,
      description,
      url: `https://tuslibros.cl/libro/${params.slug}`,
      siteName: "tuslibros.cl",
      type: "article",
      locale: "es_CL",
      images: [{ url: image, width: 600, height: 900, alt: listing.book.title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export default async function LibroPage({ params }: Props) {
  const supabase = await createClient();

  const listing = await getListingBySlug(params.slug);

  if (!listing) {
    notFound();
  }

  const { data: images } = await supabase
    .from("listing_images")
    .select("id, image_url")
    .eq("listing_id", listing.id)
    .order("sort_order", { ascending: true });

  // Related books + categories for sidebar — in parallel
  const [relatedResult, allActiveResult] = await Promise.all([
    listing.book?.genre
      ? supabase
          .from("listings")
          .select(`*, book:books(*), seller:users(id, full_name, avatar_url)`)
          .eq("status", "active")
          .neq("id", listing.id)
          .limit(20)
      : Promise.resolve({ data: null }),
    supabase
      .from("listings")
      .select("book:books(genre)")
      .eq("status", "active"),
  ]);

  const relatedListings: ListingWithBook[] = listing.book?.genre
    ? ((relatedResult.data as unknown as ListingWithBook[]) ?? [])
        .filter((l) => l.book.genre?.toLowerCase() === listing.book.genre.toLowerCase())
        .slice(0, 5)
    : [];

  // Build category counts for sidebar
  const genreMap = new Map<string, number>();
  for (const l of (allActiveResult.data ?? []) as any[]) {
    const g = l.book?.genre;
    if (g) genreMap.set(g, (genreMap.get(g) ?? 0) + 1);
  }
  const categories = Array.from(genreMap.entries())
    .map(([genre, count]) => ({ genre, count }))
    .sort((a, b) => b.count - a.count);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: listing.book.title,
    description: listing.book.description || `${listing.book.title} de ${listing.book.author}`,
    image: listing.book.cover_url || undefined,
    author: { "@type": "Person", name: listing.book.author },
    isbn: listing.book.isbn || undefined,
    offers: {
      "@type": "Offer",
      price: listing.price,
      priceCurrency: "CLP",
      availability: listing.status === "active"
        ? "https://schema.org/InStock"
        : "https://schema.org/SoldOut",
      seller: {
        "@type": "Person",
        name: listing.seller?.full_name,
      },
    },
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: "https://tuslibros.cl" },
      { "@type": "ListItem", position: 2, name: listing.book.genre || "Libros", item: `https://tuslibros.cl/?genre=${encodeURIComponent(listing.book.genre || "")}` },
      { "@type": "ListItem", position: 3, name: listing.book.title },
    ],
  };

  return (
    <div className="min-h-screen bg-cream">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <main className="max-w-7xl mx-auto px-6 py-10">
        <Breadcrumbs
          items={[
            { label: "Inicio", href: "/" },
            { label: listing.book.genre || "Libros", href: listing.book.genre ? `/?genre=${encodeURIComponent(listing.book.genre)}` : "/" },
            { label: listing.book.title },
          ]}
        />
        <div className="flex gap-10">
          <CategoriesSidebar categories={categories} activeGenre={listing.book.genre} />

          <div className="flex-1 min-w-0">
            <ListingDetail listing={listing} images={(images ?? []) as any} />

            {relatedListings.length > 0 && (
              <section className="mt-10">
                <h2 className="font-display text-xl font-bold text-ink mb-4">Libros similares</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {relatedListings.map((l) => (
                    <ListingCard key={l.id} listing={l} />
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
