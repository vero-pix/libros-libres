import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { sendEmail } from "@/lib/email";
import { sendGong, escapeHtml } from "@/lib/notifications";
import { cobraPorTransferencia } from "@/lib/cobro-transferencia";
import {
  correoContraoferta,
  correoOfertaAceptada,
  correoOfertaRechazada,
  correoRespuestaDelComprador,
} from "@/lib/offer-emails";
import {
  MAX_CONTRAOFERTAS,
  PLAZO_PAGO_ACEPTADA_HORAS,
  PLAZO_RESPUESTA_DIAS,
  clp,
  errorMontoContraoferta,
  estadoVigente,
  rangoContraoferta,
} from "@/lib/offers";

const REMITENTE = "Vero de tuslibros.cl <hola@tuslibros.cl>";

/**
 * POST /api/offers/[id]/respond  { accion: "aceptar" | "rechazar" | "contraofertar", monto? }
 *
 * Responde siempre la parte que NO hizo la oferta (`made_by`): el vendedor a
 * una oferta del comprador, el comprador a una contraoferta del vendedor, y así.
 * Contraofertar deja esta fila en 'countered' y crea otra encadenada
 * (`parent_id`). Cada respuesta deja un mensaje en la conversación y un correo
 * a la otra parte.
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { accion, monto: montoRaw } = await req.json().catch(() => ({}));
  if (accion !== "aceptar" && accion !== "rechazar" && accion !== "contraofertar") {
    return NextResponse.json({ error: "Acción inválida" }, { status: 400 });
  }

  const admin = createServiceRoleClient();
  const { data: oferta } = await admin
    .from("offers")
    .select("id, listing_id, buyer_id, seller_id, amount, listing_price, status, expires_at, conversation_id, made_by, parent_id, ronda, listing:listings(status, book:books(title)), buyer:users!offers_buyer_id_fkey(full_name, email), seller:users!offers_seller_id_fkey(full_name, email, mercadopago_user_id)")
    .eq("id", params.id)
    .maybeSingle();

  if (!oferta) return NextResponse.json({ error: "Oferta no encontrada" }, { status: 404 });

  const hechaPorComprador = (oferta.made_by ?? "buyer") === "buyer";
  const responde = hechaPorComprador ? oferta.seller_id : oferta.buyer_id;
  if (responde !== user.id) {
    const quien = hechaPorComprador ? "el vendedor" : "el comprador";
    return NextResponse.json({ error: `Esta oferta la responde ${quien}.` }, { status: 403 });
  }
  // Quien responde es el vendedor cuando la oferta la hizo el comprador.
  const esVendedor = hechaPorComprador;

  const estado = estadoVigente(oferta as any);
  if (estado !== "pending") {
    if (estado === "expired" && oferta.status === "pending") {
      await admin.from("offers").update({ status: "expired" }).eq("id", oferta.id);
    }
    const porque = estado === "expired" ? "venció" : "ya fue respondida";
    return NextResponse.json({ error: `Esta oferta ${porque}.` }, { status: 409 });
  }

  const listing = (oferta as any).listing as { status: string; book: { title: string } | null } | null;
  if (accion !== "rechazar" && listing?.status !== "active") {
    return NextResponse.json({ error: "El libro ya no está disponible." }, { status: 409 });
  }

  const seller = (oferta as any).seller as { full_name: string | null; email: string | null; mercadopago_user_id: string | null } | null;
  const buyer = (oferta as any).buyer as { full_name: string | null; email: string | null } | null;
  const titulo = listing?.book?.title ?? "el libro";
  const ahora = new Date();
  const datosCorreo = {
    titulo,
    precioPublicado: oferta.listing_price,
    compradorNombre: buyer?.full_name ?? null,
    vendedorNombre: seller?.full_name ?? null,
    conversationId: oferta.conversation_id ?? "",
    listingId: oferta.listing_id,
  };

  async function mensaje(body: string, offerId?: string) {
    if (!oferta!.conversation_id) return;
    const { error } = await supabase
      .from("messages")
      .insert({ conversation_id: oferta!.conversation_id, sender_id: user!.id, body, ...(offerId ? { offer_id: offerId } : {}) });
    if (error) console.error("[offers] mensaje:", error.message);
    await supabase.from("conversations").update({ updated_at: ahora.toISOString() }).eq("id", oferta!.conversation_id);
  }

  // ── Contraofertar ────────────────────────────────────────────────────────
  if (accion === "contraofertar") {
    if ((oferta.ronda ?? 0) >= MAX_CONTRAOFERTAS) {
      return NextResponse.json({ error: "Llegaron al máximo de contraofertas: ahora toca aceptar o rechazar." }, { status: 409 });
    }
    let montoMadre: number | null = null;
    if (oferta.parent_id) {
      const { data: madre } = await admin.from("offers").select("amount").eq("id", oferta.parent_id).maybeSingle();
      montoMadre = madre?.amount ?? null;
    }
    const monto = Math.round(Number(montoRaw));
    const err = errorMontoContraoferta(monto, rangoContraoferta(oferta, montoMadre));
    if (err) return NextResponse.json({ error: err }, { status: 400 });

    const { data: cerrada } = await admin
      .from("offers")
      .update({ status: "countered", responded_at: ahora.toISOString() })
      .eq("id", oferta.id)
      .eq("status", "pending")
      .select("id");
    if (!cerrada?.length) return NextResponse.json({ error: "Esta oferta ya fue respondida." }, { status: 409 });

    const { data: nueva, error: insErr } = await admin
      .from("offers")
      .insert({
        listing_id: oferta.listing_id,
        buyer_id: oferta.buyer_id,
        seller_id: oferta.seller_id,
        amount: monto,
        listing_price: oferta.listing_price,
        conversation_id: oferta.conversation_id,
        made_by: esVendedor ? "seller" : "buyer",
        parent_id: oferta.id,
        ronda: (oferta.ronda ?? 0) + 1,
        expires_at: new Date(ahora.getTime() + PLAZO_RESPUESTA_DIAS * 24 * 3600 * 1000).toISOString(),
      })
      .select("id")
      .single();
    if (insErr || !nueva) {
      // Deshacer: que la oferta original no quede cerrada sin su reemplazo.
      await admin.from("offers").update({ status: "pending", responded_at: null }).eq("id", oferta.id);
      console.error("[offers] contraoferta:", insErr?.message);
      return NextResponse.json({ error: "No pudimos guardar la contraoferta." }, { status: 500 });
    }

    await mensaje(
      esVendedor
        ? `↔️ Te propongo ${clp(monto)} por «${titulo}» (me ofreciste ${clp(oferta.amount)}).`
        : `↔️ ¿Y si lo dejamos en ${clp(monto)}? (me propusiste ${clp(oferta.amount)}).`,
      nueva.id
    );

    const para = esVendedor ? buyer : seller;
    if (para?.email) {
      const correo = correoContraoferta({
        ...datosCorreo,
        monto,
        montoAnterior: oferta.amount,
        deVendedor: esVendedor,
      });
      await sendEmail({ to: para.email, from: REMITENTE, subject: correo.subject, html: correo.html }).catch(() => null);
    }
    sendGong(
      `↔️ Contraoferta ${esVendedor ? "del vendedor" : "del comprador"}: ${clp(monto)} por «${escapeHtml(titulo)}» ` +
        `(antes ${clp(oferta.amount)}, publicado ${clp(oferta.listing_price)})`
    ).catch(() => {});
    return NextResponse.json({ ok: true, status: "countered", offer_id: nueva.id });
  }

  // ── Aceptar / rechazar ───────────────────────────────────────────────────
  const aceptar = accion === "aceptar";
  const { data: cambiada, error: updErr } = await admin
    .from("offers")
    .update({
      status: aceptar ? "accepted" : "rejected",
      responded_at: ahora.toISOString(),
      ...(aceptar ? { expires_at: new Date(ahora.getTime() + PLAZO_PAGO_ACEPTADA_HORAS * 3600 * 1000).toISOString() } : {}),
    })
    .eq("id", oferta.id)
    .eq("status", "pending")
    .select("id");
  if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });
  if (!cambiada?.length) return NextResponse.json({ error: "Esta oferta ya fue respondida." }, { status: 409 });

  const puedePagarEnSitio = !!seller?.mercadopago_user_id || (await cobraPorTransferencia(oferta.seller_id));

  if (esVendedor) {
    await mensaje(
      aceptar
        ? puedePagarEnSitio
          ? `✅ Acepté tu oferta de ${clp(oferta.amount)} por «${titulo}». Te lo dejo a ese precio por ${PLAZO_PAGO_ACEPTADA_HORAS} horas: cómpralo desde la ficha o el carrito.`
          : `✅ Acepté tu oferta de ${clp(oferta.amount)} por «${titulo}». Coordinemos acá el pago y la entrega.`
        : `Gracias por la oferta de ${clp(oferta.amount)} por «${titulo}», pero esta vez no puedo aceptarla. Si quieres, conversemos.`
    );
    if (buyer?.email) {
      const d = { ...datosCorreo, monto: oferta.amount };
      const correo = aceptar ? correoOfertaAceptada({ ...d, puedePagarEnSitio }) : correoOfertaRechazada(d);
      await sendEmail({ to: buyer.email, from: REMITENTE, subject: correo.subject, html: correo.html }).catch(() => null);
    }
  } else {
    // El comprador responde a una contraoferta del vendedor.
    await mensaje(
      aceptar
        ? puedePagarEnSitio
          ? `✅ Acepto tus ${clp(oferta.amount)} por «${titulo}». Lo compro en las próximas ${PLAZO_PAGO_ACEPTADA_HORAS} horas.`
          : `✅ Acepto tus ${clp(oferta.amount)} por «${titulo}». Coordinemos acá el pago y la entrega.`
        : `Gracias por la contraoferta de ${clp(oferta.amount)}, pero esta vez paso.`
    );
    if (seller?.email) {
      const correo = correoRespuestaDelComprador({ ...datosCorreo, monto: oferta.amount, aceptada: aceptar, puedePagarEnSitio });
      await sendEmail({ to: seller.email, from: REMITENTE, subject: correo.subject, html: correo.html }).catch(() => null);
    }
  }

  sendGong(
    `${aceptar ? "✅ Oferta ACEPTADA" : "✖️ Oferta rechazada"} por ${esVendedor ? "el vendedor" : "el comprador"}: ` +
      `${clp(oferta.amount)} por «${escapeHtml(titulo)}» (publicado ${clp(oferta.listing_price)})\n` +
      `${escapeHtml(seller?.full_name ?? "—")} ↔ ${escapeHtml(buyer?.full_name ?? "—")}`
  ).catch(() => {});

  return NextResponse.json({ ok: true, status: aceptar ? "accepted" : "rejected", puede_pagar_en_sitio: puedePagarEnSitio });
}
