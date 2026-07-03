import { createClient } from "@supabase/supabase-js";
import fs from "fs";
const env = fs.readFileSync(".env.local", "utf-8");
for (const line of env.split("\n")) {
  if (line.startsWith("#") || !line.includes("=")) continue;
  const idx = line.indexOf("="); const k = line.slice(0, idx).trim();
  if (!process.env[k]) process.env[k] = line.slice(idx + 1).trim();
}
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const ids = ["b112fd2d", "2094150a"]; // Ayer + Vidas Paralelas Tomo II (prefijos)
const { data: all } = await s.from("listings").select("id, is_collectible, book:books(title)").eq("is_collectible", true);
const targets = (all??[]).filter(l => ids.some(p => l.id.startsWith(p)));
for (const t of targets) {
  const { error } = await s.from("listings").update({ is_collectible: false }).eq("id", t.id);
  console.log(error ? `⚠️ ${t.book?.title}: ${error.message}` : `✅ "${t.book?.title}" → fuera de coleccionables`);
}
