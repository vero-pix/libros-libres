import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import { resolve } from "path";

const envPath = resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const c = fs.readFileSync(envPath, "utf-8");
  for (const line of c.split("\n")) {
    if (line.startsWith("#") || !line.includes("=")) continue;
    const idx = line.indexOf("=");
    const k = line.slice(0, idx).trim();
    if (!process.env[k]) process.env[k] = line.slice(idx + 1).trim();
  }
}

const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const { data: featured } = await s
  .from("listings")
  .select("id, featured, featured_rank, is_collectible, book:books(title, author)")
  .eq("featured", true)
  .order("featured_rank", { ascending: true });

console.log(`\n★ FEATURED (${featured?.length ?? 0}):`);
(featured || []).forEach((l) => {
  const col = l.is_collectible ? " [COLECCIÓN]" : "";
  console.log(`  ${l.featured_rank ?? "?"}. ${l.book?.title} — ${l.book?.author}${col}`);
});

const { data: collectibles } = await s
  .from("listings")
  .select("id, book:books(title, author)")
  .eq("is_collectible", true);

console.log(`\n◆ COLECCIONABLES (${collectibles?.length ?? 0}):`);
(collectibles || []).forEach((l) => {
  console.log(`  • ${l.book?.title} — ${l.book?.author}`);
});
