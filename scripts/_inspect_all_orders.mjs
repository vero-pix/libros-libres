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

const { data: orders, error } = await s
  .from("orders")
  .select("*")
  .order("created_at", { ascending: false });

if (error) {
  console.error("err:", error);
  process.exit(1);
}

console.log(`\n═══ TOTAL ÓRDENES: ${orders.length} ═══\n`);

const byStatus = {};
for (const o of orders) byStatus[o.status] = (byStatus[o.status] || 0) + 1;
console.log("Por status:");
for (const [k, v] of Object.entries(byStatus).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${k.padEnd(20)} ${v}`);
}

const buyerIds = [...new Set(orders.map((o) => o.buyer_id))];
const { data: users } = await s.from("users").select("id, full_name, email").in("id", buyerIds);
const byId = Object.fromEntries((users ?? []).map((u) => [u.id, u]));

console.log(`\nLista de órdenes:\n`);
// Ver columnas disponibles en la primera orden
if (orders.length) {
  console.log("\nColumnas de orders:", Object.keys(orders[0]).join(", "));
}

for (const o of orders) {
  const u = byId[o.buyer_id];
  const name = u ? `${u.full_name} (${u.email})` : o.buyer_id?.slice(0, 8);
  const amount = o.amount ?? o.total ?? o.price ?? o.total_clp ?? "?";
  console.log(
    `${o.created_at.slice(0, 16)}  ${o.status.padEnd(20)}  $${String(amount).padStart(7)}  ${name}  ${o.bundle_id ? "[bundle:" + o.bundle_id.slice(0, 6) + "]" : ""}`
  );
}
