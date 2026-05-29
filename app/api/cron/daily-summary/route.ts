import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

const ADMIN_EMAIL = "vero@economics.cl";
const SITE = "https://tuslibros.cl";

export async function POST() {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    return NextResponse.json({ error: "RESEND_API_KEY missing" }, { status: 500 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const now = new Date();
  // Ayer en hora Chile (UTC-4)
  const chileOffset = -4 * 60;
  const chileNow = new Date(now.getTime() + chileOffset * 60000);
  const chileYesterday = new Date(chileNow);
  chileYesterday.setDate(chileYesterday.getDate() - 1);

  const since = new Date(chileYesterday);
  since.setHours(0, 0, 0, 0);
  const until = new Date(chileYesterday);
  until.setHours(23, 59, 59, 999);

  // Convertir de vuelta a UTC para las queries
  const sinceUTC = new Date(since.getTime() - chileOffset * 60000).toISOString();
  const untilUTC = new Date(until.getTime() - chileOffset * 60000).toISOString();

  const fechaDisplay = chileYesterday.toLocaleDateString("es-CL", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  // --- Queries paralelas ---
  const [
    { data: newUsers },
    { data: newListings },
    { data: orders },
    { data: searches },
    { data: deprioritizedToday },
  ] = await Promise.all([
    supabase.from("users").select("id, full_name, email, city").gte("created_at", sinceUTC).lte("created_at", untilUTC),
    supabase.from("listings").select("id, price, deprioritized, book:books(title, author), seller:users(full_name, username)").gte("created_at", sinceUTC).lte("created_at", untilUTC),
    supabase.from("orders").select("id, total, status, created_at").gte("created_at", sinceUTC).lte("created_at", untilUTC),
    supabase.from("search_queries").select("query, count").gte("last_searched_at", sinceUTC).lte("last_searched_at", untilUTC).order("count", { ascending: false }).limit(10),
    supabase.from("listings").select("id, book:books(title, author), seller:users(full_name)").eq("deprioritized", true).gte("created_at", sinceUTC).lte("created_at", untilUTC),
  ]);

  const users = newUsers ?? [];
  const listings = newListings ?? [];
  const allOrders = orders ?? [];
  const topSearches = searches ?? [];
  const flagged = deprioritizedToday ?? [];

  const paidOrders = allOrders.filter((o) => o.status === "paid" || o.status === "delivered");
  const totalRevenue = paidOrders.reduce((sum, o) => sum + (o.total ?? 0), 0);
  const normalListings = listings.filter((l) => !l.deprioritized);

  // --- HTML ---
  const section = (title: string, content: string) => `
    <div style="margin-bottom:28px">
      <h3 style="font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#8b8b9c;margin:0 0 12px 0">${title}</h3>
      ${content}
    </div>`;

  const stat = (label: string, value: string | number, sub = "") => `
    <div style="display:inline-block;background:#f5f0e8;border-radius:10px;padding:12px 20px;margin:0 8px 8px 0;min-width:80px;text-align:center">
      <div style="font-size:24px;font-weight:700;color:#1a1a2e">${value}</div>
      <div style="font-size:12px;color:#5a6b7d;margin-top:2px">${label}</div>
      ${sub ? `<div style="font-size:11px;color:#d4a017;margin-top:2px">${sub}</div>` : ""}
    </div>`;

  const row = (text: string, sub = "", flag = false) => `
    <div style="padding:8px 0;border-bottom:1px solid #f0ebe0;font-size:14px;color:${flag ? "#c0392b" : "#1a1a2e"}">
      ${flag ? "⚠️ " : ""}${text}${sub ? `<span style="color:#8b8b9c;font-size:12px;margin-left:8px">${sub}</span>` : ""}
    </div>`;

  const statsHtml = `
    <div style="margin-bottom:8px">
      ${stat("registros", users.length)}
      ${stat("libros nuevos", normalListings.length)}
      ${stat("ventas", paidOrders.length, paidOrders.length > 0 ? `$${totalRevenue.toLocaleString("es-CL")}` : "")}
      ${flagged.length > 0 ? stat("moderados", flagged.length, "revisar") : ""}
    </div>`;

  const usersHtml = users.length === 0
    ? `<p style="color:#8b8b9c;font-size:14px">Sin registros nuevos.</p>`
    : users.map((u: any) => row(`${u.full_name || "Sin nombre"}`, `${u.email} · ${u.city || "sin ciudad"}`)).join("");

  const listingsHtml = normalListings.length === 0
    ? `<p style="color:#8b8b9c;font-size:14px">Sin publicaciones nuevas.</p>`
    : normalListings.map((l: any) => {
        const book = l.book ?? {};
        const seller = l.seller ?? {};
        const sellerLink = seller.username
          ? `<a href="${SITE}/vendedor/${seller.username}" style="color:#d4a017">${seller.full_name}</a>`
          : seller.full_name ?? "—";
        return row(`${book.title ?? "—"} <span style="color:#8b8b9c">·</span> ${sellerLink}`, l.price ? `$${Number(l.price).toLocaleString("es-CL")}` : "");
      }).join("");

  const flaggedHtml = flagged.length === 0 ? "" : section("⚠️ Auto-moderados (revisar)",
    flagged.map((l: any) => row(`${l.book?.title ?? "—"}`, `vendedor: ${l.seller?.full_name ?? "—"}`, true)).join("")
  );

  const searchesHtml = topSearches.length === 0
    ? `<p style="color:#8b8b9c;font-size:14px">Sin búsquedas registradas.</p>`
    : topSearches.map((s: any) => row(`"${s.query}"`, `${s.count}x`)).join("");

  const ordersHtml = allOrders.length === 0
    ? `<p style="color:#8b8b9c;font-size:14px">Sin órdenes.</p>`
    : allOrders.map((o: any) => row(
        `Orden ${o.id.slice(0, 8)}…`,
        `${o.status} · ${o.total ? "$" + Number(o.total).toLocaleString("es-CL") : "—"}`
      )).join("");

  const html = `
<div style="font-family:system-ui,-apple-system,sans-serif;max-width:600px;margin:0 auto;padding:32px 24px;background:#faf7f1;color:#1a1a2e">
  <div style="margin-bottom:28px">
    <p style="font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#d4a017;margin:0 0 4px 0">Resumen diario</p>
    <h1 style="font-family:Georgia,serif;font-size:26px;margin:0;color:#1a1a2e">tuslibros.cl</h1>
    <p style="color:#8b8b9c;font-size:14px;margin:4px 0 0 0">${fechaDisplay}</p>
  </div>

  ${section("Métricas del día", statsHtml)}
  ${section("Nuevos registros", usersHtml)}
  ${section("Libros publicados", listingsHtml)}
  ${flaggedHtml}
  ${section("Órdenes", ordersHtml)}
  ${section("Lo que buscaron (top 10)", searchesHtml)}

  <div style="margin-top:32px;padding-top:20px;border-top:1px solid #e8e0d0;text-align:center">
    <a href="${SITE}/admin" style="display:inline-block;padding:10px 24px;background:#1a1a2e;color:#faf7f1;text-decoration:none;border-radius:8px;font-size:13px;font-weight:600">Abrir panel admin →</a>
  </div>
  <p style="text-align:center;color:#c0b89a;font-size:11px;margin-top:20px">tuslibros.cl · resumen automático 8:00 AM</p>
</div>`;

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "tuslibros.cl <noreply@tuslibros.cl>",
      to: [ADMIN_EMAIL],
      subject: `📊 tuslibros.cl · ${fechaDisplay}`,
      html,
    }),
  });

  return NextResponse.json({
    ok: true,
    stats: {
      users: users.length,
      listings: normalListings.length,
      orders: allOrders.length,
      flagged: flagged.length,
    },
  });
}
