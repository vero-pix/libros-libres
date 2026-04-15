import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ListingCard from "@/components/listings/ListingCard";
import SellerListingsGrid from "@/components/listings/SellerListingsGrid";
import Avatar from "@/components/ui/Avatar";
import type { ListingWithBook } from "@/types";

interface Props {
  params: { id: string };
  searchParams: { sort?: string };
}

export async function generateMetadata({ params }: Props) {
  const supabase = await createClient();
  const { data: seller } = await supabase
    .from("users")
    .select("full_name, comuna, bio")
    .eq("id", params.id)
    .single();

  const name = seller?.full_name ?? "Vendedor";
  const location = seller?.comuna ? ` en ${seller.comuna}` : "";
  const bio = seller?.bio ? ` ${seller.bio.slice(0, 100)}` : "";
  const title = `${name} — Libros usados${location} | tuslibros.cl`;
  const description = `Compra libros de ${name}${location}.${bio} Envío seguro con MercadoPago o coordinación por WhatsApp.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://tuslibros.cl/vendedor/${params.id}`,
      siteName: "Libros Libres",
      type: "profile",
      locale: "es_CL",
    },
  };
}

export default async function SellerStorePage({ params, searchParams }: Props) {
  const sort = searchParams.sort;
  const supabase = await createClient();

  // Seller profile
  const { data: seller } = await supabase
    .from("users")
    .select("id, full_name, avatar_url, city, bio, created_at, phone, public_email, instagram, mercadopago_user_id")
    .eq("id", params.id)
    .single();

  if (!seller) notFound();

  // Seller's active listings
  const { data } = await supabase
    .from("listings")
    .select(`*, book:books(*), seller:users(id, full_name, avatar_url, phone, public_email, instagram, username)`)
    .eq("seller_id", params.id)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  let listings = (data as unknown as ListingWithBook[]) ?? [];

  // Sort
  if (sort === "price_asc") listings = [...listings].sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
  else if (sort === "price_desc") listings = [...listings].sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
  else if (sort === "title") listings = [...listings].sort((a, b) => a.book.title.localeCompare(b.book.title));
  else if (sort === "author") listings = [...listings].sort((a, b) => (a.book.author ?? "").localeCompare(b.book.author ?? ""));

  // Seller reviews: reviews for all listings owned by this seller
  const listingIds = listings.map((l) => l.id);
  let sellerReviews: { id: string; rating: number; comment: string | null; created_at: string; reviewer: { full_name: string | null } | null; listing: { id: string; book: { title: string } } | null }[] = [];
  let avgRating = 0;
  let totalReviews = 0;

  if (listingIds.length > 0) {
    const { data: reviewsData } = await supabase
      .from("reviews")
      .select("id, rating, comment, created_at, reviewer:users!reviewer_id(full_name), listing:listings!listing_id(id, book:books(title))")
      .in("listing_id", listingIds)
      .order("created_at", { ascending: false })
      .limit(10);

    sellerReviews = (reviewsData as any) ?? [];
    totalReviews = sellerReviews.length;
    if (totalReviews > 0) {
      avgRating = sellerReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews;
    }
  }

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
          <Avatar
            src={seller.avatar_url}
            alt={seller.full_name ?? "Vendedor"}
            fallbackLetter={(seller.full_name ?? "?")[0]}
            size="md"
          />
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
              {seller.mercadopago_user_id && (
                <span
                  className="inline-flex items-center gap-1.5 bg-[#009EE3]/10 text-[#009EE3] px-2.5 py-0.5 rounded-full border border-[#009EE3]/25 font-medium"
                  title="Este vendedor acepta pagos seguros a través de MercadoPago. Tu compra queda protegida."
                >
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="currentColor" aria-hidden="true">
                    <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm-1 14.414L6.586 12 8 10.586l3 3 5-5L17.414 10l-6.414 6.414z" />
                  </svg>
                  Pago seguro MercadoPago
                </span>
              )}
            </div>

            {/* Stats */}
            <div className="flex gap-6 mt-4">
              <div>
                <p className="text-2xl font-bold text-gray-900">{totalListings}</p>
                <p className="text-xs text-gray-400">
                  {totalListings === 1 ? "libro publicado" : "libros publicados"}
                </p>
              </div>
              {totalReviews > 0 && (
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {"★".repeat(Math.round(avgRating))}{"☆".repeat(5 - Math.round(avgRating))}{" "}
                    <span className="text-base font-normal text-gray-500">{avgRating.toFixed(1)}</span>
                  </p>
                  <p className="text-xs text-gray-400">
                    {totalReviews} {totalReviews === 1 ? "reseña" : "reseñas"}
                  </p>
                </div>
              )}
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
                  <a
                    key={g}
                    href={`/?genre=${encodeURIComponent(g!)}`}
                    className="text-xs bg-brand-50 text-brand-600 px-2 py-0.5 rounded-full border border-brand-100 hover:bg-brand-100 hover:border-brand-200 transition-colors"
                  >
                    {g}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Bio */}
        {(seller as any).bio && (
          <div className="mb-8 bg-cream-warm rounded-xl p-5 border border-cream-dark/30">
            <h2 className="text-sm font-semibold text-ink mb-2">Sobre esta tienda</h2>
            <p className="text-sm text-ink-muted leading-relaxed">{(seller as any).bio}</p>
          </div>
        )}

        {/* Contact channels */}
        <div className="mb-8 flex flex-wrap gap-3">
            {seller.phone && (() => {
              const cleanPhone = seller.phone.replace(/\D/g, "");
              return (
                <a
                  href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(`Hola, vi tu tienda en tuslibros.cl y me interesa contactarte.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 border-2 border-green-500 text-green-600 hover:bg-green-50 font-semibold rounded-xl transition-colors text-sm"
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  WhatsApp
                </a>
              );
            })()}
            {(seller as any).instagram && (
              <a
                href={`https://instagram.com/${(seller as any).instagram}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 border-2 border-pink-400 text-pink-500 hover:bg-pink-50 font-semibold rounded-xl transition-colors text-sm"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                </svg>
                @{(seller as any).instagram}
              </a>
            )}
            {(seller as any).public_email && (
              <a
                href={`mailto:${(seller as any).public_email}`}
                className="inline-flex items-center gap-2 px-4 py-2.5 border-2 border-blue-400 text-blue-500 hover:bg-blue-50 font-semibold rounded-xl transition-colors text-sm"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-current" xmlns="http://www.w3.org/2000/svg" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="M22 4l-10 8L2 4" />
                </svg>
                Email
              </a>
            )}
            <Link
              href={`/mensajes?to=${seller.id}`}
              className="inline-flex items-center gap-2 px-4 py-2.5 border-2 border-brand-400 text-brand-600 hover:bg-brand-50 font-semibold rounded-xl transition-colors text-sm"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-current" xmlns="http://www.w3.org/2000/svg" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              </svg>
              Mensaje
            </Link>
          </div>

        {/* Listings grid */}
        {listings.length > 0 ? (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Libros disponibles
              </h2>
              <div className="flex gap-1.5 text-xs">
                {[
                  { key: "", label: "Recientes" },
                  { key: "price_asc", label: "Precio ↑" },
                  { key: "price_desc", label: "Precio ↓" },
                  { key: "title", label: "Título" },
                  { key: "author", label: "Autor" },
                ].map((s) => (
                  <a
                    key={s.key}
                    href={`/vendedor/${params.id}${s.key ? `?sort=${s.key}` : ""}`}
                    className={`px-2.5 py-1.5 rounded-lg transition-colors ${
                      (sort ?? "") === s.key
                        ? "bg-brand-500 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {s.label}
                  </a>
                ))}
              </div>
            </div>
            <SellerListingsGrid listings={listings} />
          </>
        ) : (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg">Este vendedor no tiene libros disponibles actualmente.</p>
          </div>
        )}

        {/* Seller reviews */}
        {sellerReviews.length > 0 && (
          <section className="mt-10 pt-8 border-t border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Reseñas recientes
            </h2>
            <div className="space-y-3">
              {sellerReviews.map((r) => (
                <div key={r.id} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-yellow-400 text-sm">
                      {"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(r.created_at).toLocaleDateString("es-CL")}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    {(r.reviewer as any)?.full_name?.split(" ")[0] ?? "Usuario"}{" "}
                    sobre{" "}
                    <span className="font-medium text-gray-700">
                      {(r.listing as any)?.book?.title ?? "Libro"}
                    </span>
                  </p>
                  {r.comment && (
                    <p className="text-sm text-gray-600 mt-1">{r.comment}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
