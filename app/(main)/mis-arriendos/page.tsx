import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { redirect } from "next/navigation";
import RentalsList from "./RentalsList";

export const metadata = { title: "Mis Arriendos — tuslibros.cl", robots: { index: false } };

export default async function MisArriendosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/mis-arriendos");
  }

  // Los teléfonos de la contraparte no se conceden a authenticated
  // (20260923e): se leen con service role, siempre filtrando por mí.
  const db = createServiceRoleClient();

  // Arriendos donde soy arrendatario
  const { data: asRenter } = await db
    .from("rentals")
    .select(`
      *,
      listing:listings(*, book:books(title, author, cover_url)),
      owner:users!rentals_owner_id_fkey(id, full_name, phone)
    `)
    .eq("renter_id", user.id)
    .order("created_at", { ascending: false });

  // Arriendos donde soy dueño
  const { data: asOwner } = await db
    .from("rentals")
    .select(`
      *,
      listing:listings(*, book:books(title, author, cover_url)),
      renter:users!rentals_renter_id_fkey(id, full_name, phone)
    `)
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Mis arriendos</h1>
        <RentalsList
          asRenter={asRenter ?? []}
          asOwner={asOwner ?? []}
          userId={user.id}
        />
      </main>
    </div>
  );
}
