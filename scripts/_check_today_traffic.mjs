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
const todayStartUTC = new Date(now);
todayStartUTC.setUTCHours(0, 0, 0, 0);

// Paginar
async function fetchAll(from) {
  const all = [];
  let page = 0;
  while (true) {
    const { data, error } = await s
      .from("page_views")
      .select("session_id, path, referrer, user_id, created_at")
      .gte("created_at", from.toISOString())
      .order("created_at", { ascending: true })
      .range(page * 1000, page * 1000 + 999);
    if (error) throw error;
    if (!data?.length) break;
    all.push(...data);
    if (data.length < 1000) break;
    page++;
  }
  return all;
}

const pvsToday = await fetchAll(todayStartUTC);

console.log(`═══ TRÁFICO HOY (desde ${todayStartUTC.toISOString()}) ═══`);
console.log(`Pageviews totales: ${pvsToday.length}`);

const sessions = new Set(pvsToday.map((p) => p.session_id).filter(Boolean));
console.log(`Sessions únicas:   ${sessions.size}`);

// Agrupar por hora
const byHour = {};
for (const pv of pvsToday) {
  const h = new Date(pv.created_at).toISOString().slice(0, 13) + ":00";
  byHour[h] = (byHour[h] || 0) + 1;
}
console.log(`\nPor hora (UTC):`);
for (const [h, n] of Object.entries(byHour).sort()) {
  console.log(`  ${h}  ${"█".repeat(Math.min(n, 40))} ${n}`);
}

// Top paths
const pathCount = {};
for (const pv of pvsToday) pathCount[pv.path] = (pathCount[pv.path] || 0) + 1;
console.log(`\nTop paths hoy:`);
for (const [p, n] of Object.entries(pathCount).sort((a, b) => b[1] - a[1]).slice(0, 15)) {
  console.log(`  ${String(n).padStart(3)}  ${p}`);
}

// Referrers
const refCount = {};
const firstPvBySession = {};
for (const pv of pvsToday) {
  if (!pv.session_id) continue;
  if (!firstPvBySession[pv.session_id]) firstPvBySession[pv.session_id] = pv;
}
for (const pv of Object.values(firstPvBySession)) {
  let r = pv.referrer || "(directo)";
  try { r = new URL(r).hostname.replace(/^www\./, ""); } catch {}
  refCount[r] = (refCount[r] || 0) + 1;
}
console.log(`\nReferrers (primera pv por session):`);
for (const [r, n] of Object.entries(refCount).sort((a, b) => b[1] - a[1]).slice(0, 10)) {
  console.log(`  ${String(n).padStart(3)}  ${r}`);
}
