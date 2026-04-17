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

// Top 10 destacados — orden de aparición (rank 1 al 10)
const TOP10 = [
  { q: { title: "Poemas y Antipoemas", author: "Nicanor Parra" }, rank: 1 },
  { q: { title: "Donde van a morir los elefantes", author: "José Donoso" }, rank: 2 },
  { q: { title: "El Aleph", author: "Jorge Luis Borges" }, rank: 3 },
  { q: { title: "El General en su Laberinto", author: "Gabriel Garcia Marquez" }, rank: 4 },
  { q: { title: "Conversacion en la Catedral Vol. 1", author: "Mario Vargas Llosa" }, rank: 5 },
  { q: { title: "LA REGIÓN MÁS TRANSPARENTE", author: "Carlos Fuentes" }, rank: 6 },
  { q: { title: "El fantasma de Canterville y otros cuentos", author: "Oscar Wilde" }, rank: 7 },
  { q: { title: "La vida esta en otra parte", author: "Milan Kundera" }, rank: 8 },
  { q: { title: "La Letra E", author: "Augusto Monterroso" }, rank: 9 },
  { q: { title: "Libertad", author: "Jonathan Franzen" }, rank: 10 },
];

const { data: listings } = await s
  .from("listings")
  .select("id, featured, book:books(title, author)")
  .eq("status", "active");

function findMatch(entry) {
  const t = entry.q.title.toLowerCase();
  const a = entry.q.author.toLowerCase();
  return listings.find((l) =>
    (l.book?.title ?? "").toLowerCase() === t &&
    (l.book?.author ?? "").toLowerCase() === a
  );
}

const newFeatured = TOP10.map((entry) => {
  const m = findMatch(entry);
  return m ? { id: m.id, title: entry.q.title, rank: entry.rank } : { id: null, title: entry.q.title, rank: entry.rank };
});

const notFound = newFeatured.filter((x) => !x.id);
if (notFound.length) {
  console.error("NO ENCONTRADOS:", notFound);
  process.exit(1);
}

const newIds = new Set(newFeatured.map((x) => x.id));
const toUnfeature = listings.filter((l) => l.featured && !newIds.has(l.id));

let sql = `-- Top 10 destacados en home — orden controlado por featured_rank\n`;
sql += `alter table public.listings\n  add column if not exists featured_rank int;\n\n`;
sql += `-- Paso 1: limpiar featured actuales que no entran al top 10\n`;
sql += `update public.listings set featured = false, featured_rank = null where id in (\n`;
sql += toUnfeature.map((l) => `  '${l.id}' -- ${l.book?.title}`).join(",\n");
sql += `\n);\n\n`;
sql += `-- Paso 2: marcar los 10 destacados con rank\n`;
for (const { id, title, rank } of newFeatured) {
  sql += `update public.listings set featured = true, featured_rank = ${rank} where id = '${id}'; -- ${title}\n`;
}

fs.writeFileSync(resolve(process.cwd(), "supabase/migrations/20260416_featured_top10.sql"), sql);
console.log("SQL generado en supabase/migrations/20260416_featured_top10.sql");
console.log(`\nA desfeaturar: ${toUnfeature.length}`);
toUnfeature.forEach((l) => console.log(`  − ${l.book?.title} — ${l.book?.author}`));
console.log(`\nA featurar (con rank):`);
newFeatured.forEach((x) => console.log(`  ${x.rank}. ${x.title}`));
