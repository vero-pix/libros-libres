import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CheckoutForm from "@/components/checkout/CheckoutForm";
import type { ListingWithBook } from "@/types";

interface Props {
  params: { id: string };
}

export default async function CheckoutPage({ params }: Props) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=/checkout/${params.id}`);
  }

  const { data: listing } = await supabase
    .from("listings")
    .select(
      `*, book:books(*), seller:users(id, full_name, avatar_url, phone, mercadopago_user_id)`
    )
    .eq("id", params.id)
    .eq("status", "active")
    .single();

  if (!listing) {
    redirect("/");
  }

  const typedListing = listing as unknown as ListingWithBook;

  if (typedListing.seller_id === user.id) {
    redirect(`/listings/${params.id}`);
  }

  // Get buyer profile for default address
  const { data: buyerProfile } = await supabase
    .from("users")
    .select("full_name, default_address, phone")
    .eq("id", user.id)
    .single();

  // Comprador necesita teléfono para coordinar entrega
  if (!buyerProfile?.phone) {
    const { default: Link } = await import("next/link");
    const returnTo = `/checkout/${params.id}`;
    return (
      <div className="min-h-screen bg-gray-50">
        <main className="max-w-xl mx-auto px-4 py-16">
          <div className="bg-white rounded-xl border border-amber-300 p-8 text-center">
            <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full mb-4">
              <span className="text-xs font-semibold text-amber-700">
                Completa tu perfil para comprar
              </span>
            </div>
            <h1 className="font-bold text-2xl text-gray-900 mb-3">
              Necesitamos tu teléfono
            </h1>
            <p className="text-gray-600 text-sm mb-6 leading-relaxed">
              Para coordinar la entrega con el vendedor necesitamos un número
              donde puedan contactarte. Son 20 segundos.
            </p>
            <Link
              href={`/perfil?next=${encodeURIComponent(returnTo)}`}
              className="inline-block bg-brand-500 hover:bg-brand-600 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              Agregar teléfono
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Checkout</h1>
        <CheckoutForm
          listing={typedListing}
          buyerAddress={buyerProfile?.default_address ?? ""}
          buyerName={buyerProfile?.full_name ?? ""}
        />
      </main>
    </div>
  );
}
