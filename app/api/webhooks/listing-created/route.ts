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

    // Match with book requests (Wishlist fulfillment)
    try {
      const { data: requests } = await supabase
        .from("book_requests")
        .select("*")
        .eq("fulfilled", false);

      if (requests && requests.length > 0) {
        for (const req of requests) {
          const reqTitle = (req.title || "").toLowerCase().trim();
          const pubTitle = (title || "").toLowerCase().trim();
          
          // Match simple: si el título pedido está contenido en el publicado o viceversa
          const titleMatch = pubTitle.includes(reqTitle) || reqTitle.includes(pubTitle);
          
          if (titleMatch && reqTitle.length > 3) {
            console.log(`[listing-created] 🎯 Match found for request ${req.id}: ${title}`);
            
            // 1. Avisar a Vero (Admin) por Telegram
            await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                chat_id: chatId,
                text: `🎯 <b>¡MATCH DE DESEO!</b>\n\nAlguien publicó un libro que estaba en la lista de espera:\n\n📖 <b>${escape(title)}</b>\n✍️ ${escape(author)}\n👤 Pedido por: ${escape(req.requester_email || req.requester_whatsapp || "Anónimo")}\n\n<a href="${url}">Ver publicación y avisar →</a>`,
                parse_mode: "HTML",
              }),
            }).catch(() => {});

            // 2. Avisar al comprador por Email (si dejó uno)
            if (req.requester_email && resendKey) {
              const customerEmailHtml = `
<div style="font-family:system-ui,-apple-system,sans-serif;max-width:560px;margin:0 auto;padding:24px;background:#ffffff;color:#151522;border:1px solid #e5e7eb;border-radius:16px">
  <p style="color:#d4a017;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin:0 0 8px 0">¡Buenas noticias!</p>
  <h2 style="font-family:Georgia,serif;font-size:24px;margin:0 0 16px 0;color:#1a1a2e">Encontramos el libro que buscabas</h2>
  <p style="font-size:16px;line-height:1.6;color:#4b5563;margin-bottom:24px">
    Alguien acaba de publicar <strong>${escape(title)}</strong> en tuslibros.cl. Como nos pediste que te avisáramos, aquí tienes el link directo para que no se te escape:
  </p>
  <div style="background:#f9fafb;padding:20px;border-radius:12px;margin-bottom:24px;border:1px solid #f3f4f6">
    <p style="margin:0;font-weight:700;color:#111827">${escape(title)}</p>
    <p style="margin:4px 0 0 0;font-size:14px;color:#6b7280">${escape(author)}</p>
  </div>
  <a href="${url}" style="display:inline-block;padding:14px 28px;background:#1a1a2e;color:#ffffff;text-decoration:none;border-radius:8px;font-size:16px;font-weight:600">Ver y comprar libro →</a>
  <p style="margin-top:24px;font-size:13px;color:#9ca3af">
    Si ya no buscas este libro, puedes ignorar este correo. ¡Feliz lectura!
  </p>
</div>`;

              await fetch("https://api.resend.com/emails", {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${resendKey}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  from: "tuslibros.cl <noreply@tuslibros.cl>",
                  to: [req.requester_email],
                  subject: `📖 ¡Lo encontramos! ${title} ya está disponible`,
                  html: customerEmailHtml,
                }),
              }).catch((e) => console.error("Error sending match email:", e));
            }
          }
        }
      }
    } catch (matchErr) {
      console.error("Match with requests failed:", matchErr);
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
