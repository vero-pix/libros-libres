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
const d14 = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString();

// ─────────── PARTE 1: clasificar signups recientes ───────────
const { data: users } = await s
  .from("users")
  .select("id, email, username, full_name, city, phone, created_at, mercadopago_user_id")
  .gte("created_at", d14)
  .order("created_at", { ascending: false });

const { data: authData } = await s.auth.admin.listUsers({ perPage: 300 });
const authByEmail = Object.fromEntries((authData?.users ?? []).map((u) => [u.email, u]));

console.log("═══ CLASIFICACIÓN SIGNUPS (últimos 14 días) ═══\n");
const bots = [];
const reales = [];
for (const u of users ?? []) {
  const { count: listingsN } = await s.from("listings").select("id", { count: "exact", head: true }).eq("seller_id", u.id);
  const { count: ordersN } = await s.from("orders").select("id", { count: "exact", head: true }).eq("buyer_id", u.id);
  const au = authByEmail[u.email];
  const confirmed = !!au?.email_confirmed_at;
  const signedIn = !!au?.last_sign_in_at;

  // Heurística de bot: username autogenerado aleatorio (full_name == garbage CamelCase sin espacios y largo),
  // sin actividad, sin teléfono/ciudad. full_name aleatorio = sin espacios y mezcla de mayúsculas.
  const fn = u.full_name ?? "";
  const looksRandom = fn.length >= 12 && !fn.includes(" ") && /[a-z]/.test(fn) && /[A-Z]/.test(fn);
  const noActivity = listingsN === 0 && ordersN === 0;
  const isBot = looksRandom && noActivity && !u.phone && !u.city;

  const rec = {
    id: u.id, email: u.email, full_name: fn, username: u.username,
    created: u.created_at.slice(0, 16), listingsN, ordersN, confirmed, signedIn,
    phone: u.phone, city: u.city,
  };
  (isBot ? bots : reales).push(rec);
}

console.log(`🤖 BOTS detectados: ${bots.length}`);
for (const b of bots) {
  console.log(`  ${b.created}  ${b.email}  fn="${b.full_name}"  conf=${b.confirmed?"✓":"✗"} signin=${b.signedIn?"✓":"✗"}`);
}
console.log(`\n✅ REALES (o dudosos): ${reales.length}`);
for (const r of reales) {
  console.log(`  ${r.created}  ${r.email}  fn="${r.full_name}"  listings=${r.listingsN} orders=${r.ordersN} city=${r.city??"-"} phone=${r.phone?"✓":"-"}`);
}

// IDs de bots para borrar luego
fs.writeFileSync("/tmp/bot_ids.json", JSON.stringify(bots.map(b => ({id: b.id, email: b.email})), null, 2));
console.log(`\n→ ${bots.length} bot ids guardados en /tmp/bot_ids.json`);

// ─────────── PARTE 2: tráfico symbaloo ───────────
console.log("\n\n═══ TRÁFICO SYMBALOO (30 días) ═══\n");
const d30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
const { data: sym } = await s
  .from("page_views")
  .select("session_id, path, referrer, created_at, user_id")
  .gte("created_at", d30)
  .ilike("referrer", "%symbaloo%")
  .order("created_at", { ascending: true });

console.log(`Pageviews con referrer symbaloo: ${sym?.length ?? 0}`);
const symSessions = new Set((sym ?? []).map(v => v.session_id));
console.log(`Sesiones únicas: ${symSessions.size}\n`);

const pathCount = {};
const refVariants = {};
for (const v of sym ?? []) {
  pathCount[v.path] = (pathCount[v.path] || 0) + 1;
  refVariants[v.referrer] = (refVariants[v.referrer] || 0) + 1;
}
console.log("Paths visitados desde symbaloo:");
for (const [p, n] of Object.entries(pathCount).sort((a,b)=>b[1]-a[1]).slice(0,20)) {
  console.log(`  ${String(n).padStart(3)}  ${p}`);
}
console.log("\nVariantes exactas de referrer:");
for (const [r, n] of Object.entries(refVariants).sort((a,b)=>b[1]-a[1])) {
  console.log(`  ${String(n).padStart(3)}  ${r}`);
}
console.log("\nPrimeras/últimas fechas:");
if (sym?.length) {
  console.log(`  primera: ${sym[0].created_at.slice(0,16)}`);
  console.log(`  última:  ${sym[sym.length-1].created_at.slice(0,16)}`);
}
