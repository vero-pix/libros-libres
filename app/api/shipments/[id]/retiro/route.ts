import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { sendGong, escapeHtml } from "@/lib/notifications";
import { sendEmail } from "@/lib/email";
import { registrarEventoShipit, getShipitMode, transicionEnvio, type ShipmentStatus } from "@/lib/shipments";
import { anularRetiroShipit, deleteShipitShipment } from "@/lib/shipit";
import { correoCompradorVentaCancelada, REMITENTE_VERO, REPLY_TO_VERO } from "@/lib/shipit-emails";
import { estadoOrigenVendedor } from "@/lib/shipit-origen";
import { resolverOrigenEnvio } from "@/lib/shipping-quote";

export const dynamic = "force-dynamic";

/**
 * POST /api/shipments/{id}/retiro  { accion: "reagendar" | "sucursal" | "cancelar" }
 *
 * Las tres salidas del vendedor cuando un retiro no se concreta (pieza B,
 * 08-09-2026). Nacieron del caso de Casa Emunah: el chofer pasó, no había
 * nadie, y la única salida que existía era escribirle a Vero por WhatsApp.
 *
 *   reagendar → vuelve a `notified` pidiendo otro retiro (Vero lo agenda).
 *   sucursal  → anula el retiro en Shipit y vuelve a dropoff con la misma
 *               etiqueta. Es lo que pidió la vendedora: que no viajen al vacío.
 *   cancelar  → cancela la venta, avisa al comprador, encamina el reembolso y
 *               republica el libro.
 *
 * Solo el vendedor del envío. `reagendar` exige `pickup_failed`; las otras dos
 * también se pueden usar con el retiro todavía vigente (el vendedor puede
 * haber llevado el paquete a la sucursal esta mañana).
 */

type Accion = "reagendar" | "sucursal" | "cancelar";
const ACCIONES: Accion[] = ["reagendar", "sucursal", "cancelar"];

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { accion } = (await req.json().catch(() => ({}))) as { accion?: Accion };
  if (!accion || !ACCIONES.includes(accion)) {
    return NextResponse.json({ error: "Acción desconocida" }, { status: 400 });
  }

  const admin = createServiceRoleClient();
  const { data: s } = await admin
    .from("shipments")
    .select(
      "id, bundle_id, order_head_id, seller_id, buyer_id, status, reference, shipit_id, courier, tracking_number, pickup_id, pickup_date, dispatch_mode"
    )
    .eq("id", params.id)
    .maybeSingle();
  if (!s || s.seller_id !== user.id) return NextResponse.json({ error: "Envío no encontrado" }, { status: 404 });

  const estadosOk = accion === "reagendar" ? ["pickup_failed"] : ["pickup_failed", "pickup_scheduled"];
  if (!estadosOk.includes(s.status)) {
    return NextResponse.json({ error: "Este envío ya no está esperando un retiro." }, { status: 409 });
  }

  const modo = getShipitMode();
  const quien = await nombreVendedor(admin, user.id);

  // Un fallo acá deja al vendedor sin salida otra vez, así que se responde con
  // algo que se entienda y queda el rastro en los logs.
  try {
    if (accion === "reagendar") return await reagendar(admin, s, quien, modo);
    if (accion === "sucursal") return await dejarEnSucursal(admin, s, quien, modo);
    return await cancelarVenta(admin, s, quien, modo);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`[retiro] ${accion} falló en ${s.reference}:`, msg);
    await sendGong(`🔴 Falló "${escapeHtml(accion)}" en ${escapeHtml(s.reference)}: ${escapeHtml(msg)}`).catch(() => {});
    return NextResponse.json({ error: "No se pudo completar. Ya me avisó el sistema, lo reviso yo." }, { status: 500 });
  }
}

type Admin = ReturnType<typeof createServiceRoleClient>;
type Envio = {
  id: string;
  bundle_id: string;
  order_head_id: string;
  seller_id: string;
  buyer_id: string;
  status: string;
  reference: string;
  shipit_id: number | null;
  courier: string | null;
  tracking_number: string | null;
  pickup_id: number | null;
  pickup_date: string | null;
  dispatch_mode: string;
};

async function nombreVendedor(admin: Admin, id: string): Promise<string> {
  const { data } = await admin.from("users").select("username, full_name").eq("id", id).maybeSingle();
  return data?.username ?? data?.full_name ?? id;
}

/* ─────────────────────────────── reagendar ─────────────────────────────── */

/**
 * Mismo camino que el botón "Pedir retiro a domicilio": la plataforma no
 * agenda el retiro en Shipit (fase 1), lo pide Vero en el panel antes de las
 * 11:00. El envío vuelve a `notified` para que el worker detecte el retiro
 * nuevo cuando exista.
 */
