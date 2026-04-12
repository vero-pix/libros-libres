import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { paymentClient } from "@/lib/mercadopago";
import { notifySeller } from "@/lib/notifications";
import { sendEmail } from "@/lib/email";
import { createShipitOrder } from "@/lib/shipit";
import { extractCommune } from "@/lib/chilexpress";
import crypto from "crypto";

function verifySignature(req: NextRequest, body: Record<string, unknown>): boolean {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  if (!secret) {
    console.warn("[webhook] MERCADOPAGO_WEBHOOK_SECRET not set — skipping verification");
    return true;
  }
  const xSignature = req.headers.get("x-signature");
  const xRequestId = req.headers.get("x-request-id");
  if (!xSignature || !xRequestId) return false;
  const parts = Object.fromEntries(
    xSignature.split(",").map((p) => {
      const [key, ...val] = p.trim().split("=");
      return [key, val.join("=")];
    })
  );
  const ts = parts["ts"];
  const v1 = parts["v1"];
  if (!ts || !v1) return false;
  const dataId = (body as Record<string, unknown>).data
    ? ((body as Record<string, unknown>).data as Record<string, unknown>).id ?? ""
    : "";
  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
  const hmac = crypto.createHmac("sha256", secret).update(manifest).digest("hex");
  return hmac === v1;
}

