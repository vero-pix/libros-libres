import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { createInterface } from "readline";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const SELLER_ID = process.env.SELLER_ID!;
const SELLER_LATITUDE = parseFloat(process.env.SELLER_LATITUDE ?? "-33.4489");
const SELLER_LONGITUDE = parseFloat(process.env.SELLER_LONGITUDE ?? "-70.6693");
const SELLER_CITY = process.env.SELLER_CITY ?? "Santiago";

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !SELLER_ID) {
  console.error(
    "Missing env vars. Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SELLER_ID"
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

interface CsvRow {
  isbn: string;
  title: string;
  author: string;
  genre: string;
  price: string;
  condition: string;
  modality: string;
  notes: string;
  rental_price: string;
  rental_deposit: string;
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

async function processRow(row: CsvRow): Promise<boolean> {
  try {
    // Upsert book by ISBN
    const { data: book, error: bookErr } = await supabase
      .from("books")
      .upsert(
        {
          isbn: row.isbn,
          title: row.title,
          author: row.author,
          genre: row.genre,
        },
        { onConflict: "isbn" }
      )
      .select("id")
      .single();

    if (bookErr || !book) {
      console.error(`  Error upserting book "${row.title}": ${bookErr?.message}`);
      return false;
    }

    const price = parseInt(row.price, 10) || null;
    const rentalPrice = parseInt(row.rental_price, 10) || null;
    const rentalDeposit = parseInt(row.rental_deposit, 10) || null;

    const { error: listingErr } = await supabase.from("listings").insert({
      book_id: book.id,
      seller_id: SELLER_ID,
      price,
      condition: row.condition || "good",
      modality: row.modality || "sell",
      notes: row.notes || null,
      rental_price: rentalPrice,
      rental_deposit: rentalDeposit,
      latitude: SELLER_LATITUDE,
      longitude: SELLER_LONGITUDE,
      city: SELLER_CITY,
      status: "active",
    });

    if (listingErr) {
      console.error(`  Error creating listing "${row.title}": ${listingErr.message}`);
      return false;
    }

    console.log(`Created: ${row.title} by ${row.author} ($${row.price})`);
    return true;
  } catch (err: any) {
    console.error(`  Error processing "${row.title}": ${err.message}`);
    return false;
  }
}

async function main() {
  const filePath = process.argv[2];
  let csvContent: string;

  if (filePath) {
    csvContent = readFileSync(filePath, "utf-8");
  } else {
    // Read from stdin
    const rl = createInterface({ input: process.stdin });
    const lines: string[] = [];
    for await (const line of rl) {
      lines.push(line);
    }
    csvContent = lines.join("\n");
  }

  const lines = csvContent.split("\n").filter((l) => l.trim());
  if (lines.length < 2) {
    console.error("CSV must have a header row and at least one data row.");
    process.exit(1);
  }

  const header = parseCsvLine(lines[0]);
  const expectedFields = [
    "isbn", "title", "author", "genre", "price",
    "condition", "modality", "notes", "rental_price", "rental_deposit",
  ];

  // Validate header
  for (const field of expectedFields) {
    if (!header.includes(field)) {
      console.error(`Missing CSV column: ${field}`);
      process.exit(1);
    }
  }

  let created = 0;
  let failed = 0;

  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    const row: Record<string, string> = {};
    header.forEach((h, idx) => {
      row[h] = values[idx] ?? "";
    });

    const success = await processRow(row as unknown as CsvRow);
    if (success) created++;
    else failed++;
  }

  console.log(`\nSummary: ${created} created, ${failed} failed`);
}

main();
