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

const d7 = new Date(Date.now() - 7*86400000).toISOString();

// Pageviews agrupadas por tipo - table is page_views
const { data: pv } = await s.from("page_views").select("path, session_id").gte("created_at", d7);
if (pv) {
  const buckets = {home:0, search:0, listing:0, libro:0, publish:0, checkout:0, cart:0, auth:0, profile:0, mi_cuenta:0, novedades:0, other:0};
  const byPath = {};
  for (const p of pv) {
    const path = p.path || "";
    byPath[path] = (byPath[path] || 0) + 1;
    if (path === "/") buckets.home++;
    else if (path.startsWith("/search")) buckets.search++;
    else if (path.startsWith("/listings/")) buckets.listing++;
    else if (path.startsWith("/libro/")) buckets.libro++;
    else if (path.startsWith("/publish")) buckets.publish++;
    else if (path.startsWith("/checkout")) buckets.checkout++;
    else if (path.startsWith("/carrito") || path.startsWith("/cart")) buckets.cart++;
    else if (path.startsWith("/login") || path.startsWith("/signup") || path.startsWith("/registro")) buckets.auth++;
    else if (path.startsWith("/mis-") || path.startsWith("/perfil")) buckets.mi_cuenta++;
    else if (path.startsWith("/novedades")) buckets.novedades++;
    else buckets.other++;
  }
  console.log("=== PAGEVIEWS 7d POR TIPO (", pv.length, "total) ===");
  const total = pv.length;
  const order = Object.entries(buckets).sort((a,b)=>b[1]-a[1]);
  for (const [k,v] of order) {
    console.log(`  ${k.padEnd(12)} ${String(v).padStart(5)}  ${(v*100/total).toFixed(1)}%`);
  }
  
  // Sesiones únicas que llegaron a cada etapa
  const homeSessions = new Set();
  const searchSessions = new Set();
  const listingSessions = new Set();
  const cartSessions = new Set();
  const checkoutSessions = new Set();
  
  for (const p of pv) {
    if (!p.session_id) continue;
    if (p.path === "/") homeSessions.add(p.session_id);
    if (p.path?.startsWith("/search")) searchSessions.add(p.session_id);
    if (p.path?.startsWith("/listings/") || p.path?.startsWith("/libro/")) listingSessions.add(p.session_id);
    if (p.path?.startsWith("/carrito") || p.path?.startsWith("/cart")) cartSessions.add(p.session_id);
    if (p.path?.startsWith("/checkout")) checkoutSessions.add(p.session_id);
  }
  
  console.log(`\n=== EMBUDO POR SESIONES ÚNICAS 7d ===`);
  console.log(`  HOME visitada:     ${homeSessions.size}`);
  console.log(`  SEARCH:            ${searchSessions.size}`);
  console.log(`  FICHA de libro:    ${listingSessions.size}`);
  console.log(`  CART:              ${cartSessions.size}`);
  console.log(`  CHECKOUT:          ${checkoutSessions.size}`);
}

// Órdenes 7d
const { data: orders7 } = await s.from("orders").select("id,status,total_amount,created_at,buyer_id").gte("created_at", d7).order("created_at",{ascending:false});
console.log(`\n=== ORDENES 7d: ${orders7?.length ?? 0} ===`);
for (const o of orders7 ?? []) console.log(`  ${o.created_at.slice(0,16)} — $${o.total_amount} — ${o.status}`);

