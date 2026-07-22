/**
 * Siembra EDITORIAL de reseñas de obra (anti cold-start).
 *
 * Inserta/actualiza una reseña editorial (is_editorial=true, reviewer_id=NULL)
 * por cada obra (books.id). Son reseñas HONESTAS, firmadas como el medio
 * ("Equipo tuslibros", "Vero", ...). JAMÁS usuarios falsos.
 *
 * El texto de cada reseña lo redacta el operador o el motor editorial
 * (MASTER_PLAN) — este script solo lo escribe en la BD. Idempotente: por el
 * índice parcial único `book_reviews_one_editorial_idx`, correrlo dos veces
 * ACTUALIZA la editorial en vez de duplicarla.
 *
 * Cómo lo llamará el motor editorial:
 *   El MASTER_PLAN puede (a) invocar este script con un JSON de reseñas, o
 *   (b) hacer POST a /api/admin/book-reviews con un admin logueado
 *      { bookId, rating, title, body, authorLabel }. Ambos caminos escriben
 *      la misma fila editorial (una por obra).
 *
 * Uso:
 *   npx tsx scripts/seed-book-reviews.ts docs/book_reviews_seed.json
 *   npx tsx scripts/seed-book-reviews.ts docs/book_reviews_seed.json --dry-run
 *
 * Formato del JSON de entrada (array):
 *   [
 *     {
 *       "bookId": "uuid-de-books",
 *       "rating": 5,                       // opcional (1-5); omitir = sin nota
 *       "title": "Un clásico que no envejece",
 *       "body": "Texto de la reseña...",
 *       "authorLabel": "Vero"              // opcional, default "Equipo tuslibros"
 *     }
 *   ]
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";

// Cargar .env.local a mano (mismo patrón que bulk-upload-csv.ts).
const envPath = resolve(process.cwd(), ".env.local");
const envContent = readFileSync(envPath, "utf-8");
for (const line of envContent.split("\n")) {
  if (line.startsWith("#") || !line.includes("=")) continue;
  const idx = line.indexOf("=");
  const key = line.slice(0, idx).trim();
  const val = line.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
  if (!process.env[key]) process.env[key] = val;
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const DRY_RUN = process.argv.includes("--dry-run");

interface SeedReview {
  bookId: string;
  rating?: number | null;
  title?: string | null;
  body: string;
  authorLabel?: string | null;
}

async function main() {
  const file = process.argv[2];
  if (!file) {
    console.error("Uso: npx tsx scripts/seed-book-reviews.ts <archivo.json> [--dry-run]");
    process.exit(1);
  }

  const rows: SeedReview[] = JSON.parse(readFileSync(resolve(file), "utf-8"));
  if (!Array.isArray(rows)) {
    console.error("El JSON debe ser un array de reseñas.");
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let inserted = 0;
  let updated = 0;
  let skipped = 0;

  for (const r of rows) {
    if (!r.bookId || !r.body?.trim()) {
      console.warn(`⚠️  Fila sin bookId o body — omitida.`);
      skipped++;
      continue;
    }
    const rating = r.rating != null && r.rating !== undefined ? Number(r.rating) : null;
    if (rating != null && (!Number.isInteger(rating) || rating < 1 || rating > 5)) {
      console.warn(`⚠️  ${r.bookId}: rating inválido (${r.rating}) — omitida.`);
      skipped++;
      continue;
    }

    // Verificar que la obra existe (evita FK error silencioso).
    const { data: book } = await supabase
      .from("books")
      .select("id, title")
      .eq("id", r.bookId)
      .maybeSingle();
    if (!book) {
      console.warn(`⚠️  ${r.bookId}: no existe en books — omitida.`);
      skipped++;
      continue;
    }

    const payload = {
      book_id: r.bookId,
      reviewer_id: null,
      author_label: r.authorLabel?.trim() || "Equipo tuslibros",
      rating,
      title: r.title?.trim() || null,
      body: r.body.trim(),
      is_editorial: true,
      status: "published" as const,
    };

    // ¿Ya hay editorial para esta obra?
    const { data: existing } = await supabase
      .from("book_reviews")
      .select("id")
      .eq("book_id", r.bookId)
      .eq("is_editorial", true)
      .maybeSingle();

    if (DRY_RUN) {
      console.log(`[dry-run] ${existing ? "UPDATE" : "INSERT"} editorial → "${book.title}" (${rating ?? "s/nota"}★)`);
      existing ? updated++ : inserted++;
      continue;
    }

    if (existing) {
      const { error } = await supabase.from("book_reviews").update(payload).eq("id", existing.id);
      if (error) { console.error(`❌ ${book.title}: ${error.message}`); skipped++; continue; }
      updated++;
      console.log(`✏️  Actualizada editorial → "${book.title}"`);
    } else {
      const { error } = await supabase.from("book_reviews").insert(payload);
      if (error) { console.error(`❌ ${book.title}: ${error.message}`); skipped++; continue; }
      inserted++;
      console.log(`✅ Sembrada editorial → "${book.title}"`);
    }
  }

  console.log(`\nListo. Insertadas: ${inserted} · Actualizadas: ${updated} · Omitidas: ${skipped}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
