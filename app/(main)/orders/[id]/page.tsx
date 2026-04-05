import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

interface Props {
  params: { id: string };
  searchParams: { status?: string };
}

const STATUS_CONFIG: Record<string, { title: string; description: string; color: string }> = {
  success: {
    title: "Pago confirmado",
    description: "Tu pago fue procesado exitosamente. El vendedor será notificado y coordinará el envío.",
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

  const paymentStatus = searchParams.status ?? order.status;
  const config = STATUS_CONFIG[paymentStatus] ?? STATUS_CONFIG.pending;
  const book = (order.listing as { book: { title: string; author: string } })?.book;

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-xl mx-auto px-4 py-12">
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <h1 className={`text-2xl font-bold mb-2 ${config.color}`}>
            {config.title}
          </h1>
          <p className="text-gray-600 text-sm mb-6">{config.description}</p>

          {book && (
            <div className="border-t border-gray-100 pt-4 mb-6">
              <p className="font-medium text-gray-900">{book.title}</p>
              <p className="text-sm text-gray-500">{book.author}</p>
            </div>
          )}

          <div className="text-sm text-gray-600 space-y-1 mb-6">
            <p>
              Total: <span className="font-bold text-gray-900">${Number(order.total).toLocaleString("es-CL")}</span>
            </p>
            <p>Envío: {order.shipping_speed === "express" ? "Rápido" : "Estándar"} ({order.courier})</p>
            {order.tracking_code && (
              <p>Código de seguimiento: <span className="font-mono">{order.tracking_code}</span></p>
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
                href={`/checkout/${order.listing_id}`}
                className="border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium px-6 py-2.5 rounded-md text-sm transition-colors"
              >
                Reintentar
              </Link>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
