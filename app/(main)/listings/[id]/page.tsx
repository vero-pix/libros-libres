import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import ListingDetail from "@/components/listings/ListingDetail";
import ListingCard from "@/components/listings/ListingCard";
import ReviewSection from "@/components/listings/ReviewSection";
import QuestionSection from "@/components/listings/QuestionSection";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import type { Metadata } from "next";
import type { ListingWithBook } from "@/types";

export const revalidate = 60;

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = await createClient();
  const { data: listing } = await supabase
    .from("listings")
    .select("*, book:books(*), seller:users(id, full_name)")
    .eq("id", params.id)
    .single();

  if (!listing) {
    return { title: "Libro no encontrado — Libros Libres" };
  }

  const title = `${listing.book.title} — ${listing.book.author} | Libros Libres`;
  const description = listing.book.description
    ? listing.book.description.slice(0, 160)
    : `${listing.listing_type === "loan" ? "Arrienda" : "Compra"} "${listing.book.title}" de ${listing.book.author} en tuslibros.cl. ${listing.price ? `$${listing.price.toLocaleString("es-CL")} CLP.` : ""} Publicado por ${listing.seller?.full_name || "un vendedor"}.`;
  const image = listing.book.cover_url || "/og-image.png";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://tuslibros.cl/listings/${params.id}`,
      siteName: "Libros Libres",
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

export default async function ListingPage({ params }: Props) {
  const supabase = await createClient();

  const { data: listing } = await supabase
    .from("listings")
    .select(
      `
      *,
      book:books(*),
      seller:users(id, full_name, avatar_url, phone)
    `
    )
    .eq("id", params.id)
    .single();

  if (!listing) {
    notFound();
  }

  // Fetch additional images
  const { data: images } = await supabase
    .from("listing_images")
    .select("id, image_url")
    .eq("listing_id", params.id)
    .order("sort_order", { ascending: true });

  // Related books: same genre, exclude current
  let relatedListings: ListingWithBook[] = [];
  if (listing.book?.genre) {
    const { data: allRelated } = await supabase
      .from("listings")
      .select(`*, book:books(*), seller:users(id, full_name, avatar_url)`)
      .eq("status", "active")
      .neq("id", params.id)
      .limit(20);

    relatedListings = ((allRelated as unknown as ListingWithBook[]) ?? [])
      .filter((l) => l.book.genre?.toLowerCase() === listing.book.genre.toLowerCase())
      .slice(0, 5);
  }

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
      <main className="max-w-3xl mx-auto px-4 py-10">
        <Breadcrumbs
          items={[
            { label: "Inicio", href: "/" },
            { label: listing.book.genre || "Libros", href: listing.book.genre ? `/?genre=${encodeURIComponent(listing.book.genre)}` : "/" },
            { label: listing.book.title },
          ]}
        />
        <ListingDetail listing={listing} images={(images ?? []) as any} />

        <div id="questions" className="mt-6 bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <QuestionSection listingId={params.id} sellerId={listing.seller_id} />
        </div>

        <div id="reviews" className="mt-6 bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <ReviewSection listingId={params.id} />
        </div>

        {relatedListings.length > 0 && (
          <section className="mt-10">
            <h2 className="font-display text-xl font-bold text-ink mb-4">Libros similares</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {relatedListings.map((l) => (
                <ListingCard key={l.id} listing={l} />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
