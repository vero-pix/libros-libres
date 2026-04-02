import { SupabaseClient } from "@supabase/supabase-js";

export interface SellerNotification {
  orderId: string;
  sellerName: string;
  sellerPhone: string | null;
  buyerName: string;
  bookTitle: string;
  bookAuthor: string;
  total: number;
  whatsappUrl: string | null;
}

/**
 * Fetch order details and build a seller notification payload.
 * Currently logs to console; ready for email/SMS integration later.
 */
export async function notifySeller(
  orderId: string,
  supabase: SupabaseClient
): Promise<SellerNotification | null> {
  const { data: order, error } = await supabase
    .from("orders")
    .select(
      `
      id, total, status,
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

  // Build WhatsApp deep-link if seller has a phone number
  let whatsappUrl: string | null = null;
  if (seller.phone) {
    const cleanPhone = seller.phone.replace(/\D/g, "");
    const message = encodeURIComponent(
      `Hola ${seller.full_name}! Tu libro "${book.title}" fue comprado por ${buyer.full_name} en Libros Libres. Total: $${order.total}. Prepara el envio!`
    );
    whatsappUrl = `https://wa.me/${cleanPhone}?text=${message}`;
  }

  const notification: SellerNotification = {
    orderId,
    sellerName: seller.full_name,
    sellerPhone: seller.phone,
    buyerName: buyer.full_name,
    bookTitle: book.title,
    bookAuthor: book.author,
    total: order.total,
    whatsappUrl,
  };

  // TODO: Integrate email service (Resend, SendGrid, etc.)
  // TODO: Send push notification via web push or mobile
  console.log("[notifySeller] Venta confirmada:", {
    order: orderId,
    seller: seller.full_name,
    buyer: buyer.full_name,
    book: `${book.title} — ${book.author}`,
    total: order.total,
    whatsappUrl,
  });

  return notification;
}
