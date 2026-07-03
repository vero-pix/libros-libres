import { createClient } from "@supabase/supabase-js";
import fs from "fs";
const env = fs.readFileSync(".env.local", "utf-8");
for (const line of env.split("\n")) { if (line.startsWith("#")||!line.includes("=")) continue; const i=line.indexOf("="); const k=line.slice(0,i).trim(); if(!process.env[k]) process.env[k]=line.slice(i+1).trim(); }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
// status válidos primero
const { data: distinct } = await s.from("orders").select("status").limit(1000);
console.log("Status presentes:", [...new Set((distinct??[]).map(o=>o.status))]);
const { data: orders } = await s.from("orders")
  .select("status, created_at, buyer:users!orders_buyer_id_fkey(full_name, email, city)")
  .order("created_at", { ascending: false }).limit(60);
const ok = (orders??[]).filter(o => !["pending","cancelled","expired","failed"].includes(o.status));
const seen = new Set();
console.log("\nCOMPRADORES (no pending/cancelled):");
for (const o of ok) { const b=o.buyer; if(!b) continue; const k=b.email??b.full_name; if(seen.has(k))continue; seen.add(k);
  console.log(`  • ${b.full_name??"—"} (${b.city??"?"}) — ${o.status} ${o.created_at?.slice(0,10)}`); }
