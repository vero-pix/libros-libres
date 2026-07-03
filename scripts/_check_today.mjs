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

// Inicio del día Chile (UTC-4)
const now = Date.now();
const chileNow = new Date(now - 4*3600e3);
const startToday = new Date(Date.UTC(chileNow.getUTCFullYear(), chileNow.getUTCMonth(), chileNow.getUTCDate()) + 4*3600e3).toISOString();

const { data, error } = await s
  .from("listings")
  .select("id, price, status, created_at, seller_id, book:books(title)")
  .gte("created_at", startToday)
  .order("created_at", { ascending: false });

if (error) { console.error(error); process.exit(1); }
console.log(`Listings creados HOY (desde ${startToday}): ${data.length}\n`);

// Agrupar por seller
const bySeller = {};
for (const l of data) bySeller[l.seller_id] = (bySeller[l.seller_id] ?? 0) + 1;

const sellerIds = Object.keys(bySeller);
const { data: sellers } = await s.from("users").select("id, full_name, username, email, created_at").in("id", sellerIds);
const smap = Object.fromEntries((sellers??[]).map(u => [u.id, u]));

for (const [sid, n] of Object.entries(bySeller).sort((a,b)=>b[1]-a[1])) {
  const u = smap[sid];
  const regAge = u ? Math.round((now - new Date(u.created_at).getTime())/86400e3) : "?";
  console.log(`  ${String(n).padStart(3)} libros — ${u?.full_name ?? "?"} (@${u?.username ?? "sin-username"}) ${u?.email ?? ""} · registrado hace ${regAge}d`);
}
