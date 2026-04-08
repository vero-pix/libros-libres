/**
 * Carga masiva desde CSV con formato:
 * num,titulo,autor,isbn,condicion,tipo,descripcion,cover_openlibrary,cover_google,year,pages,categoria
 *
 * Auto-completa sinopsis, portada, género y año desde Google Books API
 * cuando el CSV no los trae.
 *
 * Usage:
 *   npx tsx scripts/bulk-upload-csv.ts docs/carga_masiva_libros.csv
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";

// Load .env.local manually
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
// CLI overrides: npx tsx scripts/bulk-upload-csv.ts file.csv --price 6500 --notes "Sin marcas de uso"
const priceIdx = process.argv.indexOf("--price");
const DEFAULT_PRICE = priceIdx > -1 ? parseInt(process.argv[priceIdx + 1], 10) : 5000;
const notesIdx = process.argv.indexOf("--notes");
const DEFAULT_NOTES = notesIdx > -1 ? process.argv[notesIdx + 1] : null;
const SELLER_LAT = -33.4489;
const SELLER_LNG = -70.6693;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

interface BookMeta {
  description: string | null;
  cover_url: string | null;
  genre: string | null;
  published_year: number | null;
}

async function fetchBookMeta(isbn: string, title: string, author: string): Promise<BookMeta> {
  const clean = isbn.replace(/[-\s]/g, "");
  const apiKey = process.env.GOOGLE_BOOKS_API_KEY;

  // Try by ISBN first
  for (const query of [`isbn:${clean}`, `${title} ${author}`]) {
    try {
      const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=1${apiKey ? `&key=${apiKey}` : ""}`;
      const res = await fetch(url);
      if (!res.ok) continue;
      const data = await res.json();
      if (!data.items?.length) continue;

      const v = data.items[0].volumeInfo;
      const cover = v.imageLinks?.thumbnail?.replace("http://", "https://") ?? null;
      const desc = v.description ?? null;

      if (desc || cover) {
        return {
          description: desc,
          cover_url: cover,
          genre: v.categories?.[0] ?? null,
          published_year: v.publishedDate ? parseInt(v.publishedDate.substring(0, 4)) : null,
        };
      }
    } catch { /* continue to next query */ }
  }

  return { description: null, cover_url: null, genre: null, published_year: null };
}

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;
  for (const ch of line) {
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      fields.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  fields.push(current.trim());
  return fields;
}

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error("Usage: npx tsx scripts/bulk-upload-csv.ts <csv-file>");
    process.exit(1);
  }

  const csv = readFileSync(filePath, "utf-8");
  const lines = csv.split("\n").filter((l) => l.trim());
  const header = parseCsvLine(lines[0]);

  let created = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 1; i < lines.length; i++) {
    const vals = parseCsvLine(lines[i]);
    const row: Record<string, string> = {};
    header.forEach((h, idx) => { row[h] = vals[idx] ?? ""; });

    const title = row.titulo;
    const author = row.autor;
    const isbn = row.isbn;
    let description = row.descripcion || null;
    let coverUrl = row.cover_google || row.cover_openlibrary || null;
    let genre = row.categoria || null;
    let year = row.year ? parseInt(row.year, 10) || null : null;
    const condition = row.condicion === "buen_estado" ? "good" : row.condicion || "good";
    const modality = row.tipo === "venta" ? "sale" : row.tipo === "both" ? "both" : row.tipo || "sale";
    const rowPrice = row.precio ? parseInt(row.precio, 10) : DEFAULT_PRICE;
    const rentalPrice = modality !== "sale" ? Math.round(rowPrice * 0.4) : null;

    if (!title || !author) {
      console.log(`  Skip row ${i}: missing title/author`);
      skipped++;
      continue;
    }

    // Auto-complete missing data from Google Books
    if (isbn && (!description || !coverUrl || !genre || !year)) {
      console.log(`  Buscando datos de "${title}"...`);
      const meta = await fetchBookMeta(isbn, title, author);
      if (!description && meta.description) description = meta.description;
      if (!coverUrl && meta.cover_url) coverUrl = meta.cover_url;
      if (!genre && meta.genre) genre = meta.genre;
      if (!year && meta.published_year) year = meta.published_year;
    }
    genre = genre || "Literatura";

    // Check if book with this ISBN already exists
    let bookId: string;
    if (isbn) {
      const { data: existing } = await supabase
        .from("books")
        .select("id")
        .eq("isbn", isbn)
        .maybeSingle();

      if (existing) {
        // Check if listing already exists for this book + seller
        const { data: existingListing } = await supabase
          .from("listings")
          .select("id")
          .eq("book_id", existing.id)
          .eq("seller_id", SELLER_ID)
          .maybeSingle();

        if (existingListing) {
          console.log(`  Skip: "${title}" ya existe`);
          skipped++;
          continue;
        }
        bookId = existing.id;
      } else {
        const { data: newBook, error: bookErr } = await supabase
          .from("books")
          .insert({
            title,
            author,
            isbn,
            description,
            cover_url: coverUrl,
            genre,
            published_year: year,
            created_by: SELLER_ID,
          })
          .select("id")
          .single();

        if (bookErr || !newBook) {
          console.error(`  Error book "${title}": ${bookErr?.message}`);
          failed++;
          continue;
        }
        bookId = newBook.id;
      }
    } else {
      const { data: newBook, error: bookErr } = await supabase
        .from("books")
        .insert({
          title,
          author,
          description,
          cover_url: coverUrl,
          genre,
          published_year: year,
          created_by: SELLER_ID,
        })
        .select("id")
        .single();

      if (bookErr || !newBook) {
        console.error(`  Error book "${title}": ${bookErr?.message}`);
        failed++;
        continue;
      }
      bookId = newBook.id;
    }

    // Create listing
    const { error: listErr } = await supabase.from("listings").insert({
      book_id: bookId,
      seller_id: SELLER_ID,
      price: rowPrice,
      condition,
      modality,
      rental_price: rentalPrice,
      notes: DEFAULT_NOTES,
      cover_image_url: coverUrl,
      latitude: SELLER_LAT,
      longitude: SELLER_LNG,
      address: "Santiago, Chile",
      status: "active",
    });

    if (listErr) {
      console.error(`  Error listing "${title}": ${listErr.message}`);
      failed++;
      continue;
    }

    created++;
    console.log(`  ✓ ${title} — ${author}`);
  }

  console.log(`\nResultado: ${created} creados, ${skipped} omitidos, ${failed} fallidos`);
}

main();
