/**
 * Rellena las descripciones pobres del catálogo.
 *
 * 279 fichas activas (14%) mostraban el placeholder del formulario —"Libro usado
 * publicado en tuslibros.cl"— o venían vacías. Es la peor ficha posible: no
 * convence al comprador y no le da a Google ni una línea propia que indexar.
 *
 * Prioridad, para no llenar el catálogo de texto clonado:
 *   1. Sinopsis real de Google Books (por ISBN, o por título+autor)
 *   2. Ficha factual con la metadata que exista (editorial, año, páginas, estado)
 *   3. Si no hay NADA que decir, se deja como está — una descripción vacía es
 *      mejor que 200 idénticas, que Google lee como contenido duplicado.
 *
 *   node scripts/enriquecer-descripciones.mjs           → preview
 *   node scripts/enriquecer-descripciones.mjs --apply   → escribe
 *   node scripts/enriquecer-descripciones.mjs --limit 20
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

for (const line of readFileSync(".env.local", "utf-8").split("\n")) {
  if (line.startsWith("#") || !line.includes("=")) continue;
  const i = line.indexOf("=");
  const k = line.slice(0, i).trim();
  if (!process.env[k]) process.env[k] = line.slice(i + 1).trim().replace(/^["']|["']$/g, "");
}

const supa = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});
const APPLY = process.argv.includes("--apply");
const limIdx = process.argv.indexOf("--limit");
const LIMIT = limIdx > -1 ? parseInt(process.argv[limIdx + 1], 10) : Infinity;
const API_KEY = process.env.GOOGLE_BOOKS_API_KEY;

const CONDICION = {
  new: "Como nuevo",
  good: "En buen estado",
  fair: "En estado regular",
  poor: "Con detalles de uso",
};

const esPobre = (d) => !d || d.trim().length < 60 || /Libro usado publicado en tuslibros/i.test(d);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function sinopsisGoogle(isbn, titulo, autor) {
  const consultas = [];
  if (isbn) consultas.push(`isbn:${isbn.replace(/[-\s]/g, "")}`);
  if (titulo) consultas.push(`intitle:${titulo}${autor ? ` inauthor:${autor.split(/[;,]/)[0]}` : ""}`);
  for (const q of consultas) {
    try {
      const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&maxResults=1&langRestrict=es${API_KEY ? `&key=${API_KEY}` : ""}`;
      const res = await fetch(url);
      if (!res.ok) continue;
      const data = await res.json();
      const v = data.items?.[0]?.volumeInfo;
      const desc = v?.description?.trim();
      // Descartar sinopsis basura: muy cortas o que son solo el título repetido.
      if (desc && desc.length >= 80) return desc.slice(0, 1200);
    } catch {
      /* seguir con la siguiente consulta */
    }
    await sleep(120); // cortesía con la API
  }
  return null;
}

/** Ficha factual: solo afirma lo que la base ya sabe. Nunca inventa contenido. */
function fichaFactual(book, listing) {
  const partes = [];
  const titulo = book.title?.trim();
  const autor = book.author?.trim();

  partes.push(autor ? `${titulo}, de ${autor}.` : `${titulo}.`);

  const edicion = [
    book.publisher?.trim(),
    book.published_year ? String(book.published_year) : null,
  ].filter(Boolean).join(", ");
  if (edicion) partes.push(`${edicion}.`);
  if (book.pages) partes.push(`${book.pages} páginas.`);

  const cond = CONDICION[listing.condition];
  if (cond) partes.push(`Ejemplar usado. ${cond}.`);

  // Las notas del vendedor son lo más valioso: van al final, con sus palabras.
  const notas = listing.notes?.trim();
  if (notas && notas.length > 10) partes.push(notas.endsWith(".") ? notas : `${notas}.`);

  const texto = partes.join(" ");
  // Sin editorial, año, páginas ni notas queda "Título, de Autor. Ejemplar
  // usado. En buen estado." — clonado en cientos de fichas. No vale la pena.
  const tieneSustancia = Boolean(edicion || book.pages || (notas && notas.length > 10));
  return tieneSustancia ? texto : null;
}

const listings = [];
for (let f = 0; ; f += 1000) {
  const { data } = await supa
    .from("listings")
    .select("id, condition, notes, book:books(id, title, author, description, publisher, published_year, pages, isbn)")
    .eq("status", "active")
    .range(f, f + 999);
  listings.push(...(data ?? []));
  if (!data || data.length < 1000) break;
}

const pendientes = listings.filter((l) => esPobre(l.book?.description));
console.log(`${listings.length} activos · ${pendientes.length} con descripción pobre`);
if (!APPLY) console.log("PREVIEW — no se escribe nada. Corre con --apply.\n");

// Un mismo book puede tener varios listings: se escribe una sola vez.
const vistos = new Set();
let google = 0, factual = 0, sinDatos = 0, errores = 0, n = 0;

for (const l of pendientes) {
  if (n >= LIMIT) break;
  const book = l.book;
  if (!book?.id || vistos.has(book.id)) continue;
  vistos.add(book.id);
  n++;

  let desc = await sinopsisGoogle(book.isbn, book.title, book.author);
  let origen = "google";
  if (!desc) {
    desc = fichaFactual(book, l);
    origen = "factual";
  }
  if (!desc) {
    sinDatos++;
    console.log(`  — sin datos suficientes: "${(book.title ?? "").slice(0, 45)}"`);
    continue;
  }

  if (origen === "google") google++; else factual++;
  console.log(`  ${origen === "google" ? "📚" : "📝"} ${(book.title ?? "").slice(0, 42).padEnd(43)} ${desc.slice(0, 60).replace(/\s+/g, " ")}…`);

  if (APPLY) {
    const { error } = await supa.from("books").update({ description: desc }).eq("id", book.id);
    if (error) { errores++; console.log(`     ⚠️  ${error.message}`); }
  }
}

console.log(`\nSinopsis de Google Books: ${google} · fichas factuales: ${factual} · sin datos: ${sinDatos}${errores ? ` · errores: ${errores}` : ""}`);
if (!APPLY) console.log("Corre con --apply para guardar.");
