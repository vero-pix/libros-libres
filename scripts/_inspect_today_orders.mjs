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

const today = "2026-04-17";

// Inspeccionar TODAS las órdenes de hoy con todos los campos
const { data: orders, error } = await s
  .from("orders")
  .select("*")
  .gte("created_at", today)
  .order("created_at", { ascending: false });

if (error) {
  console.error("err:", error);
  process.exit(1);
}

console.log(`\n═══ ÓRDENES HOY (${orders.length}) ═══\n`);
for (const o of orders) {
  console.log("────────────────────────────────────");
  console.log(JSON.stringify(o, null, 2));
  console.log();
}

// Y el usuario Camilo
const { data: camilo } = await s
  .from("users")
  .select("*")
  .eq("email", "camilosantelices@gmail.com")
  .single();
console.log("\n═══ USUARIO CAMILO ═══");
console.log(JSON.stringify(camilo, null, 2));
