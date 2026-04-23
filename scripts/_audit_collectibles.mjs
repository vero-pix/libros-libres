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

// 1. Los actualmente marcados
const { data: current } = await s
  .from("listings")
  .select("id, price, is_collectible, slug, book:books(title, author, publisher, publication_year)")
  .eq("is_collectible", true)
  .in("status", ["active", "completed"]);

console.log(`Actualmente is_collectible=true: ${current?.length ?? 0}`);
for (const l of current ?? []) {
  console.log(`  ${l.id.slice(0, 8)}  $${l.price}  "${l.book?.title}" ${l.book?.author ? "— " + l.book.author : ""}  (${l.book?.publisher ?? "?"} ${l.book?.publication_year ?? ""})  status: —`);
}

// 2. Candidatos obvios: editores/autores/años de colección
const collectiblePublishers = [
  "nascimento", "zig-zag", "luis de caralt", "pomaire",
  "francisco de aguirre", "alianza", "biblioteca de babel",
  "cormoran", "lom", "ercilla",
];

const legendaryAuthors = [
  "parra", "de rokha", "emar", "mistral", "huidobro", "neruda",
  "díaz casanueva", "diaz casanueva", "anguita", "rojas",
  "prado", "ibañez", "lihn", "zurita",
];

const { data: all } = await s
  .from("listings")
  .select("id, price, is_collectible, slug, book:books(title, author, publisher, publication_year)")
  .in("status", ["active", "completed"])
  .eq("seller_id", "2201d163-4423-4971-91f0-f6cebd00d1bd");

const candidates = [];
for (const l of all ?? []) {
  if (l.is_collectible) continue;
  const publisher = (l.book?.publisher ?? "").toLowerCase();
  const author = (l.book?.author ?? "").toLowerCase();
  const title = (l.book?.title ?? "").toLowerCase();
  const year = l.book?.publication_year;

  const pubMatch = collectiblePublishers.find((p) => publisher.includes(p));
  const authorMatch = legendaryAuthors.find((a) => author.includes(a));
  const isOldEnough = year && year < 1990;

  if (pubMatch || (authorMatch && isOldEnough) || isOldEnough) {
    candidates.push({ ...l, pubMatch, authorMatch, isOldEnough });
  }
}

console.log(`\n\nCandidatos a marcar is_collectible (seller TusLibros, sin flag actual): ${candidates.length}\n`);

for (const c of candidates.slice(0, 30)) {
  console.log(`  ${c.id.slice(0, 8)}  $${c.price}  "${c.book?.title}" — ${c.book?.author}`);
  console.log(`         publisher: ${c.book?.publisher ?? "—"}  · año: ${c.book?.publication_year ?? "—"}  · razón: ${[c.pubMatch && "publisher", c.authorMatch && "autor", c.isOldEnough && "pre-1990"].filter(Boolean).join(", ")}`);
}

fs.writeFileSync("/tmp/collectible_candidates.json", JSON.stringify(candidates, null, 2));
