/**
 * Audita y enriquece listings existentes del vendedor Vero.
 * Busca libros sin descripción, portada o categoría y los completa
 * desde Google Books API.
 *
 * Usage:
 *   npx tsx scripts/enrich-listings.ts          # solo auditar (dry-run)
 *   npx tsx scripts/enrich-listings.ts --fix     # auditar y corregir
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";

const envPath = resolve(process.cwd(), ".env.local");
const envContent = readFileSync(envPath, "utf-8");
for (const line of envContent.split("\n")) {
  if (line.startsWith("#") || !line.includes("=")) continue;
  const idx = line.indexOf("=");
  const key = line.slice(0, idx).trim();
  const val = line.slice(idx + 1).trim();
  if (!process.env[key]) process.env[key] = val;
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const SELLER_ID = "2201d163-4423-4971-91f0-f6cebd00d1bd";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function fetchFromOpenLibrary(isbn: string | null, title: string, author: string) {
  // Try Open Library by ISBN
  if (isbn) {
    try {
      const clean = isbn.replace(/[-\s]/g, "");
      const res = await fetch(`https://openlibrary.org/isbn/${clean}.json`);
      if (res.ok) {
        const data = await res.json();
        let description = null;
        if (data.description) {
          description = typeof data.description === "string" ? data.description : data.description.value;
        }
        // If no description on edition, try the work
        if (!description && data.works?.[0]?.key) {
          const workRes = await fetch(`https://openlibrary.org${data.works[0].key}.json`);
          if (workRes.ok) {
            const work = await workRes.json();
            if (work.description) {
              description = typeof work.description === "string" ? work.description : work.description.value;
            }
          }
        }
        const cover = data.covers?.[0] ? `https://covers.openlibrary.org/b/id/${data.covers[0]}-L.jpg` : null;
        const subjects = data.subjects ?? [];
        return {
          description,
          cover_url: cover,
          genre: subjects[0] ?? null,
          published_year: data.publish_date ? parseInt(data.publish_date) || null : null,
        };
      }
    } catch { /* continue */ }
  }

  // Fallback: search by title+author
  try {
    const q = encodeURIComponent(`${title} ${author}`);
    const res = await fetch(`https://openlibrary.org/search.json?q=${q}&limit=1`);
    if (res.ok) {
      const data = await res.json();
      if (data.docs?.length) {
        const doc = data.docs[0];
        // Get description from work key
        let description = null;
        if (doc.key) {
          const workRes = await fetch(`https://openlibrary.org${doc.key}.json`);
          if (workRes.ok) {
            const work = await workRes.json();
            if (work.description) {
              description = typeof work.description === "string" ? work.description : work.description.value;
            }
          }
        }
        const cover = doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg` : null;
        return {
          description,
          cover_url: cover,
          genre: doc.subject?.[0] ?? null,
          published_year: doc.first_publish_year ?? null,
        };
      }
    }
  } catch { /* ignore */ }

  return null;
}

async function main() {
  const fix = process.argv.includes("--fix");

  // Get all Vero's listings with book data
  const { data: listings, error } = await supabase
    .from("listings")
    .select("id, cover_image_url, book:books(id, title, author, isbn, description, cover_url, genre, published_year)")
    .eq("seller_id", SELLER_ID)
    .eq("status", "active");

  if (error || !listings) {
    console.error("Error fetching listings:", error?.message);
    process.exit(1);
  }

  console.log(`Total listings activos de Vero: ${listings.length}\n`);

  let missingDesc = 0;
  let missingCover = 0;
  let missingGenre = 0;
  let enriched = 0;

  for (const listing of listings) {
    const book = listing.book as any;
    if (!book) continue;

    const issues: string[] = [];
    if (!book.description) issues.push("sin descripcion");
    if (!book.cover_url && !listing.cover_image_url) issues.push("sin portada");
    if (!book.genre) issues.push("sin categoria");

    if (!book.description) missingDesc++;
    if (!book.cover_url && !listing.cover_image_url) missingCover++;
    if (!book.genre) missingGenre++;

    if (issues.length === 0) continue;

    console.log(`  ! ${book.title} — ${book.author}: ${issues.join(", ")}`);

    if (fix) {
      const meta = await fetchFromOpenLibrary(book.isbn, book.title, book.author);
      if (!meta) {
        console.log(`    No se encontraron datos en Google Books`);
        continue;
      }

      const bookUpdate: Record<string, unknown> = {};
      const listingUpdate: Record<string, unknown> = {};

      if (!book.description && meta.description) bookUpdate.description = meta.description;
      if (!book.cover_url && meta.cover_url) bookUpdate.cover_url = meta.cover_url;
      if (!book.genre && meta.genre) bookUpdate.genre = meta.genre;
      if (!book.published_year && meta.published_year) bookUpdate.published_year = meta.published_year;
      if (!listing.cover_image_url && meta.cover_url) listingUpdate.cover_image_url = meta.cover_url;

      if (Object.keys(bookUpdate).length > 0) {
        const { error: bErr } = await supabase.from("books").update(bookUpdate).eq("id", book.id);
        if (bErr) console.error(`    Error book: ${bErr.message}`);
      }
      if (Object.keys(listingUpdate).length > 0) {
        const { error: lErr } = await supabase.from("listings").update(listingUpdate).eq("id", listing.id);
        if (lErr) console.error(`    Error listing: ${lErr.message}`);
      }

      if (Object.keys(bookUpdate).length > 0 || Object.keys(listingUpdate).length > 0) {
        console.log(`    ✓ Enriquecido: ${Object.keys({ ...bookUpdate, ...listingUpdate }).join(", ")}`);
        enriched++;
      }

      // Rate limit: 100ms between requests
      await new Promise((r) => setTimeout(r, 100));
    }
  }

  console.log(`\n--- Resumen ---`);
  console.log(`Sin descripcion: ${missingDesc}`);
  console.log(`Sin portada:     ${missingCover}`);
  console.log(`Sin categoria:   ${missingGenre}`);
  if (fix) console.log(`Enriquecidos:    ${enriched}`);
  if (!fix && (missingDesc + missingCover + missingGenre > 0)) {
    console.log(`\nEjecuta con --fix para corregir automaticamente.`);
  }
}

main();
