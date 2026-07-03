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

const VERO = "2201d163";

// Candidatos featured; filtramos por seller vero + título
const { data: hits, error } = await s
  .from("listings")
  .select("id, featured, featured_rank, seller_id, book:books(title, author)")
  .eq("featured", true);

if (error) { console.log("⚠️", error.message); process.exit(1); }

console.log("Destacados de Vero:");
const mine = (hits ?? []).filter((h) => h.seller_id?.startsWith(VERO));
for (const h of mine) {
  console.log(`  [${h.id.slice(0,8)}] "${h.book?.title}" — ${h.book?.author} rank=${h.featured_rank}`);
}

const targets = mine.filter(
  (h) => /^Ayer\b/i.test(h.book?.title ?? "") || /Vidas Paralelas/i.test(h.book?.title ?? "")
).map((h) => ({ id: h.id, title: h.book?.title }));

if (!targets.length) { console.log("\nNo hay targets que coincidan."); process.exit(0); }

console.log(`\nQuitando del destacado (${targets.length}):`);
for (const t of targets) {
  const { error: e } = await s
    .from("listings")
    .update({ featured: false, featured_rank: null })
    .eq("id", t.id);
  console.log(e ? `  ⚠️ ${t.title}: ${e.message}` : `  ✅ "${t.title}" → featured=false`);
}
