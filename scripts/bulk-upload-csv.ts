/**
 * Carga masiva desde CSV con formato:
 * num,titulo,autor,isbn,condicion,tipo,descripcion,cover_openlibrary,cover_google,year,pages,categoria
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
const DEFAULT_PRICE = 5000;
const SELLER_LAT = -33.4489;
const SELLER_LNG = -70.6693;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

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
    const description = row.descripcion;
    const coverUrl = row.cover_google || row.cover_openlibrary || null;
    const genre = row.categoria || "Literatura";
    const year = row.year ? parseInt(row.year, 10) || null : null;
    const condition = row.condicion === "buen_estado" ? "good" : row.condicion || "good";
    const modality = row.tipo === "venta" ? "sale" : row.tipo || "sale";

    if (!title || !author) {
      console.log(`  Skip row ${i}: missing title/author`);
      skipped++;
      continue;
    }

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
      price: DEFAULT_PRICE,
      condition,
      modality,
      notes: null,
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