export async function POST(req: NextRequest) {
  const body = await req.json();

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

    // Detectar: ¿bundle, order singular, o rental?
    // externalRef puede ser:
    //   (a) order.id  — compat legacy
    //   (b) bundle_id — bundle nuevo
    //   (c) rental.id

    // Intentar primero como bundle_id
    const { data: bundleOrders } = await supabase
      .from("orders")
      .select("id, listing_id, bundle_id, seller_id, buyer_id, buyer_address, courier, shipping_cost")
      .eq("bundle_id", externalRef);

    if (bundleOrders && bundleOrders.length > 0) {
      // ── BUNDLE ORDER ──
      await supabase
        .from("orders")
        .update({
          status,
          mercadopago_payment_id: String(paymentId),
          updated_at: new Date().toISOString(),
        })
        .eq("bundle_id", externalRef);

      if (status === "paid") {
        const listingIds = bundleOrders.map((o: any) => o.listing_id);
        await supabase
          .from("listings")
          .update({ status: "completed" })
          .in("id", listingIds);

        // Notificación única para el bundle
        const firstOrderId = bundleOrders[0].id;
        notifySeller(firstOrderId, supabase).catch((err) =>
          console.error("[webhook] notifySeller error:", err)
        );

        // Shipit: un solo envío para el bundle, en la "primera" order (la que tiene shipping_cost > 0)
        try {
          const headOrder = bundleOrders.find((o: any) => o.shipping_cost > 0) ?? bundleOrders[0];
          const isInPerson =
            headOrder.courier === "Entrega en persona" ||
            headOrder.courier === "Punto de retiro";

          if (headOrder.buyer_address && !isInPerson) {
            const { data: buyer } = await supabase
              .from("users")
              .select("full_name, email, phone")
              .eq("id", headOrder.buyer_id)
              .single();

            const commune = extractCommune(headOrder.buyer_address);
            const addressParts = headOrder.buyer_address.split(",")[0]?.trim() ?? "";
            const streetMatch = addressParts.match(/^(.+?)\s+(\d+)/);

            const shipitResult = await createShipitOrder({
              orderId: headOrder.id,
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
                client: headOrder.courier ?? "starken",
                price: headOrder.shipping_cost ?? 0,
              },
            });

            if (shipitResult.state !== "error") {
              // Propagar tracking/label a TODAS las orders del bundle
              await supabase
                .from("orders")
                .update({
                  tracking_code: shipitResult.tracking_code ?? null,
                  shipping_status: shipitResult.state,
                  shipping_label_url: shipitResult.label_url ?? null,
                  shipit_order_id: shipitResult.id || null,
                  shipping_updated_at: new Date().toISOString(),
                })
                .eq("bundle_id", externalRef);
            } else {
              console.error(
                `[webhook] Shipit order failed for bundle ${externalRef}:`,
                shipitResult.error
              );
            }
          }
        } catch (shipitErr) {
          console.error("[webhook] Shipit creation error (bundle):", shipitErr);
        }

        // Emails de bundle
        try {
          const { data: fullOrders } = await supabase
            .from("orders")
            .select(
              "*, listing:listings(*, book:books(*)), buyer:users!orders_buyer_id_fkey(id, full_name, email), seller:users!orders_seller_id_fkey(id, full_name, email)"
            )
            .eq("bundle_id", externalRef);

          if (fullOrders && fullOrders.length > 0) {
            const first = fullOrders[0] as any;
            const buyerName = first.buyer?.full_name ?? "Comprador";
            const sellerName = first.seller?.full_name ?? "Vendedor";
            const buyerEmail = first.buyer?.email;
            const sellerEmail = first.seller?.email;
            const bundleTotal = fullOrders.reduce(
              (sum: number, o: any) => sum + Number(o.total ?? 0),
              0
            );
            const head = fullOrders.find((o: any) => (o.shipping_cost ?? 0) > 0) ?? first;
            const deliveryMethod = head.courier ?? "Por coordinar";
            const buyerAddress = head.buyer_address ?? "No especificada";
            const trackingCode = head.tracking_code ?? "";
            const labelUrl = head.shipping_label_url ?? "";

            const itemsRows = fullOrders
              .map((o: any) => {
                const b = o.listing?.book;
                const title = b?.title ?? "Libro";
                const author = b?.author ?? "";
                const price = Number(o.book_price ?? 0);
                return `<tr><td style="padding:8px 12px;border-top:1px solid #eee">${title}<br/><span style="font-size:12px;color:#888">${author}</span></td><td style="padding:8px 12px;border-top:1px solid #eee;text-align:right;white-space:nowrap">$${price.toLocaleString("es-CL")}</td></tr>`;
              })
              .join("");

            const itemCount = fullOrders.length;

            if (buyerEmail) {
              await sendEmail({
                to: buyerEmail,
                subject: `Confirmación de compra: ${itemCount} libros — tuslibros.cl`,
                html: `
                  <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px">
                    <h2 style="color:#1a1a1a">¡Compra confirmada!</h2>
                    <p>Tu pago fue recibido correctamente. Compraste <strong>${itemCount} libros</strong> de ${sellerName}.</p>
                    <table style="width:100%;border-collapse:collapse;margin:16px 0;background:#fafafa;border-radius:8px;overflow:hidden">
                      ${itemsRows}
                      <tr><td style="padding:12px;font-weight:600;border-top:2px solid #ddd">Total</td><td style="padding:12px;font-weight:600;border-top:2px solid #ddd;text-align:right">$${bundleTotal.toLocaleString("es-CL")}</td></tr>
                    </table>
                    <p><strong>Entrega:</strong> ${deliveryMethod}</p>
                    ${trackingCode ? `<p><strong>Código de seguimiento:</strong> <span style="font-family:monospace">${trackingCode}</span></p>` : ""}
                    <p style="color:#888;font-size:13px;margin-top:24px">Gracias por usar tuslibros.cl</p>
                  </div>
                `,
              });
            }

            if (sellerEmail) {
              const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://tuslibros.cl";
              const isCourier =
                !!deliveryMethod &&
                deliveryMethod !== "Entrega en persona" &&
                deliveryMethod !== "Punto de retiro";

              const courierBlock = isCourier
                ? `
                    <div style="background:#fef3c7;border:1px solid #fcd34d;border-radius:8px;padding:16px;margin:20px 0">
                      <p style="margin:0 0 8px 0;font-weight:600;color:#92400e">📦 Envío por courier — un solo paquete con los ${itemCount} libros</p>
                      <p style="margin:0 0 4px 0;font-size:14px;color:#78350f">Courier: <strong>${deliveryMethod}</strong></p>
                      ${trackingCode ? `<p style="margin:0;font-size:14px;color:#78350f">Seguimiento: <strong>${trackingCode}</strong></p>` : ""}
                    </div>
                    ${labelUrl ? `
                      <div style="text-align:center;margin:24px 0">
                        <a href="${labelUrl}" style="display:inline-block;background:#1a1a1a;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600">📄 Descargar etiqueta de envío</a>
                      </div>
                    ` : `
                      <p style="font-size:13px;color:#888;margin:16px 0">Etiqueta en preparación. Descarga desde <a href="${siteUrl}/mis-ventas" style="color:#1a1a1a">Mis Ventas</a> en unos minutos.</p>
                    `}
                    <h3 style="color:#1a1a1a;font-size:16px">Cómo despachar</h3>
                    <ol style="padding-left:20px;color:#444;font-size:14px;line-height:1.7">
                      <li>Empaca <strong>los ${itemCount} libros juntos</strong> en una caja o sobre resistente con burbuja</li>
                      <li>Imprime y pega la etiqueta visible</li>
                      <li>Lleva el paquete a ${deliveryMethod}</li>
                      <li>Guarda el comprobante hasta confirmación de entrega</li>
                    </ol>
                  `
                : `
                    <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:16px;margin:20px 0">
                      <p style="margin:0 0 8px 0;font-weight:600;color:#1e40af">🤝 Entrega en persona</p>
                      <p style="margin:0;font-size:14px;color:#1e3a8a">Coordina con ${buyerName} lugar y hora para los ${itemCount} libros.</p>
                    </div>
                  `;

              await sendEmail({
                to: sellerEmail,
                subject: `Nueva venta: ${itemCount} libros — tuslibros.cl`,
                html: `
                  <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#1a1a1a">
                    <h2 style="margin:0 0 8px 0">¡Nueva venta de ${itemCount} libros! 🎉</h2>
                    <p style="color:#666;margin:0 0 20px 0">Hola ${sellerName}, ${buyerName} te compró ${itemCount} libros en una sola transacción.</p>
                    <table style="width:100%;border-collapse:collapse;margin:16px 0;background:#fafafa;border-radius:8px;overflow:hidden">
                      ${itemsRows}
                      <tr><td style="padding:12px;font-weight:600;border-top:2px solid #ddd">Total</td><td style="padding:12px;font-weight:600;border-top:2px solid #ddd;text-align:right">$${bundleTotal.toLocaleString("es-CL")}</td></tr>
                    </table>
                    <p style="margin:8px 0;font-size:14px;color:#444"><strong>Comprador:</strong> ${buyerName}</p>
                    <p style="margin:8px 0;font-size:14px;color:#444"><strong>Dirección:</strong> ${buyerAddress}</p>
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
          console.error("[webhook] Email send error (bundle):", emailErr);
        }
      }

      return NextResponse.json({ received: true, status, bundle: true });
    }

    // ── ORDER SINGULAR legacy (external_reference = order.id) ──
    const { data: order } = await supabase
      .from("orders")
      .select("id, listing_id")
      .eq("id", externalRef)
      .single();

    if (order) {
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

        try {
          const { data: shipitOrder } = await supabase
            .from("orders")
            .select("id, buyer_id, buyer_address, shipping_cost, courier")
            .eq("id", order.id)
            .single();

          const isInPerson =
            shipitOrder?.courier === "Entrega en persona" ||
            shipitOrder?.courier === "Punto de retiro";

          if (shipitOrder?.buyer_address && !isInPerson) {
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
            }
          }
        } catch (shipitErr) {
          console.error("[webhook] Shipit creation error:", shipitErr);
        }
      }

      return NextResponse.json({ received: true, status });
    }

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

        try {
          const { data: fullRental } = await supabase
            .from("rentals")
            .select(
              "*, listing:listings(*, book:books(*)), renter:users!rentals_renter_id_fkey(id, full_name, email), owner:users!rentals_owner_id_fkey(id, full_name, email)"
            )
            .eq("id", rental.id)
            .single();

          if (fullRental) {
            const bookTitle = (fullRental as any).listing?.book?.title ?? "Libro";
            const rentalPrice = (fullRental as any).rental_price ?? (fullRental as any).total ?? 0;
            const renterName = (fullRental as any).renter?.full_name ?? "Arrendatario";
            const ownerName = (fullRental as any).owner?.full_name ?? "Propietario";
            const renterEmail = (fullRental as any).renter?.email;
            const ownerEmail = (fullRental as any).owner?.email;
            const deliveryMethod = (fullRental as any).delivery_method ?? "Por coordinar";

            if (renterEmail) {
              await sendEmail({
                to: renterEmail,
                subject: "Confirmación de arriendo — tuslibros.cl",
                html: `<div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px"><h2>¡Arriendo confirmado!</h2><p>${bookTitle} — $${Number(rentalPrice).toLocaleString("es-CL")}</p><p>Propietario: ${ownerName}</p><p>Entrega: ${deliveryMethod}</p></div>`,
              });
            }
            if (ownerEmail) {
              await sendEmail({
                to: ownerEmail,
                subject: "Nuevo arriendo — tuslibros.cl",
                html: `<div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px"><h2>¡Tu libro fue arrendado!</h2><p>${bookTitle} — $${Number(rentalPrice).toLocaleString("es-CL")}</p><p>Arrendatario: ${renterName}</p></div>`,
              });
            }
          }
        } catch (emailErr) {
          console.error("[webhook] Email send error (rental):", emailErr);
        }
      }

      return NextResponse.json({ received: true, status });
    }

    console.error("[webhook] No order, bundle or rental found for ref:", externalRef);
    return NextResponse.json({ error: "Reference not found" }, { status: 404 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Webhook error";
    console.error("MercadoPago webhook error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
