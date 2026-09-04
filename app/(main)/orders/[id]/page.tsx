import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import PurchaseTracker from "@/components/analytics/PurchaseTracker";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

interface Props {
  params: { id: string };
  searchParams: { status?: string };
}

const STATUS_CONFIG: Record<
  string,
  { title: string; description: string; color: string }
> = {
  success: {
    title: "Pago confirmado",
    description:
      "Tu pago fue procesado exitosamente. El vendedor será notificado y coordinará la entrega.",
    color: "text-green-600",
  },
  failure: {
    title: "El pago no pasó",
    description: "El libro sigue disponible y reservado para ti un rato. Abajo hay tres formas de retomarlo.",
    color: "text-red-600",
  },
  pending: {
    title: "Pago pendiente",
    description: "Tu pago está siendo procesado. Te notificaremos cuando se confirme.",
    color: "text-yellow-600",
  },
};

const STATUS_ALIAS: Record<string, string> = {
  paid: "success",
  approved: "success",
  completed: "success",
  rejected: "failure",
  cancelled: "failure",
};

export default async function OrderPage({ params, searchParams }: Props) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: order } = await supabase
    .from("orders")
    .select(
      `*, listing:listings(*, book:books(title, author, cover_url)), seller:users!orders_seller_id_fkey(id, username, full_name)`
    )
    .eq("id", params.id)
    .single();

  if (!order || (order.buyer_id !== user.id && order.seller_id !== user.id)) {
    redirect("/");
  }

  // Si es parte de un bundle, traer todas las orders hermanas
  let bundleOrders: any[] = [order];
  let bundleTotal = Number(order.total);
  if (order.bundle_id) {
    const { data: all } = await supabase
      .from("orders")
      .select(
        `*, listing:listings(*, book:books(title, author, cover_url))`
      )
      .eq("bundle_id", order.bundle_id)
      .order("created_at", { ascending: true });
    if (all && all.length > 0) {
      bundleOrders = all;
      bundleTotal = all.reduce((sum, o: any) => sum + Number(o.total), 0);
    }
  }

  const rawStatus = searchParams.status ?? order.status;
  const paymentStatus = STATUS_ALIAS[rawStatus] ?? rawStatus;

  // Por qué no pasó el pago. MercadoPago lo manda al webhook y queda en
  // mp_webhook_log (external_ref = bundle_id). Hasta el 04-09-2026 esta
  // pantalla decía "puedes intentar nuevamente" y mandaba a un carrito que
  // ya estaba vacío: el comprador quedaba sin salida.
  let rejectReason: string | null = null;
  if (paymentStatus === "failure") {
    try {
      const admin = createServiceRoleClient();
      const { data: log } = await admin
        .from("mp_webhook_log")
        .select("mp_status_detail")
        .eq("external_ref", order.bundle_id ?? order.id)
        .in("mp_status", ["rejected", "cancelled"])
        .order("received_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      rejectReason = log?.mp_status_detail ?? null;
    } catch {
      rejectReason = null;
    }
  }
  const rejectText = explicarRechazo(rejectReason);
  const seller = order.seller as { id: string; username: string | null; full_name: string | null } | null;
  const sellerFirstName = seller?.full_name?.split(" ")[0] ?? "el vendedor";
  const isBuyer = order.buyer_id === user.id;
  const config = STATUS_CONFIG[paymentStatus] ?? STATUS_CONFIG.pending;
  const isBundle = bundleOrders.length > 1;

  // Tracking/courier viene de la order "cabeza" (la que tiene shipping_cost > 0)
  const headOrder = bundleOrders.find((o: any) => Number(o.shipping_cost) > 0) ?? order;

  return (
    <div className="min-h-screen bg-gray-50">
      {paymentStatus === "success" && (
        <PurchaseTracker
          orderId={order.bundle_id ?? order.id}
          total={bundleTotal}
          itemCount={bundleOrders.length}
        />
      )}
      <main className="max-w-xl mx-auto px-4 py-12">
        <div className="bg-white rounded-lg border border-gray-200 p-8">
          <h1 className={`text-2xl font-bold mb-2 text-center ${config.color}`}>
            {config.title}
          </h1>
          <p className="text-gray-600 text-sm mb-6 text-center">
            {config.description}
          </p>

          <div className="border-t border-gray-100 pt-4 mb-6">
            <p className="text-xs uppercase tracking-wider text-gray-500 mb-3">
              {isBundle ? `${bundleOrders.length} libros` : "Libro"}
            </p>
            <div className="space-y-3">
              {bundleOrders.map((o: any) => {
                const book = o.listing?.book;
                const cover = o.listing?.cover_image_url ?? book?.cover_url;
                return (
                  <div key={o.id} className="flex items-center gap-3">
                    {cover && (
                      <img
                        src={cover}
                        alt={book.title}
                        className="w-10 h-14 object-cover rounded shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm truncate">
                        {book?.title ?? "Libro"}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {book?.author}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-gray-900 whitespace-nowrap">
                      ${Number(o.book_price).toLocaleString("es-CL")}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="text-sm text-gray-600 space-y-1 mb-6 border-t border-gray-100 pt-4">
            <div className="flex justify-between">
              <span>Total</span>
              <span className="font-bold text-gray-900">
                ${bundleTotal.toLocaleString("es-CL")}
              </span>
            </div>
            {headOrder.courier && (
              <div className="flex justify-between">
                <span>Entrega</span>
                <span>{headOrder.courier}</span>
              </div>
            )}
            {headOrder.tracking_code && (
              <div className="flex justify-between">
                <span>Tracking</span>
                <span className="font-mono text-xs">{headOrder.tracking_code}</span>
              </div>
            )}
          </div>

          <div className="flex gap-3 justify-center">
            <Link
              href="/"
              className="bg-brand-500 hover:bg-brand-600 text-white font-medium px-6 py-2.5 rounded-md text-sm transition-colors"
            >
              Volver al inicio
            </Link>
          </div>

          {paymentStatus === "failure" && isBuyer && (
            <div className="mt-8 border-t border-gray-100 pt-6">
              <p className="text-sm text-gray-700 leading-relaxed mb-5">{rejectText}</p>
              <div className="space-y-2">
                {bundleOrders.map((o: any) => {
                  const book = o.listing?.book;
                  const url =
                    o.listing?.slug && seller?.username
                      ? `/libro/${seller.username}/${o.listing.slug}`
                      : `/listings/${o.listing_id}`;
                  return (
                    <Link
                      key={o.id}
                      href={url}
                      className="flex items-center justify-between gap-3 bg-brand-500 hover:bg-brand-600 text-white font-medium px-5 py-3 rounded-md text-sm transition-colors"
                    >
                      <span className="truncate">Volver a intentar: {book?.title ?? "el libro"}</span>
                      <span aria-hidden>→</span>
                    </Link>
                  );
                })}
                {seller?.id && (
                  <Link
                    href={`/mensajes?to=${seller.id}`}
                    className="flex items-center justify-between gap-3 border border-gray-300 text-gray-800 hover:bg-gray-50 font-medium px-5 py-3 rounded-md text-sm transition-colors"
                  >
                    <span>Escribirle a {sellerFirstName} para coordinar otra forma de pago</span>
                    <span aria-hidden>→</span>
                  </Link>
                )}
                <a
                  href={`https://wa.me/56994583067?text=${encodeURIComponent(
                    `Hola Vero, intenté pagar "${bundleOrders[0]?.listing?.book?.title ?? "un libro"}" en tuslibros.cl y el pago no pasó. ¿Me ayudas?`
                  )}`}
                  target="_blank"
                  rel="noopener"
                  className="flex items-center justify-between gap-3 border border-gray-300 text-gray-800 hover:bg-gray-50 font-medium px-5 py-3 rounded-md text-sm transition-colors"
                >
                  <span>Pedir ayuda a Vero por WhatsApp</span>
                  <span aria-hidden>→</span>
                </a>
              </div>
              <p className="mt-4 text-xs text-gray-500 leading-relaxed">
                En la ficha puedes pagar con otra tarjeta, con débito o con saldo de MercadoPago. Si el vendedor entrega en persona, también puedes coordinar transferencia con él.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

/**
 * Traduce el status_detail de MercadoPago a algo que un comprador entienda,
 * sin culparlo. Códigos: https://www.mercadopago.cl/developers/es/docs/checkout-api/response-handling/collection-results
 */
function explicarRechazo(detail: string | null): string {
  if (!detail) return "MercadoPago no aceptó el pago. Suele ser un tema del banco o de la tarjeta, no algo que hiciste mal.";
  if (detail === "cc_rejected_high_risk" || detail === "rejected_high_risk")
    return "MercadoPago frenó el pago por seguridad. Pasa seguido con cuentas nuevas o con tarjetas que no se han usado antes en línea. No es culpa tuya: con otra tarjeta, con débito o coordinando directo con el vendedor, sale.";
  if (detail === "cc_rejected_insufficient_amount")
    return "La tarjeta no tenía cupo o saldo suficiente para el total. Puedes intentar con otra tarjeta o con débito.";
  if (detail.startsWith("cc_rejected_bad_filled"))
    return "Algún dato de la tarjeta quedó mal escrito (número, vencimiento o código de seguridad). Vuelve a intentarlo con calma.";
  if (detail === "cc_rejected_call_for_authorize")
    return "Tu banco pide que autorices el pago por teléfono antes de volver a intentar. Después de llamar, vuelve a la ficha.";
  if (detail === "cc_rejected_card_disabled")
    return "La tarjeta está deshabilitada para compras en línea. Puedes habilitarla con tu banco o pagar con otra.";
  if (detail === "cc_rejected_max_attempts")
    return "Se superó el número de intentos permitidos con esa tarjeta. Espera un rato o usa otra.";
  if (detail === "by_payer" || detail === "cc_rejected_by_payer")
    return "Cancelaste el pago antes de terminar. Si fue sin querer, acá puedes retomarlo.";
  return "MercadoPago no aceptó el pago. Suele ser un tema del banco o de la tarjeta, no algo que hiciste mal.";
}
