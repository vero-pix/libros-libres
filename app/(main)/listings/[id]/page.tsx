import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import ListingDetail from "@/components/listings/ListingDetail";

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

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-3xl mx-auto px-4 py-10">
        <ListingDetail listing={listing} images={(images ?? []) as any} />
      </main>
    </div>
  );
}
