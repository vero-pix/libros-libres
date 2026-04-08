/**
 * Busca portadas alternativas para listings sin cover funcional.
 * Intenta Google Books thumbnails y Open Library por cover ID.
 *
 * Usage:
 *   npx tsx scripts/fix-covers.ts          # dry-run
 *   npx tsx scripts/fix-covers.ts --fix    # aplicar cambios
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

async function findCover(isbn: string | null, title: string, author: string): Promise<string | null> {
  // Try Google Books thumbnail (doesn't need API key for thumbnails)
  if (isbn) {
    try {
      const url = `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}&maxResults=1`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const thumb = data.items?.[0]?.volumeInfo?.imageLinks?.thumbnail;
        if (thumb) {
          const coverUrl = thumb.replace("http://", "https://").replace("&edge=curl", "").replace("zoom=1", "zoom=2");
          // Verify it loads
          const check = await fetch(coverUrl, { method: "HEAD" });
          if (check.ok) return coverUrl;
        }
      }
    } catch { /* continue */ }
  }

  // Try Google Books by title+author
  try {
    const q = encodeURIComponent(`${title} ${author}`);
    const url = `https://www.googleapis.com/books/v1/volumes?q=${q}&maxResults=3`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      for (const item of data.items ?? []) {
        const thumb = item.volumeInfo?.imageLinks?.thumbnail;
        if (thumb) {
          const coverUrl = thumb.replace("http://", "https://").replace("&edge=curl", "").replace("zoom=1", "zoom=2");
          const check = await fetch(coverUrl, { method: "HEAD" });
          if (check.ok) return coverUrl;
        }
      }
    }
  } catch { /* continue */ }

  // Try Open Library search for cover
  if (isbn) {
    try {
      const res = await fetch(`https://openlibrary.org/isbn/${isbn}.json`);
      if (res.ok) {
        const data = await res.json();
        if (data.covers?.[0]) {
          const coverUrl = `https://covers.openlibrary.org/b/id/${data.covers[0]}-L.jpg`;
          const check = await fetch(coverUrl, { method: "HEAD" });
          if (check.ok) return coverUrl;
        }
      }
    } catch { /* continue */ }
  }

  return null;
}

async function main() {
  const { data: listings } = await supabase
    .from("listings")
    .select("id, cover_image_url, book:books(id, title, author, cover_url, isbn)")
    .eq("status", "active");

  if (!listings) { console.error("No listings found"); return; }

  // Find listings with no working cover
  const broken: typeof listings = [];
  for (const l of listings) {
    const book = l.book as any;
    const url = l.cover_image_url || book?.cover_url;
    if (!url) { broken.push(l); continue; }
    try {
      const res = await fetch(url, { method: "HEAD", redirect: "manual" });
      if (res.status !== 200) broken.push(l);
    } catch { broken.push(l); }
  }

  console.log(`Total activos: ${listings.length}`);
  console.log(`Sin portada funcional: ${broken.length}\n`);

  let fixed = 0;
  let notFound = 0;

  for (const l of broken) {
    const book = l.book as any;
    console.log(`  Buscando: ${book.title} — ${book.author}...`);

    const newCover = await findCover(book.isbn, book.title, book.author);

    if (newCover) {
      console.log(`    ✓ Encontrada`);
      if (fix) {
        await supabase.from("books").update({ cover_url: newCover }).eq("id", book.id);
        await supabase.from("listings").update({ cover_image_url: newCover }).eq("id", l.id);
      }
      fixed++;
    } else {
      console.log(`    ✗ No encontrada`);
      notFound++;
    }

    // Rate limit
    await new Promise(r => setTimeout(r, 200));
  }

  console.log(`\n--- Resumen ---`);
  console.log(`Portadas ${fix ? "arregladas" : "encontradas"}: ${fixed}`);
  console.log(`Sin portada disponible: ${notFound}`);
  if (!fix && fixed > 0) console.log(`\nEjecuta con --fix para aplicar los cambios.`);
}

main();
