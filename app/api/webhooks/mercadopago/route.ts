import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { paymentClient } from "@/lib/mercadopago";
import { notifySeller } from "@/lib/notifications";

/**
 * MercadoPago IPN webhook.
 * Uses service_role key to bypass RLS and update order status.
 */
export async function POST(req: NextRequest) {
  const body = await req.json();

  // MercadoPago sends { action: "payment.created", data: { id: "123" } }
  if (body.type !== "payment" && body.action !== "payment.created") {
    return NextResponse.json({ received: true });
  }

  const paymentId = body.data?.id;
  if (!paymentId) {
    return NextResponse.json({ error: "No payment ID" }, { status: 400 });
  }

  try {
    const payment = await paymentClient.get({ id: paymentId });

    const orderId = payment.external_reference;
    if (!orderId) {
      return NextResponse.json({ error: "No external_reference" }, { status: 400 });
    }

    // Map MP status to our order status
    let orderStatus: string;
    switch (payment.status) {
      case "approved":
        orderStatus = "paid";
        break;
      case "rejected":
      case "cancelled":
        orderStatus = "cancelled";
        break;
      default:
        // pending, in_process, etc.
        orderStatus = "pending";
    }

    // Use service role to update (bypasses RLS)
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { cookies: { getAll: () => [], setAll: () => {} } }
    );

    await supabase
      .from("orders")
      .update({
        status: orderStatus,
        mercadopago_payment_id: String(paymentId),
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    // If paid, mark listing as completed
    if (orderStatus === "paid") {
      const { data: order } = await supabase
        .from("orders")
        .select("listing_id")
        .eq("id", orderId)
        .single();

      if (order) {
        await supabase
          .from("listings")
          .update({ status: "completed" })
          .eq("id", order.listing_id);
      }

      // Notify seller about the sale (non-blocking)
      notifySeller(orderId, supabase).catch((err) =>
        console.error("[webhook] notifySeller error:", err)
      );
    }

    return NextResponse.json({ received: true, status: orderStatus });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Webhook error";
    console.error("MercadoPago webhook error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
