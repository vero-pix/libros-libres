import { createClient } from "@supabase/supabase-js";
import fs from "fs";
const env = fs.readFileSync(".env.local", "utf-8");
for (const line of env.split("\n")) {
  if (line.startsWith("#") || !line.includes("=")) continue;
  const idx = line.indexOf("="); const k = line.slice(0, idx).trim();
  if (!process.env[k]) process.env[k] = line.slice(idx + 1).trim();
}
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const VERO = "2201d163";

// 1. Cuántos libros tiene Vero publicados/activos y cuántos con descuento ya
const { data: mine } = await s.from("listings")
  .select("id, price, original_price, status, is_collectible, book:books(title)")
  .like("seller_id", VERO + "%");
const active = (mine??[]).filter(l => l.status === "active" || l.status === "available" || !l.status);
const withDisc = active.filter(l => l.original_price && l.original_price > l.price);
console.log(`VERO listings total=${mine?.length} | activos=${active.length} | con descuento=${withDisc.length}`);
console.log("Status distintos:", [...new Set((mine??[]).map(l=>l.status))]);
const prices = active.map(l=>l.price).filter(Boolean);
console.log(`Precio activo: min=${Math.min(...prices)} max=${Math.max(...prices)} suma=${prices.reduce((a,b)=>a+b,0)}`);

// 2. Escolares / infantil — para foco vacaciones
const { data: cats } = await s.from("categories").select("id, name, slug").or("slug.ilike.%escolar%,slug.ilike.%infant%,name.ilike.%escolar%,name.ilike.%infant%,name.ilike.%niñ%");
console.log("\nCategorías escolar/infantil:", cats);

// 3. discount_codes existentes
const { data: codes } = await s.from("discount_codes").select("code, discount_pct, active, expires_at, uses_count, max_uses");
console.log("\ndiscount_codes:", codes);
