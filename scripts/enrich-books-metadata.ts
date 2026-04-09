/**
 * Enriquece libros existentes con editorial y páginas desde Google Books API.
 * Solo actualiza libros que tienen ISBN y les falta publisher o pages.
 *
 * Usage:
 *   npx tsx scripts/enrich-books-metadata.ts          # dry-run
 *   npx tsx scripts/enrich-books-metadata.ts --fix     # aplicar cambios
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";

const envPath = resolve(process.cwd(), ".env.local");
const envContent = readFileSync(envPath, "utf-8");
for (const line of envContent.split("\n")) {
  if (line.startsWith("#") || !line.includes("=")) continue;
  const idx = line.indexOf("=");
  if (!process.env[line.slice(0, idx).trim()]) process.env[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const fix = process.argv.includes("--fix");
const apiKey = process.env.GOOGLE_BOOKS_API_KEY;

async function fetchMeta(isbn: string, title: string, author: string) {
  const clean = isbn.replace(/[-\s]/g, "");

  for (const query of [`isbn:${clean}`, `${title} ${author}`]) {
    try {
      const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=1${apiKey ? `&key=${apiKey}` : ""}`;
      const res = await fetch(url);
      if (!res.ok) continue;
      const data = await res.json();
      if (!data.items?.length) continue;

      const v = data.items[0].volumeInfo;
      if (v.publisher || v.pageCount) {
        return {
          publisher: v.publisher ?? null,
          pages: v.pageCount ?? null,
        };
      }
    } catch { continue; }
  }
  return null;
}

async function main() {
  const { data: books } = await supabase
    .from("books")
    .select("id, isbn, title, author, publisher, pages")
    .not("isbn", "is", null);

  if (!books) { console.error("No books found"); return; }

  const needsEnrich = books.filter(b => !b.publisher || !b.pages);
  console.log(`Total con ISBN: ${books.length}`);
  console.log(`Sin editorial o páginas: ${needsEnrich.length}\n`);

  let enriched = 0;
  let notFound = 0;

  for (const book of needsEnrich) {
    console.log(`  ${book.title} — ${book.author}...`);
    const meta = await fetchMeta(book.isbn!, book.title, book.author);

    if (meta) {
      const updates: Record<string, unknown> = {};
      if (!book.publisher && meta.publisher) updates.publisher = meta.publisher;
      if (!book.pages && meta.pages) updates.pages = meta.pages;

      if (Object.keys(updates).length > 0) {
        console.log(`    ✓ ${Object.entries(updates).map(([k, v]) => `${k}: ${v}`).join(", ")}`);
        if (fix) {
          await supabase.from("books").update(updates).eq("id", book.id);
        }
        enriched++;
      } else {
        console.log(`    — Ya completo`);
      }
    } else {
      console.log(`    ✗ Sin datos`);
      notFound++;
    }

    await new Promise(r => setTimeout(r, 200));
  }

  console.log(`\n--- Resumen ---`);
  console.log(`${fix ? "Enriquecidos" : "Encontrados"}: ${enriched}`);
  console.log(`Sin datos disponibles: ${notFound}`);
  if (!fix && enriched > 0) console.log(`\nEjecuta con --fix para aplicar.`);
}

main();
