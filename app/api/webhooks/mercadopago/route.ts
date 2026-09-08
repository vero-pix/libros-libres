import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { paymentClient } from "@/lib/mercadopago";
import { notifySeller, notifyPaymentFailed } from "@/lib/notifications";
import { sendEmail } from "@/lib/email";
import { encolarEnvio } from "@/lib/shipments";
import crypto from "crypto";
import { registrarComisionVenta } from "@/lib/commissions";
import { VERO_INBOX } from "@/lib/veroInbox";
import { WHATSAPP_SOPORTE_LEGIBLE } from "@/lib/soporte";

/**
 * Origen del envío para Shipit. La dirección del listing es más precisa, pero
 * solo sirve si tiene calle y número: las cargas masivas dejan "Santiago, Región
 * Metropolitana" y con eso Shipit ignora el origen y cae a la dirección default
 * de la cuenta (la casa de Vero). Pasó con Libro de Ocasión el 05-09-2026.
 */

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


/**
 * Deja rastro de TODO webhook recibido, se haya aplicado o descartado.
 *
 * Sin esto el único indicio de que MercadoPago respondió es
 * `orders.mercadopago_payment_id`; cuando está vacía no hay forma de saber si
 * la persona no pagó o si pagó y el webhook no actualizó nada. Al diagnosticar
 * las 14 órdenes pendientes del 2 de septiembre de 2026 hubo que deducirlo
 * mirando la navegación posterior del comprador, que es adivinar.
 *
 * Nunca lanza: un fallo del log no puede tumbar el procesamiento de un pago,
 * y la tabla puede no existir todavía (migración 20260902_mp_webhook_log.sql).
 */
async function logWebhook(datos: {
  payment_id?: string | null;
  external_ref?: string | null;
  mp_status?: string | null;
  mp_status_detail?: string | null;
  amount?: number | null;
  resultado: string;
  orders_afectadas?: number;
  detalle?: string | null;
  payload?: unknown;
}): Promise<void> {
  try {
    const admin = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { cookies: { getAll: () => [], setAll: () => {} } }
    );
    const { error } = await admin.from("mp_webhook_log").insert({
      payment_id: datos.payment_id ? String(datos.payment_id) : null,
      external_ref: datos.external_ref ?? null,
      mp_status: datos.mp_status ?? null,
      mp_status_detail: datos.mp_status_detail ?? null,
      amount: datos.amount ?? null,
      resultado: datos.resultado,
      orders_afectadas: datos.orders_afectadas ?? 0,
      detalle: datos.detalle ?? null,
      payload: datos.payload ?? null,
    });
    if (error) console.error("[webhook] no se pudo registrar el log:", error.message);
  } catch (e) {
    console.error("[webhook] log falló:", e);
  }
}

/**
 * Notificación IPN (formato viejo de MercadoPago): `{ topic, resource }`, sin
 * `type`/`action` y sin firma. Del 03 al 07 de septiembre de 2026 llegaron 173
 * así y TODAS se rechazaban con 401 por firma inválida, y MP las reintentaba en
 * ráfagas. No traen nada que el evento firmado (`type: "payment"`) no traiga:
 * se responden 200 sin procesar, con log, para que MP deje de insistir.
 */
