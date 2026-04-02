import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/ui/Navbar";
import OrderTabs from "./OrderTabs";
import { OrderWithDetails } from "@/types";

export const metadata = { title: "Mis Pedidos | Libros Libres" };

const ORDER_SELECT = `
  *,
  listing:listings (
    *,
    book:books (*)
  ),
  buyer:users!orders_buyer_id_fkey (id, full_name, email, phone)
`;

export default async function MisPedidosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/mis-pedidos");

  const [{ data: purchases }, { data: sales }] = await Promise.all([
    supabase
      .from("orders")
      .select(ORDER_SELECT)
      .eq("buyer_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("orders")
      .select(ORDER_SELECT)
      .eq("seller_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-navy mb-6">Mis Pedidos</h1>
        <OrderTabs
          purchases={(purchases ?? []) as OrderWithDetails[]}
          sales={(sales ?? []) as OrderWithDetails[]}
        />
      </main>
    </div>
  );
}
