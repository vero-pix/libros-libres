/**
 * Backfill de language para books existentes.
 * Heurística: caracteres ä/ö/ü/ß, palabras alemanas, autores conocidos.
 * Para detección precisa usa Open Library ISBN lookup cuando hay isbn.
 *
 * Usage:
 *   node scripts/backfill_book_language.mjs           # dry-run
 *   node scripts/backfill_book_language.mjs --fix     # aplica cambios
 *
 * Requiere que la migración 20260415_add_book_language.sql esté aplicada.
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";

const envPath = resolve(process.cwd(), ".env.local");
for (const line of readFileSync(envPath, "utf-8").split("\n")) {
  if (line.startsWith("#") || !line.includes("=")) continue;
  const i = line.indexOf("=");
  const k = line.slice(0, i).trim();
  if (!process.env[k]) process.env[k] = line.slice(i + 1).trim();
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
const fix = process.argv.includes("--fix");

function heuristic(title, author) {
  const t = `${title ?? ""} ${author ?? ""}`.toLowerCase();
  if (/[äöüß]/.test(t)) return "de";
  if (/\b(der|die|das|und|ein|eine|für|nicht|mit|ist|sich|auf|dem|den|wenn|wir|ich)\b/.test(t)) return "de";
  if (/\bfrisch\b|\bkafka\b|\bhesse\b|\bgrass\b|\bthomas mann\b/.test(t)) return "de";
  if (/[àâçéèêëîïôûùüÿœæ]/.test(t) && /\b(le|la|les|des|une|pour|avec|dans|être|sur)\b/.test(t)) return "fr";
  if (/\b(the|and|of|in|with|for|is|are|to|from)\b/.test(t) && !/\b(el|la|los|las|de|en|con|para|por|que|del|una|uno)\b/.test(t)) return "en";
  return "es";
}

async function fromOpenLibrary(isbn) {
  if (!isbn) return null;
  const clean = isbn.replace(/[-\s]/g, "");
  try {
    const res = await fetch(`https://openlibrary.org/api/books?bibkeys=ISBN:${clean}&jscmd=data&format=json`);
    const data = await res.json();
    const book = data[`ISBN:${clean}`];
    const lang = book?.languages?.[0]?.key; // "/languages/spa"
    if (!lang) return null;
    const code = lang.split("/").pop();
    return { spa: "es", eng: "en", ger: "de", fre: "fr", ita: "it", por: "pt" }[code] ?? null;
  } catch {
    return null;
  }
}

const { data: books, error } = await supabase
  .from("books")
  .select("id, title, author, isbn, language");

if (error) { console.error(error); process.exit(1); }

let changed = 0;
const counts = {};
for (const b of books) {
  const current = b.language ?? "es";
  let detected = await fromOpenLibrary(b.isbn);
  if (!detected) detected = heuristic(b.title, b.author);
  counts[detected] = (counts[detected] ?? 0) + 1;
  if (detected !== current) {
    changed++;
    console.log(`${b.title?.slice(0, 50)} [${b.author?.slice(0, 25)}] → ${detected}`);
    if (fix) {
      await supabase.from("books").update({ language: detected }).eq("id", b.id);
    }
  }
}

console.log(`\nTotal: ${books.length} libros. A cambiar: ${changed}. Distribución:`, counts);
if (!fix) console.log("\n(dry-run) Correr con --fix para aplicar.");
