import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Navbar from "@/components/ui/Navbar";
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
      seller:users(id, full_name, avatar_url)
    `
    )
    .eq("id", params.id)
    .single();

  if (!listing) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-10">
        <ListingDetail listing={listing} />
      </main>
    </div>
  );
}
