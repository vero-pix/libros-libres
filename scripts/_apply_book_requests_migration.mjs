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

const sql = fs.readFileSync("supabase/migrations/20260419_book_requests.sql", "utf-8");

// Ejecutar vía RPC (requiere función exec_sql o similar; si no está, hay que aplicar manual)
const { data, error } = await s.rpc("exec_sql", { sql });

if (error) {
  console.error("No se pudo vía RPC — aplicar manualmente en Supabase SQL Editor:");
  console.error(error.message);
  console.log("\n─── SQL a pegar en Supabase SQL Editor ───");
  console.log(sql);
  process.exit(1);
}

console.log("✅ Migración aplicada");
console.log(data);
