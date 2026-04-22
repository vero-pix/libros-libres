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
        "id, slug, price, modality, address, deprioritized, book:books(title, author), seller:users(full_name, username)"
      )
      .eq("id", listingId)
      .single();

    if (!listing) {
      return NextResponse.json({ error: "listing not found" }, { status: 404 });
    }

    // Auto-deprioritización por contenido político/controversial.
    // Se matchea con word-boundary en título y autor. Si ya está deprioritized
    // (por ej. flag manual), no lo volvemos a actualizar.
    const POLITICAL_KEYWORDS = [
      "allende", "pinochet", "unidad popular", "dictadura",
      "fidel castro", "stalin", "hitler", "mein kampf",
      "golpe de estado", "11 de septiembre", "jaime guzmán",
      "frei montalva", "patricio aylwin", "bachelet",
      "piñera", "lagos", "evo morales", "lula", "maduro",
      "comunismo", "socialismo", "marxismo", "capital marx",
      "fascismo", "nazi", "militar chile", "corbalán",
      "mitos de la democracia", "memoria histórica",
    ];
    const matchesPolitical = (text: string) => {
      const t = (text || "").toLowerCase();
      return POLITICAL_KEYWORDS.some((k) => {
        const re = new RegExp(`\\b${k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
        return re.test(t);
      });
    };
    try {
      const bookForCheck = (listing as any).book ?? {};
      if (!(listing as any).deprioritized && (matchesPolitical(bookForCheck.title || "") || matchesPolitical(bookForCheck.author || ""))) {
        await supabase.from("listings").update({ deprioritized: true }).eq("id", listingId);
        console.log(`[listing-created] Auto-deprioritized político: ${bookForCheck.title}`);
      }
    } catch (depErr) {
      console.error("Auto-deprioritization failed:", depErr);
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
      // No retornamos error — seguimos con el email aunque Telegram falle
    }

    // Email a admin vía Resend (complementa al Telegram)
    const resendKey = process.env.RESEND_API_KEY;
    const adminEmail = process.env.ADMIN_EMAIL || "vero@economics.cl";
    if (resendKey) {
      try {
        const emailHtml = `
<div style="font-family:system-ui,-apple-system,sans-serif;max-width:560px;margin:0 auto;padding:24px;background:#faf7f1;color:#151522">
  <div style="border-left:3px solid #d4a017;padding-left:16px;margin-bottom:20px">
    <p style="color:#8b8b9c;font-size:11px;letter-spacing:2px;text-transform:uppercase;margin:0 0 4px 0">Nueva publicación en tuslibros.cl</p>
    <h2 style="font-family:Georgia,serif;font-size:22px;margin:0;color:#1a1a2e">${escape(title)}</h2>
    <p style="color:#5a6b7d;margin:4px 0 0 0;font-style:italic">${escape(author)}</p>
  </div>
  <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
    <tr><td style="padding:6px 0;color:#8b8b9c;font-size:13px;width:100px">Vendedor</td><td style="padding:6px 0;font-size:14px">${escape(sellerName)}</td></tr>
    <tr><td style="padding:6px 0;color:#8b8b9c;font-size:13px">Precio</td><td style="padding:6px 0;font-size:14px;font-weight:600">${priceDisplay}</td></tr>
    ${commune ? `<tr><td style="padding:6px 0;color:#8b8b9c;font-size:13px">Ciudad</td><td style="padding:6px 0;font-size:14px">${escape(commune)}</td></tr>` : ""}
  </table>
  <a href="${url}" style="display:inline-block;padding:10px 20px;background:#1a1a2e;color:#faf7f1;text-decoration:none;border-radius:6px;font-size:14px;font-weight:600">Ver publicación →</a>
</div>`;
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "tuslibros.cl <noreply@tuslibros.cl>",
            to: [adminEmail],
            reply_to: adminEmail,
            subject: `📖 Nueva publicación: ${title}`,
            html: emailHtml,
          }),
        });
      } catch (emailErr) {
        console.error("Resend email failed:", emailErr);
      }
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
