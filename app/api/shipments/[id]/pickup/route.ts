import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { sendGong, escapeHtml } from "@/lib/notifications";
import { registrarEventoShipit, getShipitMode } from "@/lib/shipments";
import { estadoOrigenVendedor } from "@/lib/shipit-origen";
import { resolverOrigenEnvio } from "@/lib/shipping-quote";

export const dynamic = "force-dynamic";

/**
 * POST /api/shipments/{id}/pickup — "Pedir retiro a domicilio" (D7 revisada).
 *
 * Fase 1: NO llama a Shipit. Guarda `pickup_requested_at` y manda un gong a
 * Vero con todo lo que necesita para solicitar el Retiro Héroe en el panel
 * antes de las 11:00. Solo el vendedor, solo en la RM (el Retiro Héroe no
 * existe fuera), solo con la etiqueta lista. Un pedido por envío.
 */
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const admin = createServiceRoleClient();
  const { data: s } = await admin
    .from("shipments")
    .select("id, seller_id, status, reference, shipit_id, courier, tracking_number, pickup_requested_at, order_head_id, dispatch_mode")
    .eq("id", params.id)
    .maybeSingle();
  if (!s || s.seller_id !== user.id) return NextResponse.json({ error: "Envío no encontrado" }, { status: 404 });
  if (!["label_ready", "notified"].includes(s.status)) {
    return NextResponse.json({ error: "El retiro se puede pedir cuando la etiqueta está lista." }, { status: 409 });
  }
  if (s.pickup_requested_at) return NextResponse.json({ ok: true, already: true, at: s.pickup_requested_at });

  const origen = await estadoOrigenVendedor(admin, user.id);
  if (!origen.enRM) {
    return NextResponse.json(
      { error: "El retiro a domicilio solo existe en la Región Metropolitana. Deja el paquete en la sucursal del courier." },
      { status: 403 }
    );
  }

  const ahora = new Date().toISOString();
  const { data: upd } = await admin
    .from("shipments")
    .update({ pickup_requested_at: ahora })
    .eq("id", s.id)
    .is("pickup_requested_at", null)
    .select("id");
  if (!upd?.length) return NextResponse.json({ ok: true, already: true });

  const { data: head } = await admin
    .from("orders")
    .select("listing:listings(address)")
    .eq("id", s.order_head_id)
    .maybeSingle();
  const listingAddress = (Array.isArray(head?.listing) ? head?.listing[0] : head?.listing)?.address ?? null;
  const dir = resolverOrigenEnvio({ listingAddress, sellerDefaultAddress: origen.vendedor?.default_address });
  const quien = origen.vendedor?.username ?? origen.vendedor?.full_name ?? user.id;

  await sendGong(
    [
      `🚚 <b>${escapeHtml(quien)}</b> pide RETIRO A DOMICILIO para ${escapeHtml(s.reference)}.`,
      `Solicitarlo en el panel de Shipit antes de las 11:00.`,
      `• Envío Shipit: ${s.shipit_id ?? "—"} · ${escapeHtml(s.courier ?? "")} · tracking ${escapeHtml(s.tracking_number ?? "—")}`,
      `• Dirección: ${escapeHtml(dir?.address ?? origen.vendedor?.default_address ?? "—")}`,
      `• Contacto: ${escapeHtml(origen.vendedor?.phone ?? "—")}`,
    ].join("\n")
  );
  await registrarEventoShipit(admin, {
    shipmentId: s.id,
    kind: "gong",
    mode: getShipitMode(),
    note: "pickup",
    request: { pickup_requested_at: ahora, direccion: dir?.address ?? null },
  });

  return NextResponse.json({ ok: true, at: ahora });
}
