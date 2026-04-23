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

const d30 = new Date(Date.now() - 30*86400000).toISOString();

// Pageviews con path que contenga carrito o checkout EN CUALQUIER MOMENTO
const { data: cart } = await s.from("page_views").select("path, created_at, session_id, user_id").ilike("path", "%carrito%").gte("created_at", d30);
const { data: checkout } = await s.from("page_views").select("path, created_at, session_id, user_id").ilike("path", "%checkout%").gte("created_at", d30);

console.log(`PAGEVIEWS /carrito últimos 30d: ${cart?.length ?? 0}`);
for (const c of (cart||[]).slice(0,5)) console.log(`  ${c.created_at?.slice(0,16)} — ${c.path} — user=${c.user_id?.slice(0,8) ?? '—'}`);

console.log(`\nPAGEVIEWS /checkout últimos 30d: ${checkout?.length ?? 0}`);
for (const c of (checkout||[]).slice(0,10)) console.log(`  ${c.created_at?.slice(0,16)} — ${c.path} — user=${c.user_id?.slice(0,8) ?? '—'}`);

// Cart_items histórico
const { data: cartItems } = await s.from("cart_items").select("id,user_id,listing_id,added_at").gte("added_at", d30).order("added_at", {ascending:false});
console.log(`\nCART_ITEMS agregados al carrito 30d: ${cartItems?.length ?? 0}`);
for (const c of (cartItems||[]).slice(0,20)) console.log(`  ${c.added_at?.slice(0,16)} — user=${c.user_id?.slice(0,8)} — listing=${c.listing_id?.slice(0,8)}`);

