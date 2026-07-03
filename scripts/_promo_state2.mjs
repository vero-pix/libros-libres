import { createClient } from "@supabase/supabase-js";
import fs from "fs";
const env = fs.readFileSync(".env.local", "utf-8");
for (const line of env.split("\n")) {
  if (line.startsWith("#") || !line.includes("=")) continue;
  const idx = line.indexOf("="); const k = line.slice(0, idx).trim();
  if (!process.env[k]) process.env[k] = line.slice(idx + 1).trim();
}
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const { data: u } = await s.from("users").select("id, username, full_name").eq("username", "vero").maybeSingle();
console.log("vero:", u);
const { data: mine, error } = await s.from("listings")
  .select("id, price, original_price, status, is_collectible, book:books(title)")
  .eq("seller_id", u.id);
if (error) console.log("ERR listings:", error.message);
const all = mine ?? [];
const byStatus = {};
for (const l of all) byStatus[l.status ?? "null"] = (byStatus[l.status ?? "null"]||0)+1;
console.log("total:", all.length, "por status:", byStatus);
const active = all.filter(l => l.status === "active");
const withDisc = active.filter(l => l.original_price && l.original_price > l.price);
const prices = active.map(l=>l.price).filter(Boolean);
console.log(`activos=${active.length} conDescuento=${withDisc.length} sumaPrecio=${prices.reduce((a,b)=>a+b,0)} min=${Math.min(...prices)} max=${Math.max(...prices)}`);

// categorías
const { data: cats } = await s.from("categories").select("id, name, slug");
console.log("\nCategorías:", (cats??[]).map(c=>c.slug).join(", "));
