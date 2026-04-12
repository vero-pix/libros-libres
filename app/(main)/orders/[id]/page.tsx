import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

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
    title: "Pago rechazado",
    description: "El pago no pudo ser procesado. Puedes intentar nuevamente.",
    color: "text-red-600",
  },
  pending: {
    title: "Pago pendiente",
    description: "Tu pago está siendo procesado. Te notificaremos cuando se confirme.",
    color: "text-yellow-600",
  },
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
      `*, listing:listings(*, book:books(title, author, cover_url))`
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

  const paymentStatus = searchParams.status ?? order.status;
  const config = STATUS_CONFIG[paymentStatus] ?? STATUS_CONFIG.pending;
  const isBundle = bundleOrders.length > 1;

  // Tracking/courier viene de la order "cabeza" (la que tiene shipping_cost > 0)
  const headOrder = bundleOrders.find((o: any) => Number(o.shipping_cost) > 0) ?? order;

  return (
    <div className="min-h-screen bg-gray-50">
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
                return (
                  <div key={o.id} className="flex items-center gap-3">
                    {book?.cover_url && (
                      <img
                        src={book.cover_url}
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
            {paymentStatus === "failure" && (
              <Link
                href="/carrito"
                className="border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium px-6 py-2.5 rounded-md text-sm transition-colors"
              >
                Reintentar desde el carrito
              </Link>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
