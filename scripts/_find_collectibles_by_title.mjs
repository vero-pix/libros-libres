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

// Buscar Emar "Un Año" para ver qué columnas tiene
const { data, error } = await s
  .from("listings")
  .select("*, book:books(*)")
  .or("slug.eq.un-ano,slug.eq.ayer")
  .in("status", ["active", "completed"]);

if (error) {
  console.error(error);
  process.exit(1);
}

for (const l of data ?? []) {
  console.log(`── ${l.id.slice(0, 8)}  "${l.book?.title}" ──`);
  console.log(`  status: ${l.status}, is_collectible: ${l.is_collectible}, featured: ${l.featured}`);
  console.log(`  columnas:`, Object.keys(l).filter(k => k !== 'book').join(", "));
}
