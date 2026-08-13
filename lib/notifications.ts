import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Utilidad compartida para notificaciones "gongs" vía Telegram para el Admin.
 */
export async function sendGong(message: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID;

  if (!token || !chatId) {
    console.warn("Telegram env vars missing — skipping gong");
    return false;
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });
    return res.ok;
  } catch (err) {
    console.error("Error sending Telegram gong:", err);
    return false;
  }
}

export function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export interface SellerNotification {
  orderId: string;
  sellerName: string;
  sellerPhone: string | null;
  buyerName: string;
  bookTitle: string;
  bookAuthor: string;
  total: number;
  whatsappUrl: string | null;
  bundleSize?: number;
}

/**
 * Notifica al vendedor sobre una venta. Si la order pertenece a un bundle,
 * agrega contexto del bundle al mensaje.
 */
export async function notifySeller(
  orderId: string,
  supabase: SupabaseClient
): Promise<SellerNotification | null> {
  const { data: order, error } = await supabase
    .from("orders")
    .select(
      `
      id, total, status, bundle_id,
      listing:listings(id, price, book:books(title, author)),
      seller:users!orders_seller_id_fkey(full_name, email, phone),
      buyer:users!orders_buyer_id_fkey(full_name, email)
    `
    )
    .eq("id", orderId)
    .single();

  if (error || !order) {
    console.error("[notifySeller] Order not found:", orderId, error?.message);
    return null;
  }

  const seller = order.seller as unknown as {
    full_name: string;
    email: string;
    phone: string | null;
  };
  const buyer = order.buyer as unknown as {
    full_name: string;
    email: string;
  };
  const listing = order.listing as unknown as {
    id: string;
    price: number;
    book: { title: string; author: string };
  };

  const book = listing.book;
  const bundleId = (order as any).bundle_id as string | null;

  // Si es bundle, agrupar toda la info
  let bundleSize = 1;
  let bundleTotal = Number(order.total);
  let titleSummary = book.title;

  if (bundleId) {
    const { data: bundleOrders } = await supabase
      .from("orders")
      .select("id, total, listing:listings(book:books(title))")
      .eq("bundle_id", bundleId);
    if (bundleOrders && bundleOrders.length > 0) {
      bundleSize = bundleOrders.length;
      bundleTotal = bundleOrders.reduce(
        (sum: number, o: any) => sum + Number(o.total ?? 0),
        0
      );
      if (bundleSize > 1) {
        titleSummary = `${book.title} y ${bundleSize - 1} más`;
      }
    }
  }

  let whatsappUrl: string | null = null;
  if (seller.phone) {
    const cleanPhone = seller.phone.replace(/\D/g, "");
    const message = encodeURIComponent(
      bundleSize > 1
        ? `Hola ${seller.full_name}! ${buyer.full_name} compró ${bundleSize} libros tuyos en Libros Libres. Total: $${bundleTotal.toLocaleString("es-CL")}. Revisa Mis Ventas para coordinar el envío!`
        : `Hola ${seller.full_name}! Tu libro "${book.title}" fue comprado por ${buyer.full_name} en Libros Libres. Total: $${Number(order.total).toLocaleString("es-CL")}. Prepara el envio!`
    );
    whatsappUrl = `https://wa.me/${cleanPhone}?text=${message}`;
  }

  const notification: SellerNotification = {
    orderId,
    sellerName: seller.full_name,
    sellerPhone: seller.phone,
    buyerName: buyer.full_name,
    bookTitle: titleSummary,
    bookAuthor: book.author,
    total: bundleTotal,
    whatsappUrl,
    bundleSize,
  };

  console.log("[notifySeller] Venta confirmada:", {
    order: orderId,
    seller: seller.full_name,
    buyer: buyer.full_name,
    books: bundleSize > 1 ? `${bundleSize} libros` : `${book.title} — ${book.author}`,
    total: bundleTotal,
    whatsappUrl,
  });

  return notification;
}

/**
 * Pago rechazado o cancelado: hasta ahora nadie se enteraba. El comprador
 * quedaba mirando una pantalla de error y el libro seguía disponible sin que
 * él lo supiera. Le avisamos a él y nos avisamos a nosotros.
 */
export async function notifyPaymentFailed(
  orderIds: string[],
  supabase: SupabaseClient,
  statusDetail?: string
): Promise<void> {
  if (!orderIds.length) return;

  const { data: orders } = await supabase
    .from("orders")
    .select("id, total, book_price, listing_id, buyer_id")
    .in("id", orderIds);

  if (!orders?.length) return;

  const first = orders[0] as any;

  const [{ data: buyer }, { data: listing }] = await Promise.all([
    supabase.from("users").select("full_name, email").eq("id", first.buyer_id).maybeSingle(),
    supabase.from("listings").select("slug, seller_id").eq("id", first.listing_id).maybeSingle(),
  ]);

  const { data: seller } = listing?.seller_id
    ? await supabase.from("users").select("username").eq("id", listing.seller_id).maybeSingle()
    : { data: null };

  const buyerEmail = buyer?.email;
  const buyerName = buyer?.full_name ?? "";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://tuslibros.cl";
  const count = orders.length;

  // El banco rechazó vs. la persona se arrepintió: solo el primero merece
  // explicación, el segundo ya sabe lo que hizo.
  const rechazado = statusDetail !== "by_payer";

  if (buyerEmail && rechazado) {
    const link =
      listing?.slug && seller?.username
        ? `${siteUrl}/libro/${seller.username}/${listing.slug}`
        : `${siteUrl}/carrito`;

    const { sendEmail } = await import("./email");
    await sendEmail({
      to: buyerEmail,
      from: "Vero de tuslibros.cl <vero@tuslibros.cl>",
      subject:
        count > 1
          ? "Tu pago no pasó — los libros siguen disponibles"
          : "Tu pago no pasó — el libro sigue disponible",
      html: `
        <div style="font-family:Georgia,serif;font-size:16px;line-height:1.6;color:#2b2b2b;max-width:520px">
          <p>Hola${buyerName ? ` ${escapeHtml(buyerName.split(" ")[0])}` : ""}:</p>
          <p>Soy Vero, de tuslibros.cl. Intentaste pagar reci&eacute;n y el pago no pas&oacute; &mdash; lo rechaz&oacute; el banco, no fue nada de tu cuenta.</p>
          <p>${count > 1 ? "Los libros siguen" : "El libro sigue"} disponible${count > 1 ? "s" : ""}. Si quieres intentarlo de nuevo, en el checkout tambi&eacute;n puedes pagar con tarjeta de d&eacute;bito o cr&eacute;dito.</p>
          <p><a href="${link}" style="color:#8a5a2b">Retomar la compra &rarr;</a></p>
          <p>Y si algo no te calz&oacute; &mdash; el precio del despacho, por ejemplo &mdash; resp&oacute;ndeme este correo y lo vemos.</p>
          <p>Vero<br><span style="color:#777;font-size:14px">tuslibros.cl</span></p>
        </div>
      `,
    });
  }

  await sendGong(
    `⚠️ <b>Pago fallido</b>\n${escapeHtml(buyerName || buyerEmail || "?")}\n` +
      `${count} libro(s) · $${Number(first.total ?? 0).toLocaleString("es-CL")}\n` +
      `Motivo: ${escapeHtml(statusDetail ?? "desconocido")}` +
      (rechazado ? "\nLe avisé por correo." : "\nCanceló él mismo, no le escribí.")
  );
}
