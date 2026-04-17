import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split("\n")
    .filter((l) => l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i), l.slice(i + 1)];
    })
);

const s = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const now = Date.now();
const WINDOW_DAYS = 30;
const since = new Date(now - WINDOW_DAYS * 864e5).toISOString();

// Traigo todos los pageviews con referrer
const { data: views } = await s
  .from("page_views")
  .select("session_id, path, referrer, created_at, user_id, listing_id")
  .gte("created_at", since)
  .order("created_at", { ascending: true });

// Agrupar por session_id
const sessions = {};
for (const v of views || []) {
  if (!v.session_id) continue;
  if (!sessions[v.session_id]) sessions[v.session_id] = [];
  sessions[v.session_id].push(v);
}

const sessionIds = Object.keys(sessions);
const TOTAL_SESSIONS = sessionIds.length;
const TOTAL_VIEWS = (views || []).length;

// Entry pages (primera)
const entryCount = {};
const exitCount = {};
const bounceEntryCount = {};
let bounceSessions = 0;

for (const sid of sessionIds) {
  const seq = sessions[sid];
  const entry = seq[0].path;
  const exit = seq[seq.length - 1].path;
  entryCount[entry] = (entryCount[entry] || 0) + 1;
  exitCount[exit] = (exitCount[exit] || 0) + 1;
  if (seq.length === 1) {
    bounceSessions++;
    bounceEntryCount[entry] = (bounceEntryCount[entry] || 0) + 1;
  }
}

const pct = (n, d) => (d > 0 ? ((n / d) * 100).toFixed(1) + "%" : "-");
const top = (m, n = 15) =>
  Object.entries(m)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n);

const shorten = (p) => {
  if (!p) return "-";
  if (p.startsWith("/listings/")) return "/listings/" + p.slice(10, 18) + "…";
  if (p.startsWith("/libro/")) {
    const rest = p.slice(7);
    return "/libro/" + rest.slice(0, 25) + (rest.length > 25 ? "…" : "");
  }
  if (p.startsWith("/vendedor/")) return "/vendedor/" + p.slice(10, 16) + "…";
  return p.length > 45 ? p.slice(0, 42) + "…" : p;
};

console.log(`\n══════════════════════════════════════════════════════════`);
console.log(`  AUDIT ENTRY / EXIT / BOUNCE — últimos ${WINDOW_DAYS} días`);
console.log(`══════════════════════════════════════════════════════════`);
console.log(`Total sessions:   ${TOTAL_SESSIONS}`);
console.log(`Total pageviews:  ${TOTAL_VIEWS}`);
console.log(`Views por sesión: ${(TOTAL_VIEWS / TOTAL_SESSIONS).toFixed(2)}`);
console.log(`\n🔥 BOUNCE RATE (sesión de 1 sola página):`);
console.log(`  ${bounceSessions} / ${TOTAL_SESSIONS} sessions = ${pct(bounceSessions, TOTAL_SESSIONS)}`);

console.log(`\n📥 TOP ENTRY PAGES (primera página de la sesión):`);
for (const [p, n] of top(entryCount)) {
  const bounces = bounceEntryCount[p] || 0;
  console.log(`  ${String(n).padStart(4)}  (${pct(bounces, n).padStart(6)} bounce)  ${shorten(p)}`);
}

console.log(`\n📤 TOP EXIT PAGES (última página de la sesión):`);
for (const [p, n] of top(exitCount)) {
  console.log(`  ${String(n).padStart(4)}  ${shorten(p)}`);
}

// Referrers
const refCount = {};
for (const v of views || []) {
  if (!v.referrer) continue;
  try {
    const host = new URL(v.referrer).hostname;
    refCount[host] = (refCount[host] || 0) + 1;
  } catch {
    refCount[v.referrer] = (refCount[v.referrer] || 0) + 1;
  }
}

console.log(`\n🌐 TOP REFERRERS:`);
if (Object.keys(refCount).length === 0) {
  console.log(`  (sin referrers registrados — todos directos o mismo sitio)`);
} else {
  for (const [r, n] of top(refCount)) {
    console.log(`  ${String(n).padStart(4)}  ${r}`);
  }
}

// Listings: cuántos tienen visitas vs ninguna
const { data: allListings } = await s
  .from("listings")
  .select("id, slug, status, book:books(title)")
  .eq("status", "active");

const listingViews = {};
for (const v of views || []) {
  if (v.listing_id) listingViews[v.listing_id] = (listingViews[v.listing_id] || 0) + 1;
}

const withViews = (allListings || []).filter((l) => listingViews[l.id]);
const withoutViews = (allListings || []).filter((l) => !listingViews[l.id]);

console.log(`\n📚 LISTINGS ACTIVOS: ${allListings?.length || 0}`);
console.log(`  con ≥1 visita (30d):   ${withViews.length}  (${pct(withViews.length, allListings?.length || 1)})`);
console.log(`  SIN ninguna visita:    ${withoutViews.length}  (${pct(withoutViews.length, allListings?.length || 1)})  ← catálogo invisible`);

console.log(`\n🏆 TOP 10 LISTINGS MÁS VISTOS (30d):`);
const topListings = Object.entries(listingViews)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10);
for (const [lid, n] of topListings) {
  const l = (allListings || []).find((x) => x.id === lid);
  console.log(`  ${String(n).padStart(3)}  ${(l?.book?.title ?? "?").slice(0, 50)}`);
}

// Flujo desde home
console.log(`\n🔄 SESIONES QUE ENTRAN EN /:`);
let homeEntry = 0,
  homeThenLeft = 0,
  homeThenSearch = 0,
  homeThenListing = 0,
  homeThenOther = 0;
for (const sid of sessionIds) {
  const seq = sessions[sid];
  if (seq[0].path !== "/") continue;
  homeEntry++;
  if (seq.length === 1) {
    homeThenLeft++;
    continue;
  }
  const next = seq[1].path;
  if (next.startsWith("/search")) homeThenSearch++;
  else if (next.startsWith("/listings/") || next.startsWith("/libro/")) homeThenListing++;
  else homeThenOther++;
}
console.log(`  ${homeEntry} sessions entran por /`);
console.log(`    → se van sin hacer nada:  ${homeThenLeft}  (${pct(homeThenLeft, homeEntry)})`);
console.log(`    → clickean en un libro:   ${homeThenListing}  (${pct(homeThenListing, homeEntry)})`);
console.log(`    → van a /search:          ${homeThenSearch}  (${pct(homeThenSearch, homeEntry)})`);
console.log(`    → otros destinos:         ${homeThenOther}  (${pct(homeThenOther, homeEntry)})`);

// Checkout/cart abandon
console.log(`\n💳 EMBUDO DE COMPRA:`);
let visitCart = 0,
  visitCheckout = 0,
  registerVisit = 0,
  loginVisit = 0;
for (const sid of sessionIds) {
  const paths = sessions[sid].map((v) => v.path);
  if (paths.some((p) => p.includes("/carrito") || p.includes("/cart"))) visitCart++;
  if (paths.some((p) => p.startsWith("/checkout"))) visitCheckout++;
  if (paths.some((p) => p.startsWith("/register"))) registerVisit++;
  if (paths.some((p) => p.startsWith("/login"))) loginVisit++;
}
console.log(`  visitaron /login:     ${loginVisit}`);
console.log(`  visitaron /register:  ${registerVisit}`);
console.log(`  visitaron carrito:    ${visitCart}`);
console.log(`  visitaron /checkout:  ${visitCheckout}`);

console.log(`\n══════════════════════════════════════════════════════════\n`);
