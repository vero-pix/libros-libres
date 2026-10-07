import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import OrderTabs from "./OrderTabs";
import OfertasRecibidas from "@/components/offers/OfertasRecibidas";
import { negociacionesVigentes } from "@/lib/offers";
import { cobraPorTransferencia } from "@/lib/cobro-transferencia";
import { OrderWithDetails } from "@/types";

export const metadata = { title: "Mis compras — tuslibros.cl", robots: { index: false } };

const ORDER_SELECT = `
  *,
  listing:listings (
    *,
    book:books (*),
    seller:users (username)
  ),
  buyer:users!orders_buyer_id_fkey (id, full_name)
`;
// Sin email ni phone: desde el 04-10-2026 `users` solo concede id, full_name y
// username a la sesión (20261004_users_sin_escalada_de_rol.sql), y pedir una
// columna no concedida tumba la consulta entera. "Mis compras" salió vacía
// para todos los compradores del 04-10 al 07-10.

export default async function MisPedidosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/mis-pedidos");

  const [{ data: purchases }, misOfertas] = await Promise.all([
    supabase
      .from("orders")
      .select(ORDER_SELECT)
      .eq("buyer_id", user.id)
      .order("created_at", { ascending: false }),
    // Las ofertas que hice y siguen vivas (lib/offers.ts): si me aceptaron o me
    // contraofertaron, acá tengo el botón para comprar o responder.
    negociacionesVigentes(supabase, user.id, "buyer"),
  ]);

  // Una oferta aceptada solo lleva botón de comprar si ese vendedor cobra en el
  // sitio; si no, el trato se cierra en la conversación (nunca un checkout sin salida).
  const ofertasConCobro = await Promise.all(
    misOfertas.map(async (o) => ({
      ...o,
      puedePagarEnSitio: o.contraparteConMP || (await cobraPorTransferencia(o.seller_id)),
    }))
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-navy mb-6">Mis compras</h1>
        <OfertasRecibidas ofertas={ofertasConCobro} currentUserId={user.id} titulo="Mis ofertas" />
        <OrderTabs purchases={(purchases ?? []) as OrderWithDetails[]} />
      </main>
    </div>
  );
}
