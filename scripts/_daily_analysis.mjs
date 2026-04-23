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

// Hoy = desde 00:00 Chile (UTC-4) = 04:00 UTC
const todayStart = new Date();
todayStart.setUTCHours(4,0,0,0);
const todayStartISO = todayStart.toISOString();

console.log("=== HOY (desde 00:00 Chile / 04:00 UTC) ===");
console.log(`Desde: ${todayStartISO}\n`);

// 1. SOLICITUDES / BOOK REQUESTS
const tables = ["book_requests", "solicitudes", "requests"];
let requestsTable = null;
for (const t of tables) {
  const { data, error } = await s.from(t).select("*").limit(1);
  if (!error) { requestsTable = t; break; }
}
console.log(`### SOLICITUDES (tabla=${requestsTable})`);
if (requestsTable) {
  const { data: reqs } = await s.from(requestsTable).select("*").gte("created_at", todayStartISO).order("created_at",{ascending:false});
  console.log(`Hoy: ${reqs?.length ?? 0}`);
  for (const r of reqs ?? []) {
    console.log(`  ${r.created_at?.slice(0,16)} — ${r.title ?? r.book_title ?? r.query ?? JSON.stringify(r)}`);
  }
  // Últimos 7 días para contexto
  const d7 = new Date(Date.now() - 7*86400000).toISOString();
  const { data: reqs7 } = await s.from(requestsTable).select("*").gte("created_at", d7).order("created_at",{ascending:false});
  console.log(`\nÚltimos 7d: ${reqs7?.length ?? 0}`);
  for (const r of (reqs7 ?? []).slice(0, 20)) {
    const title = r.title ?? r.book_title ?? r.query ?? "?";
    console.log(`  ${r.created_at?.slice(0,10)} — ${title}`);
  }
}

// 2. TOP FICHAS VISITADAS HOY
console.log(`\n\n### TOP FICHAS VISITADAS HOY`);
const { data: pvToday } = await s.from("page_views").select("path, session_id").gte("created_at", todayStartISO);
const fichaCounts = {};
const fichaSessions = {};
for (const p of pvToday ?? []) {
  if (p.path?.startsWith("/libro/") || p.path?.startsWith("/listings/")) {
    fichaCounts[p.path] = (fichaCounts[p.path] || 0) + 1;
    fichaSessions[p.path] = fichaSessions[p.path] || new Set();
    fichaSessions[p.path].add(p.session_id);
  }
}
const sorted = Object.entries(fichaCounts).sort((a,b)=>b[1]-a[1]).slice(0,15);
for (const [path, count] of sorted) {
  console.log(`  ${String(count).padStart(3)} views (${fichaSessions[path].size} sesiones)  ${path}`);
}

// 3. BÚSQUEDAS EN SITE (path /search?q=...)
console.log(`\n\n### BÚSQUEDAS HOY`);
const { data: searches } = await s.from("page_views").select("path, created_at").gte("created_at", todayStartISO).ilike("path", "/search%");
const searchQueries = {};
for (const s of searches ?? []) {
  const match = s.path.match(/[?&]q=([^&]+)/);
  if (match) {
    const q = decodeURIComponent(match[1]).replace(/\+/g," ");
    searchQueries[q] = (searchQueries[q] || 0) + 1;
  }
}
const sortedQ = Object.entries(searchQueries).sort((a,b)=>b[1]-a[1]);
if (sortedQ.length === 0) {
  console.log(`(sin queries capturadas en ?q= — total /search pageviews: ${searches?.length ?? 0})`);
  const pathSample = (searches ?? []).slice(0,10).map(s=>s.path);
  console.log("Ejemplos de paths:");
  for (const p of pathSample) console.log(`  ${p}`);
} else {
  for (const [q,n] of sortedQ.slice(0,20)) console.log(`  ${String(n).padStart(2)}x  "${q}"`);
}

// 4. Listings publicados HOY
console.log(`\n\n### LISTINGS PUBLICADOS HOY`);
const { data: newListings } = await s.from("listings").select("id,book_id,seller_id,created_at,price,status").gte("created_at", todayStartISO).order("created_at",{ascending:false});
console.log(`Total: ${newListings?.length ?? 0}`);
for (const l of newListings ?? []) {
  const { data: book } = await s.from("books").select("title").eq("id", l.book_id).single();
  const { data: seller } = await s.from("users").select("username,full_name").eq("id", l.seller_id).single();
  console.log(`  ${l.created_at?.slice(11,16)} — @${seller?.username ?? seller?.full_name ?? "?"} — $${l.price} — ${book?.title}`);
}
