import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { notifySeller } from "@/lib/notifications";

/**
 * POST /api/orders/:id/notify
 * Manually (re-)send seller notification for an order.
 * Requires the caller to be the buyer or seller of that order.
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: orderId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  // Verify the user is part of this order
  const { data: order } = await supabase
    .from("orders")
    .select("id, buyer_id, seller_id, status")
    .eq("id", orderId)
    .single();

  if (!order) {
    return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
  }

  if (order.buyer_id !== user.id && order.seller_id !== user.id) {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
  }

  if (order.status !== "paid") {
    return NextResponse.json(
      { error: "Solo se notifica para ordenes pagadas" },
      { status: 400 }
    );
  }

  // notifySeller lee los correos de ambas partes, que no se conceden a
  // authenticated (20260923e). Ya se verificó arriba que es parte del pedido.
  const notification = await notifySeller(orderId, createServiceRoleClient());

  if (!notification) {
    return NextResponse.json(
      { error: "Error al generar notificacion" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, notification });
}