async function reagendar(admin: Admin, s: Envio, quien: string, modo: ReturnType<typeof getShipitMode>) {
  const ahora = new Date().toISOString();
  const ok = await transicionEnvio(admin, s.id, "pickup_failed", "notified", {
    pickup_date: null,
    pickup_window: null,
    pickup_id: null,
    pickup_requested_at: ahora,
  });
  if (!ok) return NextResponse.json({ error: "El envío cambió de estado, recarga la página." }, { status: 409 });

  await admin
    .from("orders")
    .update({ shipping_status: "notified", shipping_updated_at: ahora })
    .eq("bundle_id", s.bundle_id);

  const origen = await estadoOrigenVendedor(admin, s.seller_id);
  const { data: head } = await admin
    .from("orders")
    .select("listing:listings(address)")
    .eq("id", s.order_head_id)
    .maybeSingle();
  const listingAddress = (Array.isArray(head?.listing) ? head?.listing[0] : head?.listing)?.address ?? null;
  const dir = resolverOrigenEnvio({ listingAddress, sellerDefaultAddress: origen.vendedor?.default_address });

  await sendGong(
    [
      `🚚 <b>${escapeHtml(quien)}</b> pide OTRO retiro para ${escapeHtml(s.reference)} (el anterior falló).`,
      `Agendarlo en el panel de Shipit antes de las 11:00.`,
      `• Envío Shipit: ${s.shipit_id ?? "—"} · ${escapeHtml(s.courier ?? "")} · tracking ${escapeHtml(s.tracking_number ?? "—")}`,
      `• Dirección: ${escapeHtml(dir?.address ?? origen.vendedor?.default_address ?? "—")}`,
      `• Contacto: ${escapeHtml(origen.vendedor?.phone ?? "—")}`,
    ].join("\n")
  );
  await registrarEventoShipit(admin, {
    shipmentId: s.id,
    kind: "gong",
    mode: modo,
    note: "retiro-reagendado",
    request: { pickup_requested_at: ahora },
  });

  return NextResponse.json({ ok: true, estado: "notified" });
}

/* ──────────────────────────── lo dejo en sucursal ──────────────────────── */

/**
 * Vuelve a dropoff con la misma etiqueta y anula el retiro para que el chofer
 * no vuelva a viajar. Si Shipit no acepta la anulación, el envío igual queda
 * en dropoff y Vero recibe el gong para anularlo en el panel: el vendedor no
 * se queda esperando por algo que no controla.
 */
async function dejarEnSucursal(admin: Admin, s: Envio, quien: string, modo: ReturnType<typeof getShipitMode>) {
  let anulado: { ok: boolean; httpStatus: number; raw: unknown } | null = null;
  if (s.pickup_id && modo !== "dry-run") {
    anulado = await anularRetiroShipit(s.pickup_id);
    await registrarEventoShipit(admin, {
      shipmentId: s.id,
      kind: "delete",
      mode: modo,
      note: `anular retiro ${s.pickup_id}`,
      response: anulado.raw,
      httpStatus: anulado.httpStatus,
    });
  }

  const ok = await transicionEnvio(admin, s.id, s.status as ShipmentStatus, "notified", {
    pickup_date: null,
    pickup_window: null,
    pickup_id: null,
    // Queda anotado cuál descartó: si Shipit no aceptó la anulación, el
    // worker lo va a seguir viendo y tiene que saber que ya no cuenta.
    pickup_dismissed_id: s.pickup_id,
    pickup_requested_at: null,
    dispatch_mode: "dropoff",
  });
  if (!ok) return NextResponse.json({ error: "El envío cambió de estado, recarga la página." }, { status: 409 });

  await admin
    .from("orders")
    .update({ shipping_status: "notified", shipping_updated_at: new Date().toISOString() })
    .eq("bundle_id", s.bundle_id);

  // El worker vuelve a mirar en 6 h; si el retiro sigue vivo en Shipit lo
  // detectaría otra vez, así que el gong es la red cuando el DELETE no pasó.
  if (s.pickup_id && !anulado?.ok) {
    await sendGong(
      [
        `🟠 <b>${escapeHtml(quien)}</b> deja ${escapeHtml(s.reference)} en la sucursal, pero <b>no se pudo anular el retiro ${s.pickup_id}</b> en Shipit (HTTP ${anulado?.httpStatus ?? "—"}).`,
        `Anularlo a mano en el panel o el chofer vuelve a viajar al vacío.`,
      ].join("\n")
    );
  }

  return NextResponse.json({ ok: true, estado: "notified", retiroAnulado: anulado?.ok ?? false });
}

/* ────────────────────────────── cancelar venta ─────────────────────────── */

