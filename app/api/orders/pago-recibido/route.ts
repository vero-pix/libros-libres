import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { sendEmail } from "@/lib/email";
import { VERO_INBOX } from "@/lib/veroInbox";
import { sendGong, escapeHtml } from "@/lib/notifications";

export const dynamic = "force-dynamic";

/**
 * POST /api/orders/pago-recibido  { bundle_id }
 *
 * El vendedor confirma que le llegó la transferencia. Es el equivalente manual
 * del webhook de MercadoPago: pasa el bundle de `pending` a `paid`, que es lo
 * que destraba el despacho (el cron de Shipit solo mira órdenes pagadas).
 *
 * Solo el VENDEDOR puede confirmar, y solo en órdenes `payment_method =
 * transfer`: en MercadoPago el que confirma es el webhook, no una persona.
 *
 * Idempotente: el UPDATE solo toca las que siguen en `pending`. Si no cambió
 * ninguna responde `already: true` y no manda correo — sin eso, dos clics
 * seguidos le mandaban dos avisos al comprador.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { bundle_id } = (await req.json().catch(() => ({}))) as { bundle_id?: string };
  if (!bundle_id) return NextResponse.json({ error: "Falta bundle_id" }, { status: 400 });

  const admin = createServiceRoleClient();
  const { data: orders, error } = await admin
    .from("orders")
    .select(
      "id, buyer_id, seller_id, status, payment_method, total, buyer:users!orders_buyer_id_fkey(email, full_name), seller:users!orders_seller_id_fkey(full_name), listing:listings(book:books(title))"
    )
    .eq("bundle_id", bundle_id)
    .order("created_at");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!orders?.length) return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });

  const cabeza = orders[0] as any;

  if (cabeza.seller_id !== user.id) {
    return NextResponse.json(
      { error: "Solo quien vende puede confirmar que recibió la transferencia." },
      { status: 403 }
    );
  }
  if (cabeza.payment_method !== "transfer") {
    return NextResponse.json(
      { error: "Este pedido se paga por MercadoPago: el pago se confirma solo." },
      { status: 400 }
    );
  }

  const { data: actualizadas } = await admin
    .from("orders")
    .update({ status: "paid", updated_at: new Date().toISOString() })
    .eq("bundle_id", bundle_id)
    .eq("status", "pending")
    .select("id");

  if (!actualizadas?.length) {
    return NextResponse.json({ ok: true, already: true });
  }

  const titulos = orders
    .map((o: any) => (Array.isArray(o.listing) ? o.listing[0] : o.listing)?.book?.title)
    .filter(Boolean) as string[];
  const comprador = (Array.isArray(cabeza.buyer) ? cabeza.buyer[0] : cabeza.buyer) ?? {};
  const vendedor = (Array.isArray(cabeza.seller) ? cabeza.seller[0] : cabeza.seller) ?? {};
  const quien = String(vendedor.full_name ?? "El vendedor").split(" ")[0];
  const que = titulos.length > 1 ? `tus ${titulos.length} libros` : titulos[0] ?? "tu libro";

  if (comprador.email) {
    await sendEmail({
      to: comprador.email,
      from: "Vero de tuslibros.cl <hola@tuslibros.cl>",
      replyTo: VERO_INBOX,
      subject: `${quien} confirmó tu transferencia — ${que}`,
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#1a1a1a;line-height:1.6">
          <p>Hola ${escapeHtml(String(comprador.full_name ?? "").split(" ")[0] || "")}!</p>
          <p><strong>${escapeHtml(quien)} confirmó que le llegó tu transferencia.</strong> Tu pedido de ${escapeHtml(que)} queda pagado y ya puede salir.</p>
          <p>Lo sigues en <a href="https://tuslibros.cl/mis-pedidos">Mis Pedidos</a>. Cuando tenga número de seguimiento te escribo de nuevo.</p>
          <p>Cualquier cosa, respóndeme a este correo.</p>
          <p style="margin-top:28px">Vero<br/><span style="color:#777">tuslibros.cl</span></p>
        </div>`,
    }).catch(() => {});
  }

  sendGong(
    `\u{1F4B5} Transferencia confirmada — $${Number(cabeza.total ?? 0).toLocaleString("es-CL")}\n` +
      `${escapeHtml(String(vendedor.full_name ?? "—"))} · ${escapeHtml(que)}`
  ).catch(() => {});

  return NextResponse.json({ ok: true, actualizadas: actualizadas.length });
}
