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
const { data: pv } = await s.from("page_views").select("path").gte("created_at", d7);

const counts = {};
for (const p of pv ?? []) counts[p.path] = (counts[p.path]||0)+1;

const sorted = Object.entries(counts).sort((a,b)=>b[1]-a[1]);
console.log("TOP 40 paths últimos 7 días:");
for (const [p,n] of sorted.slice(0,40)) console.log(`  ${String(n).padStart(4)}  ${p}`);

console.log("\n\nPaths con 'cart', 'carrito', 'checkout', 'pagar', 'login', 'signup', 'auth', 'registro', 'publish':");
for (const [p,n] of sorted) {
  if (p && /cart|carrito|checkout|pagar|login|signup|auth|registro|publish|mi-|perfil/.test(p)) {
    console.log(`  ${String(n).padStart(4)}  ${p}`);
  }
}
