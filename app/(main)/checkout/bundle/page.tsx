import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { telefonoDe } from "@/lib/telefonoVendedor";
import { avisarOrigenFaltante, estadoOrigenVendedor } from "@/lib/shipit-origen";
import { obtenerTarifasCoordinado } from "@/lib/shipping/coordinado";
import { preciosAcordados } from "@/lib/offers";
import BundleCheckoutForm from "@/components/checkout/BundleCheckoutForm";
import type { ListingWithBook } from "@/types";

interface Props {
  searchParams: { listings?: string };
}

export const metadata = { title: "Finalizar compra — tuslibros.cl", robots: { index: false } };

export default async function BundleCheckoutPage({ searchParams }: Props) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const q = encodeURIComponent(
      `/checkout/bundle?listings=${searchParams.listings ?? ""}`
    );
    redirect(`/login?next=${q}`);
  }

  const ids = (searchParams.listings ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (ids.length === 0) {
    redirect("/carrito");
  }

  const { data: listings } = await supabase
    .from("listings")
    .select(
      `*, book:books(*), seller:users(id, full_name, avatar_url, mercadopago_user_id, acepta_transferencia)`
    )
    .in("id", ids)
    .eq("status", "active");

  if (!listings || listings.length === 0) {
    redirect("/carrito");
  }

  // Todos del mismo vendedor
  const sellerIds = new Set(listings.map((l: any) => l.seller_id));
  if (sellerIds.size > 1) {
    redirect("/carrito");
  }

  // Comprador ≠ vendedor
  if (listings[0].seller_id === user.id) {
    redirect("/carrito");
  }

  const typedListings = listings as unknown as ListingWithBook[];
  // El teléfono del vendedor, para el WhatsApp del checkout (BundleCheckoutForm).
  // `users.phone` no se concede a authenticated desde 20260923e.
  const telBundle = typedListings[0] ? await telefonoDe(typedListings[0].seller_id) : null;
  for (const l of typedListings) if (l.seller) (l.seller as any).phone = telBundle;

  // Ofertas aceptadas y vigentes: el resumen muestra el precio acordado, el
  // mismo que va a cobrar /api/orders (los dos leen preciosAcordados()).
  const acordados = await preciosAcordados(createServiceRoleClient(), user.id, typedListings.map((l) => l.id));
  for (const l of typedListings) {
    const a = acordados[l.id];
    if (a && l.price != null && a.amount < l.price) l.price = a.amount;
  }

  // D1 revisada: fuera de la RM sin origen en Shipit no se ofrece courier.
  const admin = createServiceRoleClient();
  const [origen, tarifasCoordinado] = await Promise.all([
    estadoOrigenVendedor(admin, listings[0].seller_id),
    obtenerTarifasCoordinado(admin),
  ]);
  // Ver checkout/[id]: con despacho coordinado, el origen en Shipit deja de ser requisito.
  const coordinadoDisponible = !!tarifasCoordinado && !!(listings[0] as any).seller?.mercadopago_user_id;
  const courierDisponible =
    (origen.courierDisponible && !tarifasCoordinado?.apagar_shipit) || coordinadoDisponible;
  if (!origen.courierDisponible && !coordinadoDisponible) {
    avisarOrigenFaltante(admin, listings[0].seller_id, "recibió un intento de compra con courier").catch(() => {});
  }

  // Con service role y acotado a user.id: la dirección no se concede a
  // authenticated (20260923e).
  const { data: buyerProfile } = await createServiceRoleClient()
    .from("users")
    .select("full_name, default_address, phone")
    .eq("id", user.id)
    .single();

  // Comprador necesita teléfono para coordinar entrega (persona o courier)
  if (!buyerProfile?.phone) {
    const { default: Link } = await import("next/link");
    const returnTo = `/checkout/bundle?listings=${ids.join(",")}`;
    return (
      <div className="min-h-screen bg-cream">
        <main className="max-w-xl mx-auto px-4 py-16">
          <div className="bg-white rounded-xl border border-amber-300 p-8 text-center">
            <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full mb-4">
              <span className="text-xs font-semibold text-amber-700">
                Completa tu perfil para comprar
              </span>
            </div>
            <h1 className="font-display text-2xl font-bold text-ink mb-3">
              Necesitamos tu teléfono
            </h1>
            <p className="text-ink-muted text-sm mb-6 leading-relaxed">
              Para coordinar la entrega con el vendedor — sea en persona o por
              courier — necesitamos un número donde puedan contactarte.
              Son 20 segundos.
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
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Checkout — {typedListings.length} {typedListings.length === 1 ? "libro" : "libros"}
        </h1>
        <BundleCheckoutForm
          listings={typedListings}
          buyerAddress={buyerProfile?.default_address ?? ""}
          buyerName={buyerProfile?.full_name ?? ""}
          courierDisponible={courierDisponible}
          aceptaTransferencia={
            !!(typedListings[0]?.seller as any)?.acepta_transferencia
          }
        />
      </main>
    </div>
  );
}
