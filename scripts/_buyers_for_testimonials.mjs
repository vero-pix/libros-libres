import { createClient } from "@supabase/supabase-js";
import fs from "fs";
const env = fs.readFileSync(".env.local", "utf-8");
for (const line of env.split("\n")) { if (line.startsWith("#")||!line.includes("=")) continue; const i=line.indexOf("="); const k=line.slice(0,i).trim(); if(!process.env[k]) process.env[k]=line.slice(i+1).trim(); }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
// Órdenes pagadas/completadas con comprador
const { data: orders, error } = await s.from("orders")
  .select("id, status, created_at, buyer:users!orders_buyer_id_fkey(full_name, email, city)")
  .in("status", ["paid","completed","delivered","shipped"])
  .order("created_at", { ascending: false }).limit(40);
if (error) { console.log("ERR orders:", error.message); }
const seen = new Set();
console.log("COMPRADORES (órdenes pagadas/completadas):");
for (const o of (orders??[])) {
  const b = o.buyer; if (!b) continue;
  const key = b.email ?? b.full_name; if (seen.has(key)) continue; seen.add(key);
  console.log(`  • ${b.full_name ?? "—"} (${b.city ?? "?"}) — ${o.status} ${o.created_at?.slice(0,10)} — ${b.email ?? ""}`);
}
