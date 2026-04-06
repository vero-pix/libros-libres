import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { paymentClient } from "@/lib/mercadopago";
import { notifySeller } from "@/lib/notifications";
import { sendEmail } from "@/lib/email";
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

        // ── Transactional emails ──
        try {
          const { data: fullOrder } = await supabase
            .from("orders")
            .select("*, listing:listings(*, book:books(*)), buyer:users!orders_buyer_id_fkey(id, full_name, email), seller:users!orders_seller_id_fkey(id, full_name, email)")
            .eq("id", order.id)
            .single();

          if (fullOrder) {
            const bookTitle = fullOrder.listing?.book?.title ?? "Libro";
            const price = fullOrder.total ?? fullOrder.book_price ?? 0;
            const buyerName = fullOrder.buyer?.full_name ?? "Comprador";
            const sellerName = fullOrder.seller?.full_name ?? "Vendedor";
            const buyerEmail = fullOrder.buyer?.email;
            const sellerEmail = fullOrder.seller?.email;
            const deliveryMethod = fullOrder.courier ?? fullOrder.shipping_speed ?? "Por coordinar";
            const buyerAddress = fullOrder.buyer_address ?? "No especificada";

            if (buyerEmail) {
              await sendEmail({
                to: buyerEmail,
                subject: "Confirmación de compra — tuslibros.cl",
                html: `
                  <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px">
                    <h2 style="color:#1a1a1a">¡Compra confirmada!</h2>
                    <p>Tu pago fue recibido correctamente.</p>
                    <table style="width:100%;border-collapse:collapse;margin:16px 0">
                      <tr><td style="padding:8px 0;color:#666">Libro</td><td style="padding:8px 0;font-weight:600">${bookTitle}</td></tr>
                      <tr><td style="padding:8px 0;color:#666">Total</td><td style="padding:8px 0;font-weight:600">$${Number(price).toLocaleString("es-CL")}</td></tr>
                      <tr><td style="padding:8px 0;color:#666">Vendedor</td><td style="padding:8px 0">${sellerName}</td></tr>
                      <tr><td style="padding:8px 0;color:#666">Entrega</td><td style="padding:8px 0">${deliveryMethod}</td></tr>
                    </table>
                    <p style="color:#888;font-size:13px">Gracias por usar tuslibros.cl</p>
                  </div>
                `,
              });
            }

            if (sellerEmail) {
              await sendEmail({
                to: sellerEmail,
                subject: "Nueva venta — tuslibros.cl",
                html: `
                  <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px">
                    <h2 style="color:#1a1a1a">¡Tienes una nueva venta!</h2>
                    <table style="width:100%;border-collapse:collapse;margin:16px 0">
                      <tr><td style="padding:8px 0;color:#666">Libro</td><td style="padding:8px 0;font-weight:600">${bookTitle}</td></tr>
                      <tr><td style="padding:8px 0;color:#666">Total</td><td style="padding:8px 0;font-weight:600">$${Number(price).toLocaleString("es-CL")}</td></tr>
                      <tr><td style="padding:8px 0;color:#666">Comprador</td><td style="padding:8px 0">${buyerName}</td></tr>
                      <tr><td style="padding:8px 0;color:#666">Dirección de entrega</td><td style="padding:8px 0">${buyerAddress}</td></tr>
                    </table>
                    <p style="color:#888;font-size:13px">Prepara el libro para el envío. tuslibros.cl</p>
                  </div>
                `,
              });
            }
          }
        } catch (emailErr) {
          console.error("[webhook] Email send error (order):", emailErr);
        }
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

          // ── Transactional emails (rental) ──
          try {
            const { data: fullRental } = await supabase
              .from("rentals")
              .select("*, listing:listings(*, book:books(*)), renter:users!rentals_renter_id_fkey(id, full_name, email), owner:users!rentals_owner_id_fkey(id, full_name, email)")
              .eq("id", rental.id)
              .single();

            if (fullRental) {
              const bookTitle = fullRental.listing?.book?.title ?? "Libro";
              const rentalPrice = fullRental.rental_price ?? fullRental.total ?? 0;
              const renterName = fullRental.renter?.full_name ?? "Arrendatario";
              const ownerName = fullRental.owner?.full_name ?? "Propietario";
              const renterEmail = fullRental.renter?.email;
              const ownerEmail = fullRental.owner?.email;
              const deliveryMethod = fullRental.delivery_method ?? "Por coordinar";

              if (renterEmail) {
                await sendEmail({
                  to: renterEmail,
                  subject: "Confirmación de arriendo — tuslibros.cl",
                  html: `
                    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px">
                      <h2 style="color:#1a1a1a">¡Arriendo confirmado!</h2>
                      <table style="width:100%;border-collapse:collapse;margin:16px 0">
                        <tr><td style="padding:8px 0;color:#666">Libro</td><td style="padding:8px 0;font-weight:600">${bookTitle}</td></tr>
                        <tr><td style="padding:8px 0;color:#666">Monto</td><td style="padding:8px 0;font-weight:600">$${Number(rentalPrice).toLocaleString("es-CL")}</td></tr>
                        <tr><td style="padding:8px 0;color:#666">Propietario</td><td style="padding:8px 0">${ownerName}</td></tr>
                        <tr><td style="padding:8px 0;color:#666">Entrega</td><td style="padding:8px 0">${deliveryMethod}</td></tr>
                      </table>
                      <p style="color:#888;font-size:13px">Gracias por usar tuslibros.cl</p>
                    </div>
                  `,
                });
              }

              if (ownerEmail) {
                await sendEmail({
                  to: ownerEmail,
                  subject: "Nuevo arriendo — tuslibros.cl",
                  html: `
                    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px">
                      <h2 style="color:#1a1a1a">¡Tu libro fue arrendado!</h2>
                      <table style="width:100%;border-collapse:collapse;margin:16px 0">
                        <tr><td style="padding:8px 0;color:#666">Libro</td><td style="padding:8px 0;font-weight:600">${bookTitle}</td></tr>
                        <tr><td style="padding:8px 0;color:#666">Monto</td><td style="padding:8px 0;font-weight:600">$${Number(rentalPrice).toLocaleString("es-CL")}</td></tr>
                        <tr><td style="padding:8px 0;color:#666">Arrendatario</td><td style="padding:8px 0">${renterName}</td></tr>
                      </table>
                      <p style="color:#888;font-size:13px">Coordina la entrega con el arrendatario. tuslibros.cl</p>
                    </div>
                  `,
                });
              }
            }
          } catch (emailErr) {
            console.error("[webhook] Email send error (rental):", emailErr);
          }
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
