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

  // Render checkout directly, handling missing info inside CheckoutForm
  return (
    <div className="min-h-screen bg-cream">
      <main className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-ink">Finalizar compra</h1>
          <p className="text-ink-muted text-sm mt-1">Estás a un paso de tener tu nuevo libro</p>
        </div>

        <CheckoutForm
          listing={typedListing}
          buyerAddress={buyerProfile?.default_address ?? ""}
          buyerName={buyerProfile?.full_name ?? ""}
          buyerPhone={buyerProfile?.phone ?? ""}
        />
      </main>
    </div>
  );
}
