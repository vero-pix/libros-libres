/**
 * Backfill de tags para libros sin tags asignados.
 * Corre suggestTags() sobre todos los books con tags vacío o null
 * y actualiza la BD.
 */

import { createClient } from "@supabase/supabase-js";
import fs from "fs";

// Cargar .env.local
const env = fs.readFileSync(".env.local", "utf-8");
for (const line of env.split("\n")) {
  if (line.startsWith("#") || !line.includes("=")) continue;
  const idx = line.indexOf("=");
  const k = line.slice(0, idx).trim();
  if (!process.env[k]) process.env[k] = line.slice(idx + 1).trim();
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ── suggestTags inline (copia de lib/tagSuggester.ts) ────────────────────────

const CLASSIC_AUTHORS = new Set([
  "kafka", "tolstoi", "dostoyevski", "dostoievski", "dostoevsky",
  "shakespeare", "neruda", "garcia marquez", "marquez", "cortazar",
  "borges", "cervantes", "homer", "homero", "dante", "virgilio",
  "dickens", "austen", "wilde", "poe", "twain", "melville",
  "flaubert", "balzac", "zola", "proust", "joyce", "woolf",
  "hemingway", "faulkner", "steinbeck", "orwell", "huxley",
  "camus", "sartre", "beckett", "mann", "hesse", "rilke",
  "mistral", "vallejo", "carpentier", "rulfo", "fuentes",
  "vargas llosa", "allende", "donoso", "bolano", "onetti",
  "quiroga", "arlt", "sabato", "bioy casares", "benedetti",
  "galeano", "lispector", "amado", "asturias", "roa bastos",
  "garcia lorca", "machado", "unamuno", "pessoa",
  "tolstoy", "chekhov", "chejov", "pushkin", "gogol",
  "durrenmatt", "meyrink", "hamsun", "strindberg",
]);

const VALID_TAGS = new Set([
  "BibliotecaDeBabel", "Borges", "Clasico", "Filosofia", "Cuentos",
  "Coleccionable", "PrimeraEdicion", "EdicionLimitada", "NovelaChilena",
  "LatinoamericanoEsencial", "PremioNobel", "Poesia", "Teatro",
  "CienciaFiccion", "NovelaNegra", "NovelaHistorica", "Ensayo",
  "Autoayuda", "Espiritualidad", "Historia", "Ciencia", "Arte",
  "Biografia", "Politica", "Negocios", "Infantil", "Juvenil",
  "Suspenso", "Humanidades", "Comics", "Novela y Ficción"
]);

function norm(s) {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();
}

function suggestTags(book) {
  const tags = new Set();
  const title = norm(book.title ?? "");
  const author = norm(book.author ?? "");
  const desc = norm(book.description ?? "");
  const text = `${title} ${author} ${desc}`;

  if (title.includes("babel") || text.includes("biblioteca de babel")) {
    tags.add("BibliotecaDeBabel");
    tags.add("Coleccionable");
  }
  if (author.includes("borges")) {
    tags.add("Borges");
    tags.add("Clasico");
  }
  for (const a of CLASSIC_AUTHORS) {
    if (author.includes(a)) { tags.add("Clasico"); break; }
  }
  if (book.category === "coleccionables") tags.add("Coleccionable");
  const sub = book.subcategory;
  if (sub === "ficcion-poesia")               { tags.add("Poesia"); }
  if (sub === "ficcion-policial")             { tags.add("NovelaNegra"); tags.add("Suspenso"); }
  if (sub === "ficcion-teatro")               { tags.add("Teatro"); }
  if (sub === "no-ficcion-biografia")         { tags.add("Biografia"); }
  if (sub === "no-ficcion-historia")          { tags.add("Historia"); }
  if (sub === "ficcion-novela")               { tags.add("Novela y Ficción"); }
  if (sub === "no-ficcion-ensayo")            { tags.add("Ensayo"); }
  if (sub === "no-ficcion-humanidades")       { tags.add("Humanidades"); }
  if (sub === "infantil-juvenil-infantil")    { tags.add("Infantil"); }
  if (sub === "infantil-juvenil-juvenil")     { tags.add("Juvenil"); }
  if (sub === "otros-comics")                 { tags.add("Comics"); }

  if (text.includes("poesia") || text.includes("poema") || text.includes("versos")) tags.add("Poesia");
  if (text.includes("teatro") || text.includes("obra dramatica")) tags.add("Teatro");
  if (text.includes("premio nobel")) tags.add("PremioNobel");
  if (text.includes("suspenso") || text.includes("thriller") || text.includes("crimen")) tags.add("Suspenso");
  if (text.includes("misterio") || text.includes("detective") || text.includes("policial")) tags.add("NovelaNegra");

  return Array.from(tags).filter(t => VALID_TAGS.has(t)).slice(0, 8);
}

// ── Main ─────────────────────────────────────────────────────────────────────

console.log("Fetching books...");
const { data: books, error } = await supabase
  .from("books")
  .select("id, title, author, category, subcategory, description, tags");

if (error) { console.error("Error:", error); process.exit(1); }

const toUpdate = books; // re-procesar todos para corregir slugs viejos
const alreadyTagged = books.filter(b => b.tags?.length > 0).length;

console.log(`Total books: ${books.length}`);
console.log(`Ya tienen tags: ${alreadyTagged}`);
console.log(`Sin tags (a procesar): ${toUpdate.length}`);

if (toUpdate.length === 0) {
  console.log("Nada que actualizar.");
  process.exit(0);
}

let updated = 0;
let skipped = 0;
const tagStats = {};

for (const book of toUpdate) {
  const tags = suggestTags(book);
  if (tags.length === 0) { skipped++; continue; }

  const { error: updateErr } = await supabase
    .from("books")
    .update({ tags })
    .eq("id", book.id);

  if (updateErr) {
    console.error(`Error updating ${book.id}:`, updateErr.message);
  } else {
    updated++;
    tags.forEach(t => { tagStats[t] = (tagStats[t] ?? 0) + 1; });
  }
}

console.log(`\n✅ Actualizados: ${updated}`);
console.log(`⏭  Sin tags calculables: ${skipped}`);
console.log("\nDistribución de tags asignados:");
Object.entries(tagStats)
  .sort((a, b) => b[1] - a[1])
  .forEach(([tag, count]) => console.log(`  ${tag}: ${count}`));
