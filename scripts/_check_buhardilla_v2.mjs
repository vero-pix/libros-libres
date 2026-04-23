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
const UID = "fbeedb59-210a-4639-a4ee-6884368058cd";

// Todas las columnas de la tabla listings
const { data: sample } = await s.from("listings").select("*").limit(1);
console.log("COLUMNAS listings:", Object.keys(sample?.[0] ?? {}).join(", "));

// Busca por todos los campos FK posibles
for (const col of ["seller_id", "user_id", "owner_id", "created_by"]) {
  try {
    const { data, error } = await s.from("listings").select("id,title,status,created_at").eq(col, UID).limit(10);
    if (error) continue;
    if (data && data.length > 0) console.log(`\n>> Match por ${col}: ${data.length} listings`, data);
  } catch {}
}

// Últimos 10 listings del sistema
const { data: recent } = await s.from("listings").select("id,title,status,created_at,seller_id").order("created_at", {ascending:false}).limit(10);
console.log("\n── ÚLTIMOS 10 LISTINGS DEL SISTEMA ──");
for (const l of recent ?? []) console.log(`  [${l.status}] ${l.created_at.slice(0,19)} · seller=${l.seller_id?.slice(0,8)} · ${l.title}`);
