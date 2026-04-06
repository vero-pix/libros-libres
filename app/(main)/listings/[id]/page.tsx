import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import ListingDetail from "@/components/listings/ListingDetail";
import ListingCard from "@/components/listings/ListingCard";
import ReviewSection from "@/components/listings/ReviewSection";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import type { ListingWithBook } from "@/types";

interface Props {
  params: { id: string };
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

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-3xl mx-auto px-4 py-10">
        <Breadcrumbs
          items={[
            { label: "Inicio", href: "/" },
            { label: listing.book.genre || "Libros", href: listing.book.genre ? `/?genre=${encodeURIComponent(listing.book.genre)}` : "/" },
            { label: listing.book.title },
          ]}
        />
        <ListingDetail listing={listing} images={(images ?? []) as any} />

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
