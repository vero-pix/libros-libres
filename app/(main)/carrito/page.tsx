import { createClient } from "@/lib/supabase/server";
import CartView from "./CartView";
import ListingCard from "@/components/listings/ListingCard";
import { ButtonLink } from "@/components/ui/Button";
import type { ListingWithBook } from "@/types";

export const metadata = {
  title: "Mi Carrito",
  robots: { index: false },
};

export default async function CarritoPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Antes esto era un redirect a /login: quien echó un libro al carrito y
  // quiso ver cuánto llevaba se topaba con "Bienvenido de vuelta", sin una
  // palabra de por qué. El carrito vive en la cuenta (cart_items va por
  // user_id), así que sin sesión no hay nada que mostrar — pero eso se dice,
  // no se tapa con un muro, y se ofrece la entrada de vuelta acá mismo.
  if (!user) {
    const { data: recien } = await supabase
      .from("listings")
      .select(`*, book:books(title, author, cover_url), seller:users(id, username, full_name)`)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(6);

    return (
      <div className="min-h-screen bg-cream">
        <main className="max-w-3xl mx-auto px-4 py-8">
          <h1 className="font-display text-2xl font-bold text-ink mb-3">Mi carrito</h1>
          <p className="text-ink-muted mb-6 leading-relaxed">
            Tu carrito se guarda en tu cuenta, así que lo ves al entrar — y si
            dejaste algo adentro la semana pasada, sigue ahí.
          </p>
          <div className="flex flex-wrap gap-3 mb-12">
            <ButtonLink href="/login?next=/carrito">Entrar</ButtonLink>
            <ButtonLink href="/register?next=/carrito" variant="secondary">
              Crear cuenta
            </ButtonLink>
          </div>

          {(recien?.length ?? 0) > 0 && (
            <section>
              <h2 className="font-display text-lg font-bold text-ink mb-5">
                Lo último que llegó
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {(recien as unknown as ListingWithBook[]).map((l) => (
                  <ListingCard key={l.id} listing={l} showDistance={false} />
                ))}
              </div>
            </section>
          )}
        </main>
      </div>
    );
  }

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
