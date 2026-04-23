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

const SELLER = "2201d163-4423-4971-91f0-f6cebd00d1bd";

// Traer los últimos 5 para tener sus book_ids
const { data: recent } = await s
  .from("listings")
  .select("id, book_id, book:books(title, author, description, category)")
  .eq("seller_id", SELLER)
  .order("created_at", { ascending: false })
  .limit(5);

if (!recent?.length) process.exit(0);

const updates = {};

for (const l of recent) {
  const title = (l.book?.title ?? "").toLowerCase();
  const author = (l.book?.author ?? "").toLowerCase();

  // 1. Fix typo Poetica → Poética
  if (/poetica/.test(l.book?.title ?? "") && !/poética/.test(l.book?.title ?? "")) {
    updates[l.book_id] = { ...(updates[l.book_id] ?? {}), title: l.book.title.replace(/Poetica/g, "Poética") };
  }

  // 2. Sinopsis para Neruda si falta
  if (/neruda/.test(author) && /20 poemas/.test(title)) {
    if (!l.book?.description || l.book.description.length < 50) {
      updates[l.book_id] = {
        ...(updates[l.book_id] ?? {}),
        description:
          "Libro de culto de 1924 que consagró a Pablo Neruda a los veinte años. Veinte poemas de amor escritos desde la melancolía, el deseo y la pérdida, más una canción desesperada que cierra con uno de los finales más citados de la lírica en español. Punto de partida imprescindible para entrar a la obra del Premio Nobel chileno.",
      };
    }
  }

  // 3. Sinopsis para Gargantua y Pantagruel si falta
  if (/gargantua/.test(title) && /rabelais/.test(author)) {
    if (!l.book?.description || l.book.description.length < 50) {
      updates[l.book_id] = {
        ...(updates[l.book_id] ?? {}),
        description:
          "La obra fundacional de la novela moderna. François Rabelais (1494–1553) cuenta las aventuras colosales —literales y metafóricas— del gigante Gargantúa y su hijo Pantagruel, en una sátira desbordante del humanismo del Renacimiento. Humor escatológico, erudición enciclopédica y carcajadas contra toda autoridad: el libro que inspiró a Cervantes, Sterne y Joyce.",
      };
    }
  }

  // 4. Categorías
  //    - Neruda, Borges Elogio de la sombra, Díaz-Casanueva → poesia
  //    - Yourcenar (Opus nigrum), Tournier (Urogallo) → novela
  if (/neruda|borges|díaz.casanueva|diaz casanueva/.test(author) || /elogio de la sombra|antolog.a po.tica|poemas de amor/.test(title)) {
    // No hay categoría "poesía" en la tabla, uso "clasicos" para poesía canónica
    updates[l.book_id] = { ...(updates[l.book_id] ?? {}), category: "clasicos" };
  } else if (/yourcenar|tournier/.test(author)) {
    updates[l.book_id] = { ...(updates[l.book_id] ?? {}), category: "novela" };
  }
}

// Aplicar updates a books
for (const [bookId, patch] of Object.entries(updates)) {
  const { error } = await s.from("books").update(patch).eq("id", bookId);
  if (error) console.error(`❌ book ${bookId}:`, error.message);
  else console.log(`✅ book ${bookId.slice(0, 8)} →`, Object.keys(patch).join(", "));
}

// 5. Marcar is_collectible en los premium (Yourcenar, Tournier, Neruda, Borges, Díaz-Casanueva, Rabelais)
const toCollect = recent.filter((l) => {
  const a = (l.book?.author ?? "").toLowerCase();
  return /yourcenar|tournier|neruda|borges|casanueva|rabelais/.test(a);
});

if (toCollect.length) {
  const { error } = await s
    .from("listings")
    .update({ is_collectible: true })
    .in("id", toCollect.map((l) => l.id));
  if (error) console.error("❌ collectibles:", error.message);
  else console.log(`\n✅ Marcados como is_collectible: ${toCollect.length}`);
  for (const l of toCollect) console.log(`   ${l.book?.title} — ${l.book?.author}`);
}
