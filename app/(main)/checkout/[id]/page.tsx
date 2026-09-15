import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { avisarOrigenFaltante, estadoOrigenVendedor } from "@/lib/shipit-origen";
import { obtenerTarifasCoordinado } from "@/lib/shipping/coordinado";
import CheckoutForm from "@/components/checkout/CheckoutForm";
import type { ListingWithBook } from "@/types";

interface Props {
  params: { id: string };
}

export const metadata = { title: "Finalizar compra — tuslibros.cl", robots: { index: false } };

export default async function CheckoutPage({ params }: Props) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: listing } = await supabase
    .from("listings")
    .select(
      `*, book:books(*), seller:users(id, full_name, avatar_url, phone, mercadopago_user_id, acepta_transferencia, datos_transferencia)`
    )
    .eq("id", params.id)
    .eq("status", "active")
    .single();

  if (!listing) {
    redirect("/");
  }

  const typedListing = listing as unknown as ListingWithBook;

  if (user && typedListing.seller_id === user.id) {
    redirect(`/listings/${params.id}`);
  }

  // Get buyer profile for default address
  const { data: buyerProfile } = user 
    ? await supabase
        .from("users")
        .select("full_name, default_address, phone")
        .eq("id", user.id)
        .single()
    : { data: null };

  // D1 revisada: fuera de la RM sin origen en Shipit no se ofrece courier.
  // El intento de compra es la señal para que Vero cree el origen (gong,
  // máximo uno al día por vendedor).
  const admin = createServiceRoleClient();
  const [origen, tarifasCoordinado] = await Promise.all([
    estadoOrigenVendedor(admin, typedListing.seller_id),
    obtenerTarifasCoordinado(admin),
  ]);
  // Con despacho coordinado activo, un vendedor con MercadoPago puede vender
  // por courier aunque no tenga origen en Shipit (lib/shipping/coordinado.ts).
  const coordinadoDisponible = !!tarifasCoordinado && !!(typedListing.seller as any)?.mercadopago_user_id;
  const courierDisponible =
    (origen.courierDisponible && !tarifasCoordinado?.apagar_shipit) || coordinadoDisponible;
  if (!origen.courierDisponible && !coordinadoDisponible) {
    avisarOrigenFaltante(admin, typedListing.seller_id, "recibió un intento de compra con courier").catch(() => {});
  }

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
          courierDisponible={courierDisponible}
          // La opción aparece solo si además cargó los datos: ofrecer
          // transferir y después no tener a qué cuenta es peor que no ofrecerla.
          aceptaTransferencia={
            !!(typedListing.seller as any)?.acepta_transferencia &&
            !!String((typedListing.seller as any)?.datos_transferencia ?? "").trim()
          }
        />
      </main>
    </div>
  );
}
