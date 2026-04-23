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

// Ver columnas de books
const { data: sample } = await s.from("books").select("*").limit(1);
console.log("Columnas books:", Object.keys(sample?.[0] ?? {}).join(", "), "\n");

// Marcados actualmente
const { data: current } = await s
  .from("listings")
  .select("id, price, slug, book:books(title, author)")
  .eq("is_collectible", true)
  .in("status", ["active", "completed"]);

console.log(`─── Actualmente is_collectible=true: ${current?.length} ───`);
for (const l of current ?? []) {
  console.log(`  ${l.id.slice(0, 8)}  $${l.price}  "${l.book?.title}" — ${l.book?.author}`);
}

// Candidatos del seller TusLibros
const collectibleAuthors = [
  "parra", "de rokha", "emar", "mistral", "huidobro",
  "casanueva", "anguita", "lihn", "prado", "ibáñez",
  "simenon", "maigret", // Maigret Luis de Caralt
];

const collectibleKeywords = [
  "nascimento", "zig-zag", "luis de caralt", "pomaire",
  "francisco de aguirre", "biblioteca de babel", "cormoran",
  "primera edición", "primera edicion",
];

const { data: all } = await s
  .from("listings")
  .select("id, price, is_collectible, slug, notes, book:books(title, author)")
  .in("status", ["active", "completed"])
  .eq("seller_id", "2201d163-4423-4971-91f0-f6cebd00d1bd");

const candidates = [];
for (const l of all ?? []) {
  if (l.is_collectible) continue;
  const author = (l.book?.author ?? "").toLowerCase();
  const title = (l.book?.title ?? "").toLowerCase();
  const notes = (l.notes ?? "").toLowerCase();

  const authorMatch = collectibleAuthors.find((a) => author.includes(a) || title.includes(a));
  const keywordMatch = collectibleKeywords.find((k) => notes.includes(k) || title.includes(k));

  if (authorMatch || keywordMatch) {
    candidates.push({ ...l, reason: authorMatch ? `autor: ${authorMatch}` : `keyword: ${keywordMatch}` });
  }
}

console.log(`\n─── Candidatos a marcar is_collectible: ${candidates.length} ───\n`);
for (const c of candidates) {
  console.log(`  ${c.id.slice(0, 8)}  $${c.price}  "${c.book?.title}" — ${c.book?.author}  (${c.reason})`);
}

fs.writeFileSync("/tmp/collectible_candidates.json", JSON.stringify(candidates, null, 2));
console.log(`\nGuardados ${candidates.length} candidatos en /tmp/collectible_candidates.json`);
