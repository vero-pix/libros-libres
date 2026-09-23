import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { sendEmail } from "@/lib/email";
import { sendGong, escapeHtml } from "@/lib/notifications";
import { cobraPorTransferencia } from "@/lib/cobro-transferencia";
import { correoOfertaAceptada, correoOfertaRechazada } from "@/lib/offer-emails";
import { PLAZO_PAGO_ACEPTADA_HORAS, clp, estadoVigente } from "@/lib/offers";

/**
 * POST /api/offers/[id]/respond  { accion: "aceptar" | "rechazar" }
 * Solo el vendedor de la oferta. Deja un mensaje en la conversación y le avisa
 * al comprador por correo.
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { accion } = await req.json().catch(() => ({}));
  if (accion !== "aceptar" && accion !== "rechazar") {
    return NextResponse.json({ error: "Acción inválida" }, { status: 400 });
  }

  const admin = createServiceRoleClient();
  const { data: oferta } = await admin
    .from("offers")
    .select("id, listing_id, buyer_id, seller_id, amount, listing_price, status, expires_at, conversation_id, listing:listings(status, book:books(title)), buyer:users!offers_buyer_id_fkey(full_name, email), seller:users!offers_seller_id_fkey(full_name, mercadopago_user_id)")
    .eq("id", params.id)
    .maybeSingle();

  if (!oferta) return NextResponse.json({ error: "Oferta no encontrada" }, { status: 404 });
  if (oferta.seller_id !== user.id) {
    return NextResponse.json({ error: "Solo el vendedor puede responder esta oferta" }, { status: 403 });
  }

  const estado = estadoVigente(oferta as any);
  if (estado !== "pending") {
    if (estado === "expired" && oferta.status === "pending") {
      await admin.from("offers").update({ status: "expired" }).eq("id", oferta.id);
    }
    const porque = estado === "expired" ? "venció" : "ya fue respondida";
    return NextResponse.json({ error: `Esta oferta ${porque}.` }, { status: 409 });
  }

  const listing = (oferta as any).listing as { status: string; book: { title: string } | null } | null;
  if (accion === "aceptar" && listing?.status !== "active") {
    return NextResponse.json({ error: "El libro ya no está activo: no se puede aceptar." }, { status: 409 });
  }

  const aceptar = accion === "aceptar";
  const ahora = new Date();
  const { error: updErr } = await admin
    .from("offers")
    .update({
      status: aceptar ? "accepted" : "rejected",
      responded_at: ahora.toISOString(),
      ...(aceptar ? { expires_at: new Date(ahora.getTime() + PLAZO_PAGO_ACEPTADA_HORAS * 3600 * 1000).toISOString() } : {}),
    })
    .eq("id", oferta.id)
    .eq("status", "pending");
  if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });

  const seller = (oferta as any).seller as { full_name: string | null; mercadopago_user_id: string | null } | null;
  const buyer = (oferta as any).buyer as { full_name: string | null; email: string | null } | null;
  const titulo = listing?.book?.title ?? "el libro";
  const puedePagarEnSitio = !!seller?.mercadopago_user_id || (await cobraPorTransferencia(oferta.seller_id));

  if (oferta.conversation_id) {
    const body = aceptar
      ? puedePagarEnSitio
        ? `✅ Acepté tu oferta de ${clp(oferta.amount)} por «${titulo}». Te lo dejo a ese precio por ${PLAZO_PAGO_ACEPTADA_HORAS} horas: cómpralo desde la ficha o el carrito.`
        : `✅ Acepté tu oferta de ${clp(oferta.amount)} por «${titulo}». Coordinemos acá el pago y la entrega.`
      : `Gracias por la oferta de ${clp(oferta.amount)} por «${titulo}», pero esta vez no puedo aceptarla. Si quieres, conversemos.`;
    const { error: msgErr } = await supabase
      .from("messages")
      .insert({ conversation_id: oferta.conversation_id, sender_id: user.id, body });
    if (msgErr) console.error("[offers] mensaje de respuesta:", msgErr.message);
    await supabase.from("conversations").update({ updated_at: ahora.toISOString() }).eq("id", oferta.conversation_id);
  }

  if (buyer?.email) {
    const datos = {
      titulo,
      monto: oferta.amount,
      precioPublicado: oferta.listing_price,
      compradorNombre: buyer.full_name,
      vendedorNombre: seller?.full_name ?? null,
      conversationId: oferta.conversation_id ?? "",
      listingId: oferta.listing_id,
    };
    const correo = aceptar ? correoOfertaAceptada({ ...datos, puedePagarEnSitio }) : correoOfertaRechazada(datos);
    await sendEmail({
      to: buyer.email,
      from: "Vero de tuslibros.cl <hola@tuslibros.cl>",
      subject: correo.subject,
      html: correo.html,
    }).catch(() => null);
  }

  sendGong(
    `${aceptar ? "✅ Oferta ACEPTADA" : "✖️ Oferta rechazada"}: ${clp(oferta.amount)} por «${escapeHtml(titulo)}» (publicado ${clp(oferta.listing_price)})\n` +
      `${escapeHtml(seller?.full_name ?? "—")} → ${escapeHtml(buyer?.full_name ?? "—")}`
  ).catch(() => {});

  return NextResponse.json({ ok: true, status: aceptar ? "accepted" : "rejected", puede_pagar_en_sitio: puedePagarEnSitio });
}
