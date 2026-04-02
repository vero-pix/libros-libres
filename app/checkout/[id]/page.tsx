import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/ui/Navbar";
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
      `*, book:books(*), seller:users(id, full_name, avatar_url, phone)`
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
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
