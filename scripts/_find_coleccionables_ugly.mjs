import { createClient } from "@supabase/supabase-js";
import fs from "fs";
const env = fs.readFileSync(".env.local", "utf-8");
for (const line of env.split("\n")) {
  if (line.startsWith("#") || !line.includes("=")) continue;
  const idx = line.indexOf("="); const k = line.slice(0, idx).trim();
  if (!process.env[k]) process.env[k] = line.slice(idx + 1).trim();
}
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const { data } = await s.from("listings")
  .select("id, is_collectible, featured, seller_id, book:books(title, author)")
  .eq("is_collectible", true);
console.log(`Coleccionables (${data?.length}):`);
for (const h of (data??[])) {
  const t = h.book?.title ?? "";
  const flag = (/^Ayer\b/i.test(t) || /Vidas Paralelas/i.test(t)) ? " 👈" : "";
  console.log(`  [${h.id.slice(0,8)}] seller=${h.seller_id?.slice(0,8)} "${t}" — ${h.book?.author}${flag}`);
}
