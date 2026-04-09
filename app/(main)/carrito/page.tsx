import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import CartView from "./CartView";

export const metadata = {
  title: "Mi Carrito — tuslibros.cl",
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
        seller:users(id, full_name, username)
      )
    `)
    .eq("user_id", user.id)
    .order("added_at", { ascending: false });

  return (
    <div className="min-h-screen bg-cream">
      <main className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="font-display text-2xl font-bold text-ink mb-6">Mi Carrito</h1>
        <CartView items={(data ?? []) as any} />
      </main>
    </div>
  );
}
