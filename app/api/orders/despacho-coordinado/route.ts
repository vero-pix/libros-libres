import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { sendEmail } from "@/lib/email";
import { sendGong, escapeHtml } from "@/lib/notifications";
import { VERO_INBOX } from "@/lib/veroInbox";
import { nombreCourier, urlSeguimiento } from "@/lib/courier-tracking";
import {
  COURIER_COORDINADO,
  COURIERS_COORDINADO,
  ESTADO_COORDINADO_DESPACHADO,
  ESTADO_COORDINADO_PENDIENTE,
} from "@/lib/shipping/coordinado";

export const dynamic = "force-dynamic";

/**
 * POST /api/orders/despacho-coordinado  { bundle_id, courier, tracking }
 *
 * El vendedor registra que despachó por su cuenta (ver lib/shipping/coordinado.ts).
 * Solo el vendedor del bundle, solo si el bundle es de despacho coordinado y
 * está pagado. Deja el courier real en `orders.courier` para que el enlace de
 * seguimiento funcione en Mis Pedidos, y le avisa al comprador.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { bundle_id, courier, tracking } = (await req.json().catch(() => ({}))) as {
    bundle_id?: string;
    courier?: string;
    tracking?: string;
  };
  const numero = String(tracking ?? "").trim();
  const courierValido = COURIERS_COORDINADO.some((c) => c.value === courier);
  if (!bundle_id || !courierValido || numero.length < 4 || numero.length > 40) {
    return NextResponse.json({ error: "Falta el courier o el número de seguimiento." }, { status: 400 });
  }

  const admin = createServiceRoleClient();
  const { data: orders, error } = await admin
    .from("orders")
    .select("id, buyer_id, seller_id, status, courier, shipping_status, listing:listings(book:books(title))")
    .eq("bundle_id", bundle_id)
    .order("created_at");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const head = orders?.[0];
  if (!head || head.seller_id !== user.id) {
    return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
  }
  if (head.courier !== COURIER_COORDINADO || head.shipping_status !== ESTADO_COORDINADO_PENDIENTE) {
    return NextResponse.json({ error: "Este pedido no es de despacho coordinado o ya se registró." }, { status: 409 });
  }
  if (head.status !== "paid") {
    return NextResponse.json({ error: "El pedido todavía no está pagado." }, { status: 409 });
  }

  const ahora = new Date().toISOString();
  const { data: cambiadas, error: upErr } = await admin
    .from("orders")
    .update({
      status: "shipped",
      courier,
      tracking_code: numero,
      shipping_status: ESTADO_COORDINADO_DESPACHADO,
      shipping_updated_at: ahora,
      updated_at: ahora,
    })
    .eq("bundle_id", bundle_id)
    .eq("status", "paid")
    .select("id");
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });
  if (!cambiadas?.length) return NextResponse.json({ ok: true, already: true });

  const titulos = (orders ?? [])
    .map((o: any) => (Array.isArray(o.listing) ? o.listing[0] : o.listing)?.book)
    .map((b: any) => (Array.isArray(b) ? b[0] : b)?.title)
    .filter((t: unknown): t is string => typeof t === "string" && t.length > 0);
  const libro = titulos.length > 1 ? `tus ${titulos.length} libros` : titulos[0] ?? "tu libro";
  const nombre = courier === "otro" ? "el courier" : nombreCourier(courier);
  const link = urlSeguimiento(courier, numero);

  try {
    const [{ data: comprador }, { data: vendedor }] = await Promise.all([
      admin.from("users").select("full_name, email").eq("id", head.buyer_id).maybeSingle(),
      admin.from("users").select("full_name").eq("id", head.seller_id).maybeSingle(),
    ]);
    if (comprador?.email) {
      const quien = String(comprador.full_name ?? "").split(" ")[0] || "";
      await sendEmail({
        to: comprador.email,
        from: "Vero de tuslibros.cl <vero@tuslibros.cl>",
        replyTo: VERO_INBOX,
        subject: `Ya va en camino: ${libro}`,
        html: `
          <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#1a1a1a;line-height:1.6">
            <p>Hola ${escapeHtml(quien)}!</p>
            <p>${escapeHtml(String(vendedor?.full_name ?? "Quien te vendió"))} ya despachó <strong>${escapeHtml(libro)}</strong> por ${escapeHtml(nombre)}.</p>
            <p>Número de seguimiento: <strong>${escapeHtml(numero)}</strong></p>
            ${link ? `<p style="margin:20px 0"><a href="${link}" style="display:inline-block;background:#1a1a1a;color:#fbf7ef;text-decoration:none;padding:11px 18px;border-radius:8px;font-weight:600">Seguir mi envío</a></p>` : ""}
            <p>Cuando te llegue, márcalo como recibido en <a href="https://tuslibros.cl/mis-pedidos">Mis Pedidos</a>. Si pasan varios días sin novedad, respóndeme este correo y lo reviso.</p>
            <p style="margin-top:28px">Vero<br/><span style="color:#777">tuslibros.cl</span></p>
          </div>`,
      });
    }
    await sendGong(
      `\u{1F4E6} Despacho coordinado registrado\n${escapeHtml(libro)} · ${escapeHtml(String(vendedor?.full_name ?? "—"))}\n${escapeHtml(nombre)} ${escapeHtml(numero)}`
    );
  } catch (e) {
    console.error("[despacho-coordinado] aviso:", e);
  }

  return NextResponse.json({ ok: true, updated: cambiadas.length });
}
