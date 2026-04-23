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

const candidates = JSON.parse(fs.readFileSync("/tmp/collectible_candidates.json", "utf-8"));
const ids = candidates.map((c) => c.id);

console.log(`Marcando ${ids.length} listings como is_collectible=true...`);

const { error } = await s
  .from("listings")
  .update({ is_collectible: true })
  .in("id", ids);

if (error) {
  console.error("❌ Error:", error);
  process.exit(1);
}

// Confirmar estado final
const { data: final } = await s
  .from("listings")
  .select("id, book:books(title, author)")
  .eq("is_collectible", true)
  .in("status", ["active", "completed"]);

console.log(`\n✅ Total coleccionables ahora: ${final?.length}`);
console.log(`\nMuestra de los primeros 10:`);
for (const l of (final ?? []).slice(0, 10)) {
  console.log(`  ${l.id.slice(0, 8)}  "${l.book?.title}" — ${l.book?.author}`);
}
