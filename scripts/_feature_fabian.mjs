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

const { data: fab } = await s.from("users")
  .select("id, full_name, username, featured")
  .eq("email", "fabignasagredo89@gmail.com").maybeSingle();

if (!fab) { console.log("❌ no encontrado"); process.exit(1); }
if (fab.featured) { console.log("✓ ya estaba destacado"); }
else {
  const { error } = await s.from("users").update({ featured: true }).eq("id", fab.id);
  console.log(error ? `⚠️ ${error.message}` : `✅ ${fab.full_name} (@${fab.username}) → featured=true`);
}

const { data: feats } = await s.from("users").select("full_name, username").eq("featured", true).order("full_name");
console.log(`\nDestacados ahora (${feats?.length}):`);
for (const f of feats ?? []) console.log(`  • ${f.full_name} (@${f.username ?? "—"})`);
