import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { paymentClient } from "@/lib/mercadopago";
import { notifySeller } from "@/lib/notifications";
import crypto from "crypto";

/**
 * Verify MercadoPago webhook signature (x-signature header).
 * See: https://www.mercadopago.cl/developers/es/docs/your-integrations/notifications/webhooks
 */
function verifySignature(req: NextRequest, body: Record<string, unknown>): boolean {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  if (!secret) {
    console.warn("[webhook] MERCADOPAGO_WEBHOOK_SECRET not set — skipping verification");
    return true; // Allow in dev, but log warning
  }

  const xSignature = req.headers.get("x-signature");
  const xRequestId = req.headers.get("x-request-id");
  if (!xSignature || !xRequestId) return false;

  // Parse ts and v1 from x-signature header
  const parts = Object.fromEntries(
    xSignature.split(",").map((p) => {
      const [key, ...val] = p.trim().split("=");
      return [key, val.join("=")];
    })
  );

  const ts = parts["ts"];
  const v1 = parts["v1"];
  if (!ts || !v1) return false;

  // Build manifest string
  const dataId = (body as Record<string, unknown>).data
    ? ((body as Record<string, unknown>).data as Record<string, unknown>).id ?? ""
    : "";
  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;

  const hmac = crypto
    .createHmac("sha256", secret)
    .update(manifest)
    .digest("hex");

  return hmac === v1;
}

/**
 * MercadoPago IPN webhook.
 * Handles both orders and rentals (distinguished by external_reference).
 * Uses service_role key to bypass RLS.
 */
export async function POST(req: NextRequest) {
  const body = await req.json();

  // Verify signature
  if (!verifySignature(req, body)) {
    console.error("[webhook] Invalid signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  if (body.type !== "payment" && body.action !== "payment.created") {
    return NextResponse.json({ received: true });
  }

  const paymentId = body.data?.id;
  if (!paymentId) {
    return NextResponse.json({ error: "No payment ID" }, { status: 400 });
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );

  try {
    const payment = await paymentClient.get({ id: paymentId });

    const externalRef = payment.external_reference;
    if (!externalRef) {
      return NextResponse.json({ error: "No external_reference" }, { status: 400 });
    }

    // Map MP status
    let status: string;
    switch (payment.status) {
      case "approved":
        status = "paid";
        break;
      case "rejected":
      case "cancelled":
        status = "cancelled";
        break;
      default:
        status = "pending";
    }

    // Determine if this is an order or rental by checking both tables
    const { data: order } = await supabase
      .from("orders")
      .select("id, listing_id")
      .eq("id", externalRef)
      .single();

    if (order) {
      // ── ORDER ──
      await supabase
        .from("orders")
        .update({
          status,
          mercadopago_payment_id: String(paymentId),
          updated_at: new Date().toISOString(),
        })
        .eq("id", order.id);

      if (status === "paid") {
        await supabase
          .from("listings")
          .update({ status: "completed" })
          .eq("id", order.listing_id);

        notifySeller(order.id, supabase).catch((err) =>
          console.error("[webhook] notifySeller error:", err)
        );
      }
    } else {
      // ── RENTAL ──
      const { data: rental } = await supabase
        .from("rentals")
        .select("id, listing_id")
        .eq("id", externalRef)
        .single();

      if (rental) {
        await supabase
          .from("rentals")
          .update({
            status,
            mercadopago_payment_id: String(paymentId),
            updated_at: new Date().toISOString(),
          })
          .eq("id", rental.id);

        if (status === "paid") {
          await supabase
            .from("listings")
            .update({ status: "rented" })
            .eq("id", rental.listing_id);
        }
      } else {
        console.error("[webhook] No order or rental found for ref:", externalRef);
        return NextResponse.json({ error: "Reference not found" }, { status: 404 });
      }
    }

    return NextResponse.json({ received: true, status });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Webhook error";
    console.error("MercadoPago webhook error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
