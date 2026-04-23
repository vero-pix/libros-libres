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

// Criterios: autores clásicos romanos + títulos en latín + language=la
const classicalAuthors = [
  "cicerón", "ciceron", "cicero",
  "virgilio", "virgil", "publius vergilius",
  "horacio", "horace", "horatius",
  "ovidio", "ovid", "ovidius",
  "séneca", "seneca",
  "tácito", "tacito", "tacitus",
  "suetonio", "suetonius",
  "salustio", "sallust",
  "lucrecio", "lucretius",
  "tito livio", "livy", "livius",
  "catón", "caton", "cato",
  "plinio", "pliny",
  "juvenal",
  "marcial", "martial",
  "plauto", "plautus",
  "terencio", "terence",
  "césar", "cesar", "caesar",
  "marco aurelio", "aurelius",
];

const { data: books } = await s
  .from("books")
  .select("id, title, author, language");

const matches = [];
for (const b of books ?? []) {
  const author = (b.author ?? "").toLowerCase();
  const title = (b.title ?? "").toLowerCase();
  const lang = b.language;

  const isLang = lang === "la" || lang === "latin";
  const authorMatch = classicalAuthors.find((a) => author.includes(a));
  const hasLatinPhrase = /\b(ars|de|in|et|cum|liber|opera|poemata)\b/.test(title) && /\b(latin|latinos|latina|bilingüe|bilingue|edicion clasica)\b/.test(title);

  if (isLang || authorMatch || hasLatinPhrase) {
    matches.push({ ...b, reason: isLang ? "language=la" : authorMatch ? `autor: ${authorMatch}` : "frase latina" });
  }
}

// También buscar listings activos de esos books
if (matches.length) {
  const ids = matches.map((m) => m.id);
  const { data: listings } = await s
    .from("listings")
    .select("id, price, status, slug, seller:users(username), book_id")
    .in("book_id", ids)
    .in("status", ["active", "completed"]);

  console.log(`Encontrados ${matches.length} libros relacionados a latín clásico\n`);
  for (const m of matches) {
    const l = (listings ?? []).find((x) => x.book_id === m.id);
    const url = l && l.seller?.username && l.slug ? `/libro/${l.seller.username}/${l.slug}` : l ? `/listings/${l.id}` : "(sin listing)";
    console.log(`  "${m.title}" — ${m.author}  · ${m.reason}`);
    if (l) console.log(`     ${l.status}  $${l.price}  ${url}`);
  }
} else {
  console.log("No hay libros relacionados a latín clásico en el catálogo actual.");
}
