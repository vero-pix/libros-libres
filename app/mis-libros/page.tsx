import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/ui/Navbar";
import MyListings from "./MyListings";
import type { ListingWithBook } from "@/types";

export const metadata = { title: "Mis Libros — tuslibros.cl" };

export default async function MisLibrosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data } = await supabase
    .from("listings")
    .select(`*, book:books(*), seller:users(id, full_name, avatar_url, phone)`)
    .eq("seller_id", user.id)
    .order("created_at", { ascending: false });

  const listings = (data as unknown as ListingWithBook[]) ?? [];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Mis Libros</h1>
          <span className="text-sm text-gray-400">
            {listings.length} {listings.length === 1 ? "publicación" : "publicaciones"}
          </span>
        </div>
        <MyListings listings={listings} />
      </main>
    </div>
  );
}
