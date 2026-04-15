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

// "Hoy" en zona Santiago: desde 00:00 local (GMT-4 aprox → UTC+4)
const todayCLT = new Date();
todayCLT.setHours(0, 0, 0, 0);
const sinceUTC = new Date(todayCLT.getTime() + 4 * 60 * 60 * 1000).toISOString();
console.log(`📅 Hoy desde (UTC): ${sinceUTC}\n`);

const { data: views, count, error } = await s
  .from("page_views")
  .select("path, browser, os, device, user_id, listing_id, session_id, created_at, referrer", { count: "exact" })
  .gte("created_at", sinceUTC)
  .order("created_at", { ascending: false });

if (error) { console.error(error); process.exit(1); }

const rows = views ?? [];
const unique = new Set(rows.map((r) => r.session_id).filter(Boolean)).size;
const logged = rows.filter((r) => r.user_id).length;

console.log("═══ VISITANTES HOY ═══");
console.log(`Total páginas vistas: ${count}`);
console.log(`Sesiones únicas:      ${unique}`);
console.log(`Vistas logueadas:     ${logged}`);
console.log();

// Top paths
const pathCounts = {};
for (const r of rows) pathCounts[r.path] = (pathCounts[r.path] ?? 0) + 1;
const topPaths = Object.entries(pathCounts).sort((a, b) => b[1] - a[1]).slice(0, 15);
console.log("═══ TOP PÁGINAS ═══");
for (const [p, c] of topPaths) console.log(`  ${String(c).padStart(3)}  ${p}`);
console.log();

// Devices
const devices = {};
for (const r of rows) devices[r.device] = (devices[r.device] ?? 0) + 1;
console.log("═══ DEVICES ═══");
for (const [d, c] of Object.entries(devices).sort((a, b) => b[1] - a[1])) console.log(`  ${String(c).padStart(3)}  ${d}`);
console.log();

// Browsers
const browsers = {};
for (const r of rows) browsers[r.browser] = (browsers[r.browser] ?? 0) + 1;
console.log("═══ BROWSERS ═══");
for (const [b, c] of Object.entries(browsers).sort((a, b) => b[1] - a[1])) console.log(`  ${String(c).padStart(3)}  ${b}`);
console.log();

// Referrers
const refs = {};
for (const r of rows) {
  const ref = r.referrer || "(direct)";
  refs[ref] = (refs[ref] ?? 0) + 1;
}
console.log("═══ REFERRERS ═══");
for (const [r, c] of Object.entries(refs).sort((a, b) => b[1] - a[1]).slice(0, 10)) console.log(`  ${String(c).padStart(3)}  ${r}`);
console.log();

// Listings vistos
const listings = rows.filter((r) => r.listing_id);
const listingCounts = {};
for (const r of listings) listingCounts[r.listing_id] = (listingCounts[r.listing_id] ?? 0) + 1;
const topListingIds = Object.entries(listingCounts).sort((a, b) => b[1] - a[1]).slice(0, 10);

if (topListingIds.length > 0) {
  console.log("═══ TOP LIBROS VISTOS ═══");
  const ids = topListingIds.map(([id]) => id);
  const { data: ls } = await s
    .from("listings")
    .select("id, slug, book:books(title, author)")
    .in("id", ids);
  const map = Object.fromEntries((ls ?? []).map((l) => [l.id, l]));
  for (const [id, c] of topListingIds) {
    const l = map[id];
    const label = l ? `${l.book.title} — ${l.book.author}` : id;
    console.log(`  ${String(c).padStart(3)}  ${label}`);
  }
}
