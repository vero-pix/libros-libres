import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ListingCard from "@/components/listings/ListingCard";
import type { ListingWithBook } from "@/types";

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props) {
  const supabase = await createClient();
  const { data: seller } = await supabase
    .from("users")
    .select("full_name")
    .eq("id", params.id)
    .single();

  const name = seller?.full_name ?? "Vendedor";
  return {
    title: `${name} — tuslibros.cl`,
    description: `Libros publicados por ${name} en tuslibros.cl`,
  };
}

export default async function SellerStorePage({ params }: Props) {
  const supabase = await createClient();

  // Seller profile
  const { data: seller } = await supabase
    .from("users")
    .select("id, full_name, avatar_url, city, created_at")
    .eq("id", params.id)
    .single();

  if (!seller) notFound();

  // Seller's active listings
  const { data } = await supabase
    .from("listings")
    .select(`*, book:books(*), seller:users(id, full_name, avatar_url, phone)`)
    .eq("seller_id", params.id)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  const listings = (data as unknown as ListingWithBook[]) ?? [];

  // Stats
  const totalListings = listings.length;
  const avgPrice =
    listings.filter((l) => l.price != null).length > 0
      ? Math.round(
          listings.reduce((sum, l) => sum + (l.price ?? 0), 0) /
            listings.filter((l) => l.price != null).length
        )
      : null;
  const genres = Array.from(new Set(listings.map((l) => l.book.genre).filter(Boolean)));
  const memberSince = new Date(seller.created_at).toLocaleDateString("es-CL", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-white">
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Seller header */}
        <div className="flex items-start gap-5 mb-8 pb-8 border-b border-gray-100">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center text-2xl sm:text-3xl font-bold flex-shrink-0">
            {(seller.full_name ?? "?")[0].toUpperCase()}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {seller.full_name ?? "Vendedor"}
            </h1>
            <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-500">
              {seller.city && (
                <span className="flex items-center gap-1">
                  <span>📍</span> {seller.city}
                </span>
              )}
              <span>Miembro desde {memberSince}</span>
            </div>

            {/* Stats */}
            <div className="flex gap-6 mt-4">
              <div>
                <p className="text-2xl font-bold text-gray-900">{totalListings}</p>
                <p className="text-xs text-gray-400">
                  {totalListings === 1 ? "libro publicado" : "libros publicados"}
                </p>
              </div>
              {avgPrice && (
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    ${avgPrice.toLocaleString("es-CL")}
                  </p>
                  <p className="text-xs text-gray-400">precio promedio</p>
                </div>
              )}
            </div>

            {/* Genres */}
            {genres.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {genres.map((g) => (
                  <span
                    key={g}
                    className="text-xs bg-brand-50 text-brand-600 px-2 py-0.5 rounded-full border border-brand-100"
                  >
                    {g}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Listings grid */}
        {listings.length > 0 ? (
          <>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Libros disponibles
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
              {listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg">Este vendedor no tiene libros disponibles actualmente.</p>
          </div>
        )}
      </main>
    </div>
  );
}
