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

// El replanteo grande fue el 19 abril, deploys ~15:00 (fix #1) a ~21:00 (economía inversa)
// Usamos 19 abril 19:00 UTC (≈16:00 CL) como línea de corte.
const DEPLOY_CUTOFF = new Date("2026-04-19T19:00:00Z");

// Ventanas a comparar
const now = new Date();
const hoursAgo = (h) => new Date(now.getTime() - h * 3600e3);

const windows = [
  { label: "ANTES (48h: 17-19 abril pre-deploy)", from: new Date("2026-04-17T00:00:00Z"), to: DEPLOY_CUTOFF },
  { label: "DESPUÉS (post-deploy hasta ahora)", from: DEPLOY_CUTOFF, to: now },
];

// Paginación para saltarse el límite de 1000 filas
async function fetchAllPageViews(from, to) {
  const all = [];
  let page = 0;
  const size = 1000;
  while (true) {
    const { data, error } = await s
      .from("page_views")
      .select("session_id, path, referrer, created_at")
      .gte("created_at", from.toISOString())
      .lt("created_at", to.toISOString())
      .order("created_at", { ascending: true })
      .range(page * size, page * size + size - 1);
    if (error) throw error;
    if (!data?.length) break;
    all.push(...data);
    if (data.length < size) break;
    page++;
  }
  return all;
}

function analyze(pvs, label) {
  // Agrupar por session
  const sessions = new Map();
  for (const pv of pvs) {
    if (!pv.session_id) continue;
    if (!sessions.has(pv.session_id)) sessions.set(pv.session_id, []);
    sessions.get(pv.session_id).push(pv);
  }

  const total = sessions.size;
  let enteredByHome = 0;
  let bouncedFromHome = 0;
  let clickedListing = 0;
  let wentToSearch = 0;
  let wentToSolicitudes = 0;
  let anyClick = 0;

  for (const [sid, views] of sessions) {
    views.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    const first = views[0];
    const isHomeEntry =
      first.path === "/" || first.path === "" || /^\/\?/.test(first.path);
    if (!isHomeEntry) continue;
    enteredByHome++;
    if (views.length === 1) bouncedFromHome++;
    else anyClick++;
    for (const pv of views) {
      if (/^\/libro\/|^\/listings\//.test(pv.path)) {
        clickedListing++;
        break;
      }
    }
    for (const pv of views) {
      if (pv.path === "/search" || /^\/search/.test(pv.path)) {
        wentToSearch++;
        break;
      }
    }
    for (const pv of views) {
      if (pv.path === "/solicitudes") {
        wentToSolicitudes++;
        break;
      }
    }
  }

  const pct = (n) => enteredByHome ? ((n / enteredByHome) * 100).toFixed(1) : "0.0";
  return {
    label,
    totalSessions: total,
    enteredByHome,
    bouncedFromHome,
    bouncePct: pct(bouncedFromHome),
    anyClick,
    clickedListing,
    clickedListingPct: pct(clickedListing),
    wentToSearch,
    wentToSearchPct: pct(wentToSearch),
    wentToSolicitudes,
  };
}

// Traffic total del sitio por ventana
async function sourceStats(from, to) {
  const pvs = await fetchAllPageViews(from, to);
  const total = pvs.length;
  const sessions = new Set(pvs.map((p) => p.session_id).filter(Boolean)).size;
  // Agrupar por referrer (primera pageview de cada session)
  const sessionMap = new Map();
  for (const pv of pvs) {
    if (!pv.session_id) continue;
    if (!sessionMap.has(pv.session_id)) sessionMap.set(pv.session_id, pv);
    else {
      const ex = sessionMap.get(pv.session_id);
      if (new Date(pv.created_at) < new Date(ex.created_at)) sessionMap.set(pv.session_id, pv);
    }
  }
  const refCount = {};
  for (const [, pv] of sessionMap) {
    let r = pv.referrer || "(directo)";
    try {
      const u = new URL(r);
      r = u.hostname.replace(/^www\./, "");
    } catch {}
    refCount[r] = (refCount[r] || 0) + 1;
  }
  return { total, sessions, refCount, pvs };
}

console.log("\n═══ IMPACTO DEL REPLANTEO HOME (19 abril, deploys 15–21 CL) ═══\n");

for (const w of windows) {
  const stats = await sourceStats(w.from, w.to);
  const analysis = analyze(stats.pvs, w.label);
  const hours = (w.to - w.from) / 3600e3;

  console.log(`── ${w.label} (${hours.toFixed(0)}h) ──`);
  console.log(`  Total pageviews:            ${stats.total}`);
  console.log(`  Sessions únicas:            ${stats.sessions}`);
  console.log(`  Sessions que entran por /:  ${analysis.enteredByHome}`);
  console.log(`  → BOUNCE desde home:        ${analysis.bouncedFromHome}  (${analysis.bouncePct}%)`);
  console.log(`  → Clickean un libro:        ${analysis.clickedListing}  (${analysis.clickedListingPct}%)`);
  console.log(`  → Van a /search:            ${analysis.wentToSearch}  (${analysis.wentToSearchPct}%)`);
  console.log(`  → Van a /solicitudes:       ${analysis.wentToSolicitudes}  (feature nueva)`);
  console.log(`  Top referrers:`);
  const refs = Object.entries(stats.refCount).sort((a, b) => b[1] - a[1]).slice(0, 6);
  for (const [r, n] of refs) console.log(`     ${String(n).padStart(4)}  ${r}`);
  console.log();
}

// Registros en cada ventana
console.log("── Registros (tabla users) ──");
for (const w of windows) {
  const { data: users } = await s
    .from("users")
    .select("id, email, created_at")
    .gte("created_at", w.from.toISOString())
    .lt("created_at", w.to.toISOString());
  console.log(`  ${w.label}: ${users?.length ?? 0} registros`);
  for (const u of users ?? []) {
    console.log(`     ${u.created_at.slice(0, 16)}  ${u.email}`);
  }
}

// Solicitudes nuevas (economía inversa)
console.log("\n── Solicitudes creadas (economía inversa, solo aplica post-deploy) ──");
const { data: reqs } = await s
  .from("book_requests")
  .select("id, title, author, requester_location, created_at");
for (const r of reqs ?? []) {
  console.log(`  ${r.created_at.slice(0, 16)}  "${r.title}" de ${r.author ?? "?"}  ${r.requester_location ? "📍 " + r.requester_location : ""}`);
}
