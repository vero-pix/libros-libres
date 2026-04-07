import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
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
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Mis Libros</h1>
          <div className="flex items-center gap-3">
            <Link
              href="/mis-libros/importar"
              className="flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700 bg-brand-50 hover:bg-brand-100 px-3 py-2 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
              Importar CSV
            </Link>
            <span className="text-sm text-gray-400">
              {listings.length} {listings.length === 1 ? "publicación" : "publicaciones"}
            </span>
          </div>
        </div>
        <MyListings listings={listings} />
      </main>
    </div>
  );
}
