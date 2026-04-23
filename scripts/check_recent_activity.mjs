import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const env = fs.readFileSync(".env.local", "utf-8");
for (const line of env.split("\n")) {
  if (line.startsWith("#") || !line.includes("=")) continue;
  const idx = line.indexOf("=");
  const k = line.slice(0, idx).trim();
  if (!process.env[k]) process.env[k] = line.slice(idx + 1).trim();
}

const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const now = new Date();
const d3 = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString();
const d7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
const d14 = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString();

console.log(`Hoy: ${now.toISOString()}`);
console.log(`Últimos 3 días desde: ${d3}\n`);

// Usuarios nuevos
const { data: users3, error: uErr } = await s
  .from("users")
  .select("id, email, username, full_name, created_at")
  .gte("created_at", d3)
  .order("created_at", { ascending: false });
if (uErr) console.error("users err:", uErr);

const { count: users7 } = await s.from("users").select("*", { count: "exact", head: true }).gte("created_at", d7);
const { count: users14 } = await s.from("users").select("*", { count: "exact", head: true }).gte("created_at", d14);
const { count: usersTotal } = await s.from("users").select("*", { count: "exact", head: true });

console.log("═══ USUARIOS NUEVOS ═══");
console.log(`  Últimos 3 días:  ${users3?.length ?? 0}`);
console.log(`  Últimos 7 días:  ${users7 ?? 0}`);
console.log(`  Últimos 14 días: ${users14 ?? 0}`);
console.log(`  Total histórico: ${usersTotal ?? 0}`);
if (users3 && users3.length > 0) {
  console.log("  Detalle:");
  for (const u of users3) {
    console.log(`    ${u.created_at.slice(0, 16)} — ${u.email ?? "(sin email)"} — ${u.full_name ?? "(sin nombre)"} — @${u.username ?? "(sin username)"}`);
  }
}
console.log();

// Listings nuevos
const { data: lis3, error: lErr } = await s
  .from("listings")
  .select("id, status, price, created_at, seller_id, book:books(title, author), seller:users!listings_seller_id_fkey(username, full_name)")
  .gte("created_at", d3)
  .order("created_at", { ascending: false });
if (lErr) console.error("listings err:", lErr);

const { count: lis7 } = await s.from("listings").select("*", { count: "exact", head: true }).gte("created_at", d7);
const { count: lis14 } = await s.from("listings").select("*", { count: "exact", head: true }).gte("created_at", d14);
const { count: lisTotal } = await s.from("listings").select("*", { count: "exact", head: true });

console.log("═══ LIBROS PUBLICADOS ═══");
console.log(`  Últimos 3 días:  ${lis3?.length ?? 0}`);
console.log(`  Últimos 7 días:  ${lis7 ?? 0}`);
console.log(`  Últimos 14 días: ${lis14 ?? 0}`);
console.log(`  Total histórico: ${lisTotal ?? 0}`);
if (lis3 && lis3.length > 0) {
  console.log("  Detalle:");
  for (const l of lis3) {
    const seller = l.seller?.username ? `@${l.seller.username}` : l.seller?.full_name ?? l.seller_id.slice(0, 8);
    console.log(`    ${l.created_at.slice(0, 16)} — ${l.book?.title ?? "(?)"} — ${seller} — $${l.price} — ${l.status}`);
  }
}
console.log();

// Actividad page_views por día
const { data: pv, error: pErr } = await s
  .from("page_views")
  .select("created_at, session_id, user_id")
  .gte("created_at", d7);
if (pErr) console.error("pv err:", pErr);

const byDay = {};
for (const r of pv ?? []) {
  const day = r.created_at.slice(0, 10);
  if (!byDay[day]) byDay[day] = { views: 0, sessions: new Set(), logged: 0 };
  byDay[day].views++;
  if (r.session_id) byDay[day].sessions.add(r.session_id);
  if (r.user_id) byDay[day].logged++;
}
console.log("═══ TRÁFICO ÚLTIMOS 7 DÍAS ═══");
const days = Object.keys(byDay).sort().reverse();
for (const d of days) {
  const x = byDay[d];
  console.log(`  ${d}  views: ${String(x.views).padStart(4)}  sesiones: ${String(x.sessions.size).padStart(3)}  logged: ${String(x.logged).padStart(3)}`);
}
console.log();

// Órdenes recientes
const { data: orders, error: oErr } = await s
  .from("orders")
  .select("id, status, total, created_at, bundle_id")
  .gte("created_at", d14)
  .order("created_at", { ascending: false });
if (oErr) console.error("orders err:", oErr);

console.log("═══ ÓRDENES ÚLTIMOS 14 DÍAS ═══");
console.log(`  Total: ${orders?.length ?? 0}`);
for (const o of orders ?? []) {
  console.log(`    ${o.created_at.slice(0, 16)} — $${o.total} — ${o.status} — bundle:${o.bundle_id?.slice(0, 8) ?? "-"}`);
}
