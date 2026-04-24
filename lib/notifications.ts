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
