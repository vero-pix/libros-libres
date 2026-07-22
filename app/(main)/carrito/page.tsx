import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import CartView from "./CartView";
import type { ListingWithBook } from "@/types";

export const metadata = {
  title: "Mi Carrito",
  robots: { index: false },
};

export default async function CarritoPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/carrito");

  const { data } = await supabase
    .from("cart_items")
    .select(`
      id, listing_id, added_at,
      listing:listings(id, slug, price, status, cover_image_url,
        book:books(title, author, cover_url),
        seller:users(id, full_name, username, mercadopago_user_id, phone)
      )
    `)
    .eq("user_id", user.id)
    .order("added_at", { ascending: false });

  const items = (data ?? []) as any[];
  const isEmpty = items.length === 0;

  // Only fetch featured books when cart is empty — avoid unnecessary query otherwise
  let featured: ListingWithBook[] = [];
  if (isEmpty) {
    const { data: featuredData } = await supabase
      .from("listings")
      .select(`*, book:books(title, author, cover_url), seller:users(id, username, full_name)`)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(6);
    featured = (featuredData as unknown as ListingWithBook[]) ?? [];
  }

  return (
    <div className="min-h-screen bg-cream">
      <main className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="font-display text-2xl font-bold text-ink mb-6">Mi Carrito</h1>
        <CartView items={items} featured={featured as any} />
      </main>
    </div>
  );
}
