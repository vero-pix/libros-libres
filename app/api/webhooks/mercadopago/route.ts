import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { paymentClient } from "@/lib/mercadopago";
import { notifySeller } from "@/lib/notifications";
import { sendEmail } from "@/lib/email";
import { createShipitOrder } from "@/lib/shipit";
import { extractCommune } from "@/lib/chilexpress";
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

        // ── Create Shipit shipment if courier order ──
        try {
          const { data: shipitOrder } = await supabase
            .from("orders")
            .select("id, buyer_id, buyer_address, shipping_cost, courier")
            .eq("id", order.id)
            .single();

          const isInPerson = shipitOrder?.courier === "Entrega en persona" || shipitOrder?.courier === "Punto de retiro";

          if (shipitOrder?.buyer_address && !isInPerson) {
            // Get buyer info separately to avoid array type issue
            const { data: buyer } = await supabase
              .from("users")
              .select("full_name, email, phone")
              .eq("id", shipitOrder.buyer_id)
              .single();

            const commune = extractCommune(shipitOrder.buyer_address);
            const addressParts = shipitOrder.buyer_address.split(",")[0]?.trim() ?? "";
            const streetMatch = addressParts.match(/^(.+?)\s+(\d+)/);

            const shipitResult = await createShipitOrder({
              orderId: order.id,
              destiny: {
                street: streetMatch?.[1] ?? addressParts,
                number: parseInt(streetMatch?.[2] ?? "0", 10),
                commune_id: 0,
                commune_name: commune,
                full_name: buyer?.full_name ?? "Comprador",
                email: buyer?.email ?? "",
                phone: buyer?.phone ?? "",
              },
              courier: {
                client: shipitOrder.courier ?? "starken",
                price: shipitOrder.shipping_cost ?? 0,
              },
            });

            if (shipitResult.state !== "error") {
              await supabase
                .from("orders")
                .update({
                  tracking_code: shipitResult.tracking_code ?? null,
                  shipping_status: shipitResult.state,
                  shipping_label_url: shipitResult.label_url ?? null,
                  shipit_order_id: shipitResult.id || null,
                  shipping_updated_at: new Date().toISOString(),
                })
                .eq("id", order.id);
              console.log(`[webhook] Shipit order created: ${shipitResult.id} for order ${order.id}`);
            } else {
              console.error(`[webhook] Shipit order failed for ${order.id}:`, shipitResult.error);
            }
          }
        } catch (shipitErr) {
          console.error("[webhook] Shipit creation error:", shipitErr);
          // Don't fail the webhook — payment is already confirmed
        }

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
              // Re-fetch order to pick up shipping fields written moments ago by the Shipit block above.
              const { data: updatedOrder } = await supabase
                .from("orders")
                .select("courier, tracking_code, shipping_label_url, shipit_order_id")
                .eq("id", order.id)
                .single();

              const courierLabel = updatedOrder?.courier ?? fullOrder.courier ?? "courier";
              const trackingCode = updatedOrder?.tracking_code ?? "";
              const labelUrl = updatedOrder?.shipping_label_url ?? "";
              const isCourier = !!courierLabel &&
                courierLabel !== "Entrega en persona" &&
                courierLabel !== "Punto de retiro";
              const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://tuslibros.cl";

              const courierBlock = isCourier
                ? `
                    <div style="background:#fef3c7;border:1px solid #fcd34d;border-radius:8px;padding:16px;margin:20px 0">
                      <p style="margin:0 0 8px 0;font-weight:600;color:#92400e">📦 Envío por courier</p>
                      <p style="margin:0 0 4px 0;font-size:14px;color:#78350f">Courier seleccionado: <strong>${courierLabel}</strong></p>
                      ${trackingCode ? `<p style="margin:0;font-size:14px;color:#78350f">Código de seguimiento: <strong>${trackingCode}</strong></p>` : ""}
                    </div>
                    ${labelUrl ? `
                      <div style="text-align:center;margin:24px 0">
                        <a href="${labelUrl}" style="display:inline-block;background:#1a1a1a;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600">📄 Descargar etiqueta de envío</a>
                        <p style="font-size:12px;color:#888;margin:8px 0 0 0">Imprímela y pégala en el paquete</p>
                      </div>
                    ` : `
                      <div style="background:#fee2e2;border:1px solid #fca5a5;border-radius:8px;padding:12px;margin:16px 0;font-size:13px;color:#991b1b">
                        La etiqueta aún no está disponible. La puedes descargar desde <a href="${siteUrl}/mis-ventas" style="color:#991b1b;text-decoration:underline">Mis Ventas</a> en unos minutos.
                      </div>
                    `}
                    <h3 style="color:#1a1a1a;font-size:16px;margin-top:24px">Cómo despachar (5 pasos)</h3>
                    <ol style="padding-left:20px;color:#444;font-size:14px;line-height:1.7">
                      <li><strong>Empaqueta el libro</strong> con burbuja, cartón o sobre resistente</li>
                      <li><strong>Imprime la etiqueta</strong> (botón arriba) en hoja tamaño carta</li>
                      <li><strong>Pega la etiqueta</strong> visible en el paquete, bien firme</li>
                      <li><strong>Lleva el paquete</strong> a una sucursal de <strong>${courierLabel}</strong> o al punto más cercano</li>
                      <li><strong>Guarda el comprobante</strong> que te entrega la sucursal hasta que el comprador confirme recepción</li>
                    </ol>
                    <p style="font-size:13px;color:#666;margin-top:16px">
                      <strong>Plazo:</strong> despacha en máximo 2 días hábiles para no afectar la experiencia del comprador.
                    </p>
                  `
                : `
                    <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:16px;margin:20px 0">
                      <p style="margin:0 0 8px 0;font-weight:600;color:#1e40af">🤝 Entrega en persona</p>
                      <p style="margin:0;font-size:14px;color:#1e3a8a">Coordina con el comprador lugar y hora de encuentro.</p>
                    </div>
                  `;

              await sendEmail({
                to: sellerEmail,
                subject: `Nueva venta: ${bookTitle} — tuslibros.cl`,
                html: `
                  <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#1a1a1a">
                    <h2 style="margin:0 0 8px 0">¡Tienes una nueva venta! 🎉</h2>
                    <p style="color:#666;margin:0 0 20px 0">Hola ${sellerName}, tu libro fue comprado por ${buyerName}.</p>

                    <table style="width:100%;border-collapse:collapse;margin:16px 0;background:#fafafa;border-radius:8px;overflow:hidden">
                      <tr><td style="padding:12px 16px;color:#666;width:40%">Libro</td><td style="padding:12px 16px;font-weight:600">${bookTitle}</td></tr>
                      <tr><td style="padding:12px 16px;color:#666;border-top:1px solid #eee">Total</td><td style="padding:12px 16px;font-weight:600;border-top:1px solid #eee">$${Number(price).toLocaleString("es-CL")}</td></tr>
                      <tr><td style="padding:12px 16px;color:#666;border-top:1px solid #eee">Comprador</td><td style="padding:12px 16px;border-top:1px solid #eee">${buyerName}</td></tr>
                      <tr><td style="padding:12px 16px;color:#666;border-top:1px solid #eee">Dirección de entrega</td><td style="padding:12px 16px;border-top:1px solid #eee">${buyerAddress}</td></tr>
                    </table>

                    ${courierBlock}

                    <div style="text-align:center;margin-top:28px">
                      <a href="${siteUrl}/mis-ventas" style="color:#1a1a1a;text-decoration:underline;font-size:14px">Ver en Mis Ventas →</a>
                    </div>
                    <p style="color:#999;font-size:12px;text-align:center;margin-top:24px">tuslibros.cl · Gracias por ser parte 📚</p>
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
