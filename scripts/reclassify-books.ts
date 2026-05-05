import { createClient } from "@supabase/supabase-js";
import { normalizeGenre } from "../lib/genreNormalizer";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing env vars: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  console.log("--- Iniciando reclasificación de libros ---");

  // 1. Obtener todos los libros
  const { data: books, error } = await supabase
    .from("books")
    .select("id, title, genre, description");

  if (error) {
    console.error("Error al obtener libros:", error.message);
    return;
  }

  console.log(`Encontrados ${books.length} libros para procesar.`);

  let updated = 0;
  let skipped = 0;

  for (const book of books) {
    // 2. Normalizar usando nuestra nueva lógica chilena
    const normalized = normalizeGenre(book.genre, book.title, book.description);

    if (normalized) {
      // 3. Actualizar en la BD
      const { error: upErr } = await supabase
        .from("books")
        .update({
          category: normalized.category,
          subcategory: normalized.subcategory
        })
        .eq("id", book.id);

      if (upErr) {
        console.error(`Error actualizando libro ${book.id}:`, upErr.message);
      } else {
        updated++;
        if (updated % 50 === 0) console.log(`...procesados ${updated} libros`);
      }
    } else {
      skipped++;
    }
  }

  console.log("\n--- Resumen de reclasificación ---");
  console.log(`Total libros: ${books.length}`);
  console.log(`Reclasificados: ${updated}`);
  console.log(`Sin categoría clara (pendientes): ${skipped}`);
  console.log("----------------------------------");
}

main();
