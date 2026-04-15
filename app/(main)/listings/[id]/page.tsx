import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import ListingDetail from "@/components/listings/ListingDetail";
import ListingCard from "@/components/listings/ListingCard";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import CategoriesSidebar from "@/components/ui/CategoriesSidebar";
import { buildCategoryTree } from "@/lib/categoryTree";
import type { Metadata } from "next";
import type { ListingWithBook } from "@/types";

interface Props {
  params: { id: string };
}

async function getListing(id: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("listings")
    .select(`*, book:books(*), seller:users(id, full_name, avatar_url, phone, public_email, instagram, username)`)
    .eq("id", id)
    .single();
  return data;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const listing = await getListing(params.id);
  if (!listing) return { title: "Libro no encontrado — tuslibros.cl" };

  const title = `${listing.book.title} — ${listing.book.author} | tuslibros.cl`;
  const description = listing.book.description
    || `${listing.book.title} de ${listing.book.author} en tuslibros.cl.`;
  const image = listing.cover_image_url || listing.book.cover_url || "/og-image.png";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      siteName: "tuslibros.cl",
      type: "article",
      locale: "es_CL",
      images: [{ url: image, width: 600, height: 900, alt: listing.book.title }],
    },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

export default async function ListingByIdPage({ params }: Props) {
  const supabase = await createClient();
  const listing = await getListing(params.id);

  if (!listing) notFound();

  // Si tiene URL amigable, redirigir
  if (listing.slug && listing.seller?.username) {
    redirect(`/libro/${listing.seller.username}/${listing.slug}`);
  }

  // Sin username — mostrar el libro directamente
  const { data: images } = await supabase
    .from("listing_images")
    .select("id, image_url")
    .eq("listing_id", listing.id)
    .order("sort_order", { ascending: true });

  const { data: allActive } = await supabase
    .from("listings")
    .select("book:books(genre, category, subcategory)")
    .eq("status", "active");

  const categoryTree = await buildCategoryTree(supabase, (allActive ?? []) as any);

  const relatedResult = listing.book?.genre
    ? await supabase
        .from("listings")
        .select(`*, book:books(*), seller:users(id, full_name, avatar_url, username)`)
        .eq("status", "active")
        .neq("id", listing.id)
        .limit(20)
    : { data: null };

  const relatedListings: ListingWithBook[] = listing.book?.genre
    ? ((relatedResult.data as unknown as ListingWithBook[]) ?? [])
        .filter((l) => l.book.genre?.toLowerCase() === listing.book.genre.toLowerCase())
        .slice(0, 5)
    : [];

  return (
    <div className="min-h-screen bg-cream">
      <main className="max-w-7xl mx-auto px-6 py-10">
        <Breadcrumbs
          items={[
            { label: "Inicio", href: "/" },
            { label: listing.seller?.full_name || "Vendedor", href: `/vendedor/${listing.seller_id}` },
            { label: listing.book.title },
          ]}
        />
        <div className="flex gap-10">
          <CategoriesSidebar categoryTree={categoryTree} activeCategory={(listing.book as any).category} activeSubcategory={(listing.book as any).subcategory} />
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