/**
 * El vendedor no puede despachar. Se deshace todo lo que la plataforma sabe
 * hacer sola y queda una sola cosa a mano: devolverle la plata al comprador,
 * porque el split de MercadoPago ya le pagó al vendedor. Por eso el gong lleva
 * el monto y el payment id: es la orden de trabajo del reembolso.
 */
async function cancelarVenta(admin: Admin, s: Envio, quien: string, modo: ReturnType<typeof getShipitMode>) {
  const ahora = new Date().toISOString();

  const { data: ordenes } = await admin
    .from("orders")
    .select("id, listing_id, total, status, mercadopago_payment_id, listing:listings(book:books(title))")
    .eq("bundle_id", s.bundle_id)
    .order("created_at");
  if (!ordenes?.length) return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });

  const ok = await transicionEnvio(admin, s.id, s.status as ShipmentStatus, "canceled", {
    pickup_date: null,
    pickup_window: null,
    pickup_id: null,
  });
  if (!ok) return NextResponse.json({ error: "El envío cambió de estado, recarga la página." }, { status: 409 });

  // Shipit: primero el retiro (si no, el chofer viaja igual), después el envío.
  if (s.pickup_id && modo !== "dry-run") {
    const a = await anularRetiroShipit(s.pickup_id);
    await registrarEventoShipit(admin, { shipmentId: s.id, kind: "delete", mode: modo, note: `anular retiro ${s.pickup_id}`, response: a.raw, httpStatus: a.httpStatus });
  }
  if (s.shipit_id && modo !== "dry-run") {
    const d = await deleteShipitShipment(s.shipit_id);
    await registrarEventoShipit(admin, { shipmentId: s.id, kind: "delete", mode: modo, note: `anular envío ${s.shipit_id}`, response: d.raw, httpStatus: d.httpStatus });
  }

  await admin
    .from("orders")
    .update({ status: "cancelled", shipping_status: "canceled", shipping_updated_at: ahora, updated_at: ahora })
    .eq("bundle_id", s.bundle_id)
    .in("status", ["paid", "shipped"]);

  // El libro vuelve a la venta: es la parte que el vendedor no podía hacer
  // solo, y sin ella el catálogo pierde un ejemplar que sigue existiendo.
  const listingIds = ordenes.map((o: any) => o.listing_id).filter(Boolean);
  if (listingIds.length) {
    await admin.from("listings").update({ status: "active" }).in("id", listingIds).eq("status", "completed");
  }

  // La comisión de una venta que no ocurrió no puede quedar en el reporte.
  await admin
    .from("commissions")
    .delete()
    .in("order_id", ordenes.map((o: any) => o.id));

  const titulos = ordenes
    .map((o: any) => (Array.isArray(o.listing) ? o.listing[0] : o.listing)?.book)
    .map((b: any) => (Array.isArray(b) ? b[0] : b)?.title)
    .filter((t: unknown): t is string => typeof t === "string" && t.length > 0);
  const total = ordenes.reduce((acc: number, o: any) => acc + Number(o.total ?? 0), 0);

  const { data: comprador } = await admin.from("users").select("full_name, email").eq("id", s.buyer_id).maybeSingle();
  if (comprador?.email && modo !== "dry-run") {
    const m = correoCompradorVentaCancelada({ compradorNombre: comprador.full_name, titulos, total });
    const r = await sendEmail({ to: comprador.email, from: REMITENTE_VERO, replyTo: REPLY_TO_VERO, subject: m.subject, html: m.html });
    await registrarEventoShipit(admin, {
      shipmentId: s.id,
      kind: "email",
      mode: modo,
      note: "venta-cancelada",
      response: { resend_id: r?.id ?? null, to: comprador.email, subject: m.subject },
      httpStatus: r?.id ? 200 : null,
    });
  }

  await sendGong(
    [
      `🔴 <b>${escapeHtml(quien)}</b> canceló la venta ${escapeHtml(s.reference)}: no puede despacharla.`,
      `• ${escapeHtml(titulos.join(" · ") || "sin títulos")}`,
      `• <b>Reembolsar ${escapeHtml(String(total))}</b> a ${escapeHtml(comprador?.full_name ?? "el comprador")} (${escapeHtml(comprador?.email ?? "sin correo")}) en MercadoPago.`,
      `• Pago MP: ${escapeHtml(String(ordenes[0]?.mercadopago_payment_id ?? "—"))}`,
      `• ${listingIds.length} ${listingIds.length === 1 ? "libro republicado" : "libros republicados"}. Al comprador ya le llegó el correo.`,
    ].join("\n")
  );

  return NextResponse.json({ ok: true, estado: "canceled", republicados: listingIds.length });
}