function esIpn(body: any): boolean {
  return !!body && !body.type && !body.action && (body.topic !== undefined || body.resource !== undefined);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  if (esIpn(body)) {
    await logWebhook({
      resultado: "ipn_ignorada",
      detalle: `topic=${body.topic ?? "?"} resource=${body.resource ?? "?"}`,
      payload: body,
    });
    return NextResponse.json({ received: true, ignored: "ipn" });
  }

  if (!verifySignature(req, body)) {
    console.error("[webhook] Invalid signature");
    await logWebhook({ payment_id: body?.data?.id, resultado: "firma_invalida", payload: body });
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  if (body.type !== "payment" && body.action !== "payment.created") {
    await logWebhook({
      payment_id: body?.data?.id,
      resultado: "ignorado",
      detalle: `type=${body.type} action=${body.action}`,
      payload: body,
    });
    return NextResponse.json({ received: true });
  }

  const paymentId = body.data?.id;
  if (!paymentId) {
    await logWebhook({ resultado: "error", detalle: "sin data.id", payload: body });
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
      await logWebhook({
        payment_id: String(paymentId),
        mp_status: payment.status ?? null,
        amount: payment.transaction_amount ?? null,
        resultado: "sin_orden",
        detalle: "el pago no trae external_reference",
        payload: body,
      });
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

    // Transición idempotente (PROMPT 0.2, 07-09-2026). Una fila pagada no se
    // vuelve a tocar nunca, y un evento repetido del mismo pago con el mismo
    // estado no cambia filas. Solo si el UPDATE devolvió filas se ejecutan los
    // efectos (listings, comisión, Shipit, correos). Antes, un
    // `payment.updated` reenviado por MP para un pago ya aplicado volvía a
    // marcar vendido, registrar comisión, crear envío y mandar dos correos.
    const filtroReplay = (q: any) => {
      q = q.neq("status", "paid");
      if (status !== "paid") {
        q = q.or(`status.neq.${status},mercadopago_payment_id.is.null,mercadopago_payment_id.neq.${String(paymentId)}`);
      }
      return q;
    };
    const responderReplay = async (que: string) => {
      await logWebhook({
        payment_id: String(paymentId), external_ref: externalRef,
        mp_status: payment.status ?? null, mp_status_detail: payment.status_detail ?? null,
        amount: payment.transaction_amount ?? null,
        resultado: "ya_aplicado", orders_afectadas: 0,
        detalle: `${que} → ${status} (sin cambios)`, payload: body,
      });
      return NextResponse.json({ received: true, status, replay: true });
    };

    // Detectar: ¿bundle, order singular, o rental?
    // externalRef puede ser:
    //   (a) order.id  — compat legacy
    //   (b) bundle_id — bundle nuevo
    //   (c) rental.id

    // Intentar primero como bundle_id
    const { data: bundleOrders } = await supabase
      .from("orders")
      .select("id, listing_id, bundle_id, seller_id, buyer_id, buyer_address, courier, shipping_cost, shipping_subsidy, book_price")
      .eq("bundle_id", externalRef);

    if (bundleOrders && bundleOrders.length > 0) {
      // ── BUNDLE ORDER ──
      const { data: cambiadas } = await filtroReplay(
        supabase
          .from("orders")
          .update({
            status,
            mercadopago_payment_id: String(paymentId),
            updated_at: new Date().toISOString(),
          })
          .eq("bundle_id", externalRef)
      ).select("id");
      if (!cambiadas?.length) return responderReplay("bundle");

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

        // Comisión: acá y no al crear la orden. Este es el único punto donde
        // consta que la plata efectivamente entró. (25 ago 2026)
        try {
          const sellerId = bundleOrders[0].seller_id;
          const { data: vendedor } = await supabase
            .from("users")
            .select("mercadopago_user_id")
            .eq("id", sellerId)
            .maybeSingle();

          // Sin cuenta conectada no hubo split: el cobro fue por la cuenta de
          // tuslibros con SERVICE_FEE y no corresponde comisión del 8%.
          if (vendedor?.mercadopago_user_id) {
            const totalLibros = bundleOrders.reduce(
              (t: number, o: any) => t + Number(o.book_price ?? 0),
              0
            );
            await registrarComisionVenta({
              admin: supabase,
              orderId: firstOrderId,
              sellerId,
              grossAmount: totalLibros,
            });
          }
        } catch (err) {
          console.error(`[webhook] Error al registrar comisión del bundle ${externalRef}:`, err);
        }

        // Shipit: desde el 07-09-2026 el webhook NO crea el envío. Encola una
        // fila en `shipments` (ON CONFLICT DO NOTHING) y el worker
        // app/api/cron/shipments la crea según SHIPIT_MODE. Con dry-run no se
        // crea nada en Shipit: la venta igual aparece en /mis-ventas y Vero
        // despacha a mano desde el panel de Shipit mientras dure.
        try {
          // La "cabeza" del bundle es donde se cargaron shipping y fee. Con la
          // promo de envío gratis, `shipping_cost` puede ser 0 en todas las
          // órdenes, así que se mira también el subsidio; el fallback al primero
          // sigue siendo válido porque todas llevan el mismo `buyer_address`.
          const headOrder =
            bundleOrders.find((o: any) => o.shipping_cost > 0 || o.shipping_subsidy > 0) ??
            bundleOrders[0];
          const isInPerson =
            headOrder.courier === "Entrega en persona" ||
            headOrder.courier === "Punto de retiro";

          if (headOrder.buyer_address && !isInPerson) {
            await encolarEnvio(supabase, {
              bundleId: externalRef,
              orderHeadId: headOrder.id,
              sellerId: headOrder.seller_id,
              buyerId: headOrder.buyer_id,
              quotedCost: Number(headOrder.shipping_cost ?? 0) + Number(headOrder.shipping_subsidy ?? 0),
            });
          }
        } catch (shipitErr) {
          console.error("[webhook] no se pudo encolar el envío (bundle):", shipitErr);
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
            const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://tuslibros.cl";
            // Los dos correos —comprador y vendedor— dependen de si la entrega
            // pasa por courier o la coordinan entre ellos.
            const isCourier =
              !!deliveryMethod &&
              deliveryMethod !== "Entrega en persona" &&
              deliveryMethod !== "Punto de retiro";

            if (buyerEmail) {
              // Espejo del correo del vendedor. Antes era genérico ("Entrega:
              // Entrega en persona" y nada más), salía de noreply@ sin replyTo
              // y decía "1 libros": una compradora pagó el 08-09-2026, no supo
              // qué hacer y terminó escribiéndole a Vero por WhatsApp.
              const sellerFirstName = sellerName.split(" ")[0];
              const queCompro = itemCount > 1 ? `${itemCount} libros` : "un libro";
              const esteEstos = itemCount > 1 ? "estos libros" : "este libro";
              const bloqueEntrega = isCourier
                ? `
                    <div style="background:#fef3c7;border:1px solid #fcd34d;border-radius:8px;padding:16px;margin:20px 0">
                      <p style="margin:0 0 8px 0;font-weight:600;color:#92400e">📦 Va por ${deliveryMethod}</p>
                      <p style="margin:0;font-size:14px;color:#78350f">${sellerFirstName} deja el paquete en la sucursal en los próximos días hábiles. Te aviso apenas tenga número de seguimiento.</p>
                      ${trackingCode ? `<p style="margin:8px 0 0 0;font-size:14px;color:#78350f">Seguimiento: <strong style="font-family:monospace">${trackingCode}</strong></p>` : ""}
                    </div>
                  `
                : `
                    <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:16px;margin:20px 0">
                      <p style="margin:0 0 8px 0;font-weight:600;color:#1e40af">🤝 Entrega en persona</p>
                      <p style="margin:0;font-size:14px;color:#1e3a8a">Ya le avisé a ${sellerFirstName}: te va a escribir para coordinar dónde y cuándo entregarte ${esteEstos}. <strong>No pagues nada al recibirlo</strong>, el pago ya está hecho acá.</p>
                    </div>
                    <p style="font-size:14px;color:#444;line-height:1.6">Si prefieres partir tú, escríbele directo:</p>
                    <p style="margin:12px 0"><a href="${siteUrl}/mensajes?to=${first.seller?.id ?? ""}" style="display:inline-block;background:#1a1a1a;color:#fbf7ef;text-decoration:none;padding:11px 18px;border-radius:8px;font-weight:600">Escribirle a ${sellerFirstName}</a></p>
                    <p style="font-size:14px;color:#444;line-height:1.6">¿Pasan dos días y no te escribe? Respóndeme este correo o mándame un WhatsApp al <strong>${WHATSAPP_SOPORTE_LEGIBLE}</strong> y lo destrabo yo.</p>
                  `;

              await sendEmail({
                to: buyerEmail,
                from: "Vero de tuslibros.cl <vero@tuslibros.cl>",
                replyTo: VERO_INBOX,
                subject: itemCount > 1 ? `Compra confirmada: ${itemCount} libros — tuslibros.cl` : `Compra confirmada — tuslibros.cl`,
                html: `
                  <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#1a1a1a">
                    <h2 style="margin:0 0 8px 0">¡Listo, pagaste! 🎉</h2>
                    <p style="color:#666;margin:0 0 20px 0">Hola ${buyerName.split(" ")[0]}, soy Vero de tuslibros.cl. Le compraste ${queCompro} a ${sellerName} y el pago ya está confirmado.</p>
                    <table style="width:100%;border-collapse:collapse;margin:16px 0;background:#fafafa;border-radius:8px;overflow:hidden">
                      ${itemsRows}
                      <tr><td style="padding:12px;font-weight:600;border-top:2px solid #ddd">Total</td><td style="padding:12px;font-weight:600;border-top:2px solid #ddd;text-align:right">$${bundleTotal.toLocaleString("es-CL")}</td></tr>
                    </table>
                    ${bloqueEntrega}
                    <div style="text-align:center;margin-top:28px">
                      <a href="${siteUrl}/mis-pedidos" style="color:#1a1a1a;text-decoration:underline;font-size:14px">Ver mi pedido →</a>
                    </div>
                    <p style="color:#999;font-size:12px;text-align:center;margin-top:24px">tuslibros.cl · Gracias por comprar acá 📚</p>
                  </div>
                `,
              });
            }

            if (sellerEmail) {

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
                      <li>Empaca <strong>${itemCount > 1 ? `los ${itemCount} libros juntos` : "el libro"}</strong> en una caja o sobre resistente con burbuja.</li>
                      <li>Descarga la etiqueta desde <a href="${siteUrl}/mis-ventas" style="color:#1a1a1a">Mis Ventas</a> o desde el correo y pégala en el paquete. Si todavía no la tienes, escribe bien claro el nombre del comprador y el número de seguimiento.</li>
                      <li><strong>Déjalo en una sucursal del courier indicado</strong> (Starken, Bluexpress o Chilexpress). No pagas nada al courier: el envío ya lo pagó el comprador.</li>
                      <li>Guarda el comprobante que te dan en la sucursal hasta que el comprador reciba el libro.</li>
                    </ol>
                    <p style="font-size:14px;color:#444;line-height:1.6">Si prefieres que pasen a buscarlo a tu casa (solo Región Metropolitana), usa el botón <strong>Pedir retiro a domicilio</strong> en <a href="${siteUrl}/mis-ventas" style="color:#1a1a1a">Mis Ventas</a>.</p>
                    <p style="font-size:14px;color:#444;line-height:1.6">Si en la sucursal no reciben el paquete o hay cualquier problema, escríbele a Shipit al WhatsApp <strong>+56 9 3230 2514</strong> (lunes a viernes de 9:00 a 18:00) o a <a href="mailto:soporte@shipit.cl" style="color:#1a1a1a">soporte@shipit.cl</a> con el número de seguimiento. Y avísame a mí al <strong>${WHATSAPP_SOPORTE_LEGIBLE}</strong>.</p>
                    <p style="font-size:14px;color:#444;line-height:1.6">Guía completa: <a href="${siteUrl}/ayuda/vender" style="color:#1a1a1a">tuslibros.cl/ayuda/vender</a></p>
                  `
                : `
                    <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:16px;margin:20px 0">
                      <p style="margin:0 0 8px 0;font-weight:600;color:#1e40af">🤝 Entrega en persona</p>
                      <p style="margin:0;font-size:14px;color:#1e3a8a">Coordina con ${buyerName} lugar y hora para ${itemCount > 1 ? `los ${itemCount} libros` : "la entrega"}. El pago ya está hecho: no le cobres de nuevo.</p>
                    </div>
                  `;

              await sendEmail({
                to: sellerEmail,
                from: "Vero de tuslibros.cl <vero@tuslibros.cl>",
                replyTo: VERO_INBOX,
                subject: itemCount > 1 ? `Nueva venta: ${itemCount} libros — tuslibros.cl` : `Vendiste un libro — tuslibros.cl`,
                html: `
                  <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#1a1a1a">
                    <h2 style="margin:0 0 8px 0">${itemCount > 1 ? `¡Nueva venta de ${itemCount} libros! 🎉` : "¡Vendiste un libro! 🎉"}</h2>
                    <p style="color:#666;margin:0 0 20px 0">Hola ${sellerName}, ${buyerName} ${itemCount > 1 ? `te compró ${itemCount} libros en una sola transacción` : "te compró un libro"}. El pago ya está confirmado.</p>
                    <table style="width:100%;border-collapse:collapse;margin:16px 0;background:#fafafa;border-radius:8px;overflow:hidden">
                      ${itemsRows}
                      <tr><td style="padding:12px;font-weight:600;border-top:2px solid #ddd">Total</td><td style="padding:12px;font-weight:600;border-top:2px solid #ddd;text-align:right">$${bundleTotal.toLocaleString("es-CL")}</td></tr>
                    </table>
                    <p style="margin:8px 0;font-size:14px;color:#444"><strong>Comprador:</strong> ${buyerName}</p>
                    <p style="margin:8px 0;font-size:14px;color:#444"><strong>Dirección:</strong> ${buyerAddress}</p>
                    <p style="margin:8px 0 16px 0;font-size:14px;color:#444">Para hablar con ${buyerName}, en <a href="${siteUrl}/mis-ventas" style="color:#1a1a1a">Mis Ventas</a> hay un botón <strong>"Escribir"</strong> al lado de su nombre.</p>
                    ${courierBlock}
                    <div style="text-align:center;margin-top:28px">
                      <a href="${siteUrl}/mis-ventas" style="color:#1a1a1a;text-decoration:underline;font-size:14px">Ver en Mis Ventas →</a>
                    </div>
                    <p style="font-size:13px;color:#666;text-align:center;margin-top:16px">Revisa Mis Ventas cada uno o dos días aunque no te llegue correo, y si vendes un libro por fuera márcalo como vendido para que nadie lo compre acá.</p>
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

      if (status === "cancelled") {
        notifyPaymentFailed(
          bundleOrders.map((o: any) => o.id),
          supabase,
          payment.status_detail
        ).catch((err) => console.error("[webhook] notifyPaymentFailed error:", err));
      }

      await logWebhook({
        payment_id: String(paymentId), external_ref: externalRef,
        mp_status: payment.status ?? null, mp_status_detail: payment.status_detail ?? null,
        amount: payment.transaction_amount ?? null,
        resultado: "aplicado", orders_afectadas: cambiadas.length,
        detalle: `bundle → ${status}`, payload: body,
      });
      return NextResponse.json({ received: true, status, bundle: true });
    }

    // ── ORDER SINGULAR legacy (external_reference = order.id) ──
    const { data: order } = await supabase
      .from("orders")
      .select("id, listing_id")
      .eq("id", externalRef)
      .single();

    if (order) {
      const { data: cambiadas } = await filtroReplay(
        supabase
          .from("orders")
          .update({
            status,
            mercadopago_payment_id: String(paymentId),
            updated_at: new Date().toISOString(),
          })
          .eq("id", order.id)
      ).select("id");
      if (!cambiadas?.length) return responderReplay("order");

      if (status === "paid") {
        await supabase
          .from("listings")
          .update({ status: "completed" })
          .eq("id", order.listing_id);

        notifySeller(order.id, supabase).catch((err) =>
          console.error("[webhook] notifySeller error:", err)
        );

        // Shipit: igual que en el bundle, se encola y el worker decide.
        try {
          const { data: shipitOrder } = await supabase
            .from("orders")
            .select("id, buyer_id, seller_id, bundle_id, buyer_address, shipping_cost, shipping_subsidy, courier")
            .eq("id", order.id)
            .single();

          const isInPerson =
            shipitOrder?.courier === "Entrega en persona" ||
            shipitOrder?.courier === "Punto de retiro";

          if (shipitOrder?.buyer_address && !isInPerson) {
            await encolarEnvio(supabase, {
              bundleId: shipitOrder.bundle_id ?? shipitOrder.id,
              orderHeadId: shipitOrder.id,
              sellerId: shipitOrder.seller_id,
              buyerId: shipitOrder.buyer_id,
              quotedCost: Number(shipitOrder.shipping_cost ?? 0) + Number(shipitOrder.shipping_subsidy ?? 0),
            });
          }
        } catch (shipitErr) {
          console.error("[webhook] no se pudo encolar el envío:", shipitErr);
        }
      }

      if (status === "cancelled") {
        notifyPaymentFailed([order.id], supabase, payment.status_detail).catch((err) =>
          console.error("[webhook] notifyPaymentFailed error:", err)
        );
      }

      await logWebhook({
        payment_id: String(paymentId), external_ref: externalRef,
        mp_status: payment.status ?? null, mp_status_detail: payment.status_detail ?? null,
        amount: payment.transaction_amount ?? null,
        resultado: "aplicado", orders_afectadas: 1,
        detalle: "order → " + status, payload: body,
      });
      return NextResponse.json({ received: true, status });
    }

    // ── RENTAL ──
    const { data: rental } = await supabase
      .from("rentals")
      .select("id, listing_id")
      .eq("id", externalRef)
      .single();

    if (rental) {
      const { data: cambiadas } = await filtroReplay(
        supabase
          .from("rentals")
          .update({
            status,
            mercadopago_payment_id: String(paymentId),
            updated_at: new Date().toISOString(),
          })
          .eq("id", rental.id)
      ).select("id");
      if (!cambiadas?.length) return responderReplay("rental");

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

      await logWebhook({
        payment_id: String(paymentId), external_ref: externalRef,
        mp_status: payment.status ?? null, mp_status_detail: payment.status_detail ?? null,
        amount: payment.transaction_amount ?? null,
        resultado: "aplicado", orders_afectadas: 1,
        detalle: "rental → " + status, payload: body,
      });
      return NextResponse.json({ received: true, status });
    }

    console.error("[webhook] No order, bundle or rental found for ref:", externalRef);
    await logWebhook({
      payment_id: String(paymentId), external_ref: externalRef,
      mp_status: payment.status ?? null, amount: payment.transaction_amount ?? null,
      resultado: "sin_orden", detalle: "ninguna order/bundle/rental calza con la referencia", payload: body,
    });
    return NextResponse.json({ error: "Reference not found" }, { status: 404 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Webhook error";
    console.error("MercadoPago webhook error:", message);
    await logWebhook({ payment_id: String(paymentId), resultado: "error", detalle: message, payload: body });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
