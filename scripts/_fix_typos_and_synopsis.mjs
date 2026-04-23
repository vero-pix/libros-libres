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

// 1. Fix typo "Antología Poetica" → "Antología Poética"
const { data: poetica } = await s
  .from("books")
  .select("id, title")
  .ilike("title", "%antolog%poetica%");
for (const b of poetica ?? []) {
  const fixed = b.title.replace(/Poetica/g, "Poética").replace(/poetica/g, "poética");
  if (fixed !== b.title) {
    const { error } = await s.from("books").update({ title: fixed }).eq("id", b.id);
    if (error) console.error("❌", b.id, error.message);
    else console.log(`✅ Typo arreglado: "${b.title}" → "${fixed}"`);
  }
}

// 2. Sinopsis a Gargantua y Pentagruel (todas las ediciones en BD sin descripción)
const synopsis =
  "La obra fundacional de la novela moderna. François Rabelais (1494–1553) cuenta las aventuras colosales —literales y metafóricas— del gigante Gargantúa y su hijo Pantagruel, en una sátira desbordante del humanismo del Renacimiento. Humor escatológico, erudición enciclopédica y carcajadas contra toda autoridad: el libro que inspiró a Cervantes, Sterne y Joyce.";

const { data: gargantuas } = await s
  .from("books")
  .select("id, title, author, description")
  .ilike("title", "%gargant%");

for (const b of gargantuas ?? []) {
  if (!b.description || b.description.length < 50) {
    const { error } = await s.from("books").update({ description: synopsis }).eq("id", b.id);
    if (error) console.error("❌", b.id, error.message);
    else console.log(`✅ Sinopsis a "${b.title}" — ${b.author}`);
  } else {
    console.log(`·  ya tiene sinopsis: "${b.title}"`);
  }
}
