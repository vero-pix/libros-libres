import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

/**
 * Notificador "gong" para Vero vía Telegram.
 * Se llama fire-and-forget después de crear un listing.
 * Body: { listingId: string }
 */
export async function POST(req: Request) {
  try {
    const { listingId } = await req.json();
    if (!listingId) {
      return NextResponse.json({ error: "missing listingId" }, { status: 400 });
    }

    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
    if (!token || !chatId) {
      console.warn("Telegram env vars missing — skipping notification");
      return NextResponse.json({ ok: true, skipped: true });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );

    const { data: listing } = await supabase
      .from("listings")
      .select(
        "id, slug, price, modality, address, book:books(title, author), seller:users(full_name, username)"
      )
      .eq("id", listingId)
      .single();

    if (!listing) {
      return NextResponse.json({ error: "listing not found" }, { status: 404 });
    }

    const book = (listing as any).book ?? {};
    const seller = (listing as any).seller ?? {};
    const title = book.title ?? "—";
    const author = book.author ?? "—";
    const sellerName = seller.full_name ?? "Alguien";
    const priceDisplay =
      listing.modality === "loan"
        ? "Arriendo"
        : listing.price
          ? `$${Number(listing.price).toLocaleString("es-CL")}`
          : "—";
    const addr = (listing as any).address ?? "";
    const commune = addr.split(",").slice(-3, -2)[0]?.trim() ?? "";

    const url = seller.username
      ? `https://tuslibros.cl/libro/${seller.username}/${listing.slug}`
      : `https://tuslibros.cl/libro/${listing.slug}`;

    const message =
      `🔔 <b>Nueva publicación</b>\n\n` +
      `📖 <b>${escape(title)}</b>\n` +
      `✍️ ${escape(author)}\n` +
      `👤 ${escape(sellerName)}\n` +
      `💰 ${priceDisplay}` +
      (commune ? `\n📍 ${escape(commune)}` : "") +
      `\n\n<a href="${url}">Ver libro →</a>`;

    const tgRes = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: "HTML",
          disable_web_page_preview: false,
        }),
      }
    );

    if (!tgRes.ok) {
      const err = await tgRes.text();
      console.error("Telegram send failed:", err);
      return NextResponse.json({ error: "telegram failed", detail: err }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("listing-created webhook error:", e);
    return NextResponse.json({ error: e.message ?? "unknown" }, { status: 500 });
  }
}

function escape(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
