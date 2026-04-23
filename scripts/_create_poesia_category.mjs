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

// 1. Crear categoría "poesia" (si no existe)
const { data: existing } = await s.from("categories").select("slug").eq("slug", "poesia").maybeSingle();
if (existing) {
  console.log("·  Categoría 'poesia' ya existe");
} else {
  const { error } = await s.from("categories").insert({
    slug: "poesia",
    name: "Poesía",
    parent_slug: null,
    sort_order: 5, // cerca de novela/cuentos
  });
  if (error) {
    console.error("❌ error creando categoría:", error.message);
    process.exit(1);
  }
  console.log("✅ Categoría 'Poesía' creada");
}

// 2. Buscar libros con títulos/autores de poesía y actualizar a category=poesia
const poetryPatterns = [
  { author: /neruda/i },
  { author: /de rokha/i },
  { author: /d[ií]az.casanueva/i },
  { author: /nicanor.parra|parra,.nicanor|^parra$/i },
  { author: /vicente.huidobro|huidobro/i },
  { author: /gabriela.mistral|^mistral$/i },
  { author: /enrique.lihn|lihn/i },
  { author: /ra[úu]l.zurita|zurita/i },
  { title: /antolog.a po.tica/i },
  { title: /elogio de la sombra/i },
  { title: /20 poemas de amor/i },
  { title: /poemas y antipoemas/i },
  { title: /residencia en la tierra/i },
  { title: /altazor/i },
  { title: /canto general/i },
];

// Traer todos los libros actuales
const { data: books } = await s
  .from("books")
  .select("id, title, author, category");

const updates = [];
for (const b of books ?? []) {
  if (b.category === "poesia") continue;
  const title = b.title ?? "";
  const author = b.author ?? "";
  const match = poetryPatterns.find((p) =>
    (p.title && p.title.test(title)) || (p.author && p.author.test(author))
  );
  if (match) {
    updates.push({ id: b.id, title, author, currentCat: b.category });
  }
}

console.log(`\n── ${updates.length} libros a mover a category=poesia ──`);
for (const u of updates) {
  console.log(`  ${u.id.slice(0, 8)}  "${u.title}" — ${u.author}  (era: ${u.currentCat ?? "sin"})`);
}

if (updates.length) {
  const { error } = await s
    .from("books")
    .update({ category: "poesia" })
    .in("id", updates.map((u) => u.id));
  if (error) console.error("❌ error:", error.message);
  else console.log(`\n✅ ${updates.length} libros reclasificados como Poesía`);
}
