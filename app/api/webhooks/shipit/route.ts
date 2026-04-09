import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * POST /api/webhooks/shipit
 * Recibe notificaciones de Shipit sobre cambios de estado en envíos.
 * Valida el token secreto y actualiza la orden correspondiente.
 */
export async function POST(req: NextRequest) {
  // Validate webhook token
  const token = req.headers.get("x-shipit-token");
  if (!token || token !== process.env.SHIPIT_TOKEN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();

    // Shipit typically sends: tracking_number, status, status_name, updated_at, etc.
    const trackingCode = body.tracking_number ?? body.tracking_code;
    const status = body.status ?? body.status_name;

    if (!trackingCode) {
      return NextResponse.json({ error: "Missing tracking_number" }, { status: 400 });
    }

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { cookies: { getAll: () => [], setAll: () => {} } },
    );

    // Find order by tracking code
    const { data: order } = await supabase
      .from("orders")
      .select("id, status")
      .eq("tracking_code", trackingCode)
      .single();

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Map Shipit status to our order status
    const statusMap: Record<string, string> = {
      in_transit: "shipped",
      delivered: "delivered",
      returned: "returned",
      failed: "shipping_failed",
    };

    const newStatus = statusMap[status] ?? null;
    if (newStatus && newStatus !== order.status) {
      await supabase
        .from("orders")
        .update({
          status: newStatus,
          shipping_status: status,
          shipping_updated_at: new Date().toISOString(),
        })
        .eq("id", order.id);
    }

    // Log the webhook payload for debugging
    await supabase.from("webhook_logs").insert({
      source: "shipit",
      payload: body,
      processed: !!newStatus,
    }).then(() => {}, () => {}); // Ignore if table doesn't exist

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
}
