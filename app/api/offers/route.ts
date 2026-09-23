import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cobraDentroDelSitio } from "@/lib/cobro-transferencia";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { sendEmail } from "@/lib/email";
import { sendGong, escapeHtml } from "@/lib/notifications";
import { buscarOCrearConversacion } from "@/lib/conversations";
import { correoOfertaRecibida } from "@/lib/offer-emails";
import {
  MAX_OFERTAS_DIA,
  PLAZO_RESPUESTA_DIAS,
  clp,
  errorMontoOferta,
  vendedorPuedeRecibirOfertas,
} from "@/lib/offers";

/**
 * POST /api/offers  { listing_id, amount, mensaje? }
 * El comprador ofrece un precio. La oferta se guarda en `offers` (service role:
 * el cliente nunca escribe monto ni estado) y se anuncia como mensaje en la
 * conversación con el vendedor, que recibe el correo. Ver lib/offers.ts.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Inicia sesión para hacer una oferta" }, { status: 401 });

  const { listing_id, amount, mensaje } = await req.json().catch(() => ({}));
  const monto = Math.round(Number(amount));
  if (!listing_id || !Number.isFinite(monto)) {
    return NextResponse.json({ error: "Falta el libro o el monto" }, { status: 400 });
  }
  const nota = typeof mensaje === "string" ? mensaje.trim().slice(0, 500) : "";

  const admin = createServiceRoleClient();
  const { data: listing } = await admin
    .from("listings")
    .select("id, price, status, seller_id, acepta_ofertas, book:books(title), seller:users(full_name, email, mercadopago_user_id, on_vacation)")
    .eq("id", listing_id)
    .maybeSingle();

  const seller = (listing as any)?.seller as
    | { full_name: string | null; email: string | null; mercadopago_user_id: string | null; on_vacation: boolean | null }
    | null;
  const titulo = ((listing as any)?.book?.title as string | undefined) ?? "tu libro";

  if (!listing || listing.status !== "active" || !listing.price) {
    return NextResponse.json({ error: "Este libro ya no está disponible." }, { status: 409 });
  }
  if (!listing.acepta_ofertas || !vendedorPuedeRecibirOfertas(await cobraDentroDelSitio(listing.seller_id, !!seller?.mercadopago_user_id))) {
    return NextResponse.json({ error: "Este libro no está recibiendo ofertas." }, { status: 409 });
  }
  if (seller?.on_vacation) {
    return NextResponse.json({ error: "El vendedor está de vacaciones. Vuelve a intentarlo a su regreso." }, { status: 409 });
  }
  if (listing.seller_id === user.id) {
    return NextResponse.json({ error: "No puedes ofertar por tu propio libro." }, { status: 400 });
  }

  const precio = Math.round(Number(listing.price));
  const errMonto = errorMontoOferta(monto, precio);
  if (errMonto) return NextResponse.json({ error: errMonto }, { status: 400 });

  const ahora = new Date().toISOString();
  // Las pendientes vencidas se cierran antes de mirar el índice de "una sola pendiente".
  await admin
    .from("offers")
    .update({ status: "expired" })
    .eq("buyer_id", user.id)
    .eq("listing_id", listing.id)
    .eq("status", "pending")
    .lte("expires_at", ahora);

  const { data: pendiente } = await admin
    .from("offers")
    .select("id, amount, made_by")
    .eq("buyer_id", user.id)
    .eq("listing_id", listing.id)
    .eq("status", "pending")
    .maybeSingle();
  if (pendiente) {
    const error =
      pendiente.made_by === "seller"
        ? `El vendedor te propuso ${clp(pendiente.amount)} por este libro: respóndele en la conversación.`
        : `Ya tienes una oferta de ${clp(pendiente.amount)} esperando respuesta por este libro.`;
    return NextResponse.json({ error }, { status: 409 });
  }

  const haceUnDia = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const { count: ofertasHoy } = await admin
    .from("offers")
    .select("id", { count: "exact", head: true })
    .eq("buyer_id", user.id)
    .eq("made_by", "buyer")
    .gte("created_at", haceUnDia);
  if ((ofertasHoy ?? 0) >= MAX_OFERTAS_DIA) {
    return NextResponse.json({ error: "Llegaste al máximo de ofertas por hoy. Mañana puedes seguir." }, { status: 429 });
  }

  const conv = await buscarOCrearConversacion(supabase, user.id, listing.seller_id, listing.id);
  if ("error" in conv) return NextResponse.json({ error: conv.error }, { status: 500 });

  const { data: oferta, error: ofertaErr } = await admin
    .from("offers")
    .insert({
      listing_id: listing.id,
      buyer_id: user.id,
      seller_id: listing.seller_id,
      amount: monto,
      listing_price: precio,
      conversation_id: conv.id,
      expires_at: new Date(Date.now() + PLAZO_RESPUESTA_DIAS * 24 * 3600 * 1000).toISOString(),
    })
    .select("id")
    .single();
  if (ofertaErr || !oferta) {
    console.error("[offers] insert:", ofertaErr?.message);
    return NextResponse.json({ error: "No pudimos guardar tu oferta. Intenta de nuevo." }, { status: 500 });
  }

  const body = `🤝 Te ofrezco ${clp(monto)} por «${titulo}» (publicado a ${clp(precio)}).${nota ? `\n\n${nota}` : ""}`;
  const { error: msgErr } = await supabase
    .from("messages")
    .insert({ conversation_id: conv.id, sender_id: user.id, body: body.slice(0, 2000), offer_id: oferta.id });
  if (msgErr) console.error("[offers] mensaje:", msgErr.message);
  await supabase.from("conversations").update({ updated_at: ahora }).eq("id", conv.id);

  const compradorNombre = (user.user_metadata?.full_name as string | undefined) ?? null;
  if (seller?.email) {
    const correo = correoOfertaRecibida({
      titulo,
      monto,
      precioPublicado: precio,
      compradorNombre,
      vendedorNombre: seller.full_name,
      conversationId: conv.id,
      listingId: listing.id,
      mensaje: nota,
    });
    await sendEmail({
      to: seller.email,
      from: "Vero de tuslibros.cl <hola@tuslibros.cl>",
      subject: correo.subject,
      html: correo.html,
    }).catch(() => null);
  }

  sendGong(
    `🤝 Oferta: ${clp(monto)} por «${escapeHtml(titulo)}» (publicado ${clp(precio)})\n` +
      `${escapeHtml(compradorNombre ?? user.email ?? "Alguien")} → ${escapeHtml(seller?.full_name ?? "—")}`
  ).catch(() => {});

  return NextResponse.json({ ok: true, offer_id: oferta.id, conversation_id: conv.id });
}

/**
 * GET /api/offers?listing_id=…  → la última oferta del usuario con sesión por
 * ese libro (o null). La ficha la usa para mostrar "tu oferta está esperando"
 * o "te aceptaron $X" en vez del formulario.
 */
export async function GET(req: NextRequest) {
  const listingId = req.nextUrl.searchParams.get("listing_id");
  if (!listingId) return NextResponse.json({ offer: null });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ offer: null });

  const { data } = await supabase
    .from("offers")
    .select("id, listing_id, buyer_id, seller_id, amount, listing_price, status, expires_at, conversation_id, created_at, made_by, parent_id, ronda")
    .eq("listing_id", listingId)
    .eq("buyer_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return NextResponse.json({ offer: data ?? null });
}
