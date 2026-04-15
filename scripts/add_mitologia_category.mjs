import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const env = fs.readFileSync(".env.local", "utf-8");
for (const line of env.split("\n")) {
  if (line.startsWith("#") || !line.includes("=")) continue;
  const idx = line.indexOf("=");
  const k = line.slice(0, idx).trim();
  if (!process.env[k]) process.env[k] = line.slice(idx + 1).trim();
}

const s = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Ver qué columnas tiene categories
const { data: existing } = await s
  .from("categories")
  .select("*")
  .eq("parent_slug", "ficcion")
  .order("sort_order", { ascending: true });

console.log("Subcategorías actuales de Ficción:");
for (const c of existing ?? []) {
  console.log(`  ${c.sort_order ?? "?"} · ${c.slug.padEnd(20)} ${c.name}`);
}

const maxSort =
  (existing ?? []).reduce((m, c) => Math.max(m, c.sort_order ?? 0), 0) + 1;

const { data: inserted, error } = await s
  .from("categories")
  .upsert(
    {
      slug: "mitologia",
      name: "Mitología",
      parent_slug: "ficcion",
      sort_order: maxSort,
    },
    { onConflict: "slug" }
  )
  .select()
  .single();

if (error) {
  console.error("ERROR:", error);
  process.exit(1);
}

console.log("\n✓ Categoría creada/actualizada:", inserted);
