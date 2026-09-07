import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { sendEmail } from "@/lib/email";
import { VERO_INBOX } from "@/lib/veroInbox";
import { correoResena } from "@/lib/resena-email";
import { libroUrl } from "@/lib/urls";

export const dynamic = "force-dynamic";

const EN_PERSONA = ["Entrega en persona", "Punto de retiro"];

/**
 * POST /api/orders/entregado  { bundle_id }
 *
 * Marca el bundle como entregado (orders.status = delivered) y le pide la
 * reseña al comprador por correo. Quién puede marcar (decisión de Vero,
 * 07-09-2026):
 *   · el COMPRADOR, siempre ("Lo recibí" en /mis-pedidos);
 *   · el VENDEDOR, solo si la entrega fue en persona ("Marcar entregado" en
 *     /mis-ventas). En courier el que confirma es el que recibe.
 *
 * Idempotente: el UPDATE solo toca órdenes en paid/shipped; si no cambió
 * ninguna, no se manda correo y se responde `already: true`.
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
      "id, buyer_id, seller_id, status, courier, listing:listings(id, slug, seller:users(username), book:books(title))"
    )
    .eq("bundle_id", bundle_id)
    .order("created_at");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!orders?.length) return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });

  const head = orders[0];
  const esComprador = head.buyer_id === user.id;
  const esVendedor = head.seller_id === user.id;
  const enPersona = !head.courier || EN_PERSONA.includes(head.courier);

  if (!esComprador && !esVendedor) {
    return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
  }
  if (esVendedor && !esComprador && !enPersona) {
    return NextResponse.json(
      { error: "En envíos por courier, el que confirma la entrega es el comprador." },
      { status: 403 }
    );
  }

  const ahora = new Date().toISOString();
  const { data: cambiadas, error: upErr } = await admin
    .from("orders")
    .update({ status: "delivered", shipping_status: "delivered", shipping_updated_at: ahora, updated_at: ahora })
    .eq("bundle_id", bundle_id)
    .in("status", ["paid", "shipped"])
    .select("id");
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });
  if (!cambiadas?.length) return NextResponse.json({ ok: true, already: true });

  // Cola de Shipit, si la hay: queda cerrada también.
  await admin
    .from("shipments")
    .update({ status: "delivered", locked_until: null })
    .eq("bundle_id", bundle_id)
    .in("status", ["created", "label_ready", "notified", "pickup_scheduled", "in_transit"]);

  // Correo de reseña al comprador. Nunca frena la respuesta.
  let resendId: string | null = null;
  try {
    const [{ data: comprador }, { data: vendedor }] = await Promise.all([
      admin.from("users").select("full_name, email").eq("id", head.buyer_id).single(),
      admin.from("users").select("full_name, username").eq("id", head.seller_id).single(),
    ]);
    const titulos = orders
      .map((o: any) => (Array.isArray(o.listing) ? o.listing[0] : o.listing)?.book)
      .map((b: any) => (Array.isArray(b) ? b[0] : b)?.title)
      .filter((t: unknown): t is string => typeof t === "string" && t.length > 0);
    const listing: any = Array.isArray(head.listing) ? head.listing[0] : head.listing;
    const seller: any = Array.isArray(listing?.seller) ? listing.seller[0] : listing?.seller;
    if (comprador?.email && listing) {
      const m = correoResena({
        compradorNombre: comprador.full_name,
        vendedorNombre: vendedor?.full_name,
        titulo: titulos.length > 1 ? `tus ${titulos.length} libros` : titulos[0] ?? "tu libro",
        fichaPath: libroUrl({ id: listing.id, slug: listing.slug, seller: { username: seller?.username } }),
      });
      const r = await sendEmail({
        to: comprador.email,
        from: "Vero de tuslibros.cl <vero@tuslibros.cl>",
        replyTo: VERO_INBOX,
        subject: m.subject,
        html: m.html,
      });
      resendId = r?.id ?? null;
    }
  } catch (e) {
    console.error("[entregado] correo de reseña:", e);
  }

  return NextResponse.json({ ok: true, delivered: cambiadas.length, review_email: resendId });
}
