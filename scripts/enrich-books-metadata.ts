/**
 * Enriquece libros existentes con editorial, páginas y sinopsis.
 * Fuentes: Google Books API + Open Library (fallback).
 *
 * Usage:
 *   npx tsx scripts/enrich-books-metadata.ts          # dry-run
 *   npx tsx scripts/enrich-books-metadata.ts --fix     # aplicar cambios
 *   npx tsx scripts/enrich-books-metadata.ts --fix --seller ID  # solo libros de un vendedor
 *   npx tsx scripts/enrich-books-metadata.ts --relleno         # solo los que tienen la plantilla SEO
 *   npx tsx scripts/enrich-books-metadata.ts --activos --limite 50
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";

const envPath = resolve(process.cwd(), ".env.local");
const envContent = readFileSync(envPath, "utf-8");
for (const line of envContent.split("\n")) {
  if (line.startsWith("#") || !line.includes("=")) continue;
  const idx = line.indexOf("=");
  if (!process.env[line.slice(0, idx).trim()]) process.env[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const fix = process.argv.includes("--fix");
const sellerIdx = process.argv.indexOf("--seller");
const sellerId = sellerIdx > -1 ? process.argv[sellerIdx + 1] : null;
const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
const soloRelleno = process.argv.includes("--relleno");
const soloActivos = process.argv.includes("--activos");
const limiteIdx = process.argv.indexOf("--limite");
const limite = limiteIdx > -1 ? parseInt(process.argv[limiteIdx + 1], 10) : null;

/**
 * Descripciones que ocupan el lugar de una sinopsis sin decir nada del libro.
 * Son la plantilla SEO con la que se dieron de alta algunos libros: "Descubre X
 * de Y. Este libro usado está disponible en tuslibros.cl…". Para efectos de
 * enriquecer valen lo mismo que un campo vacío — el 26-08-2026 había 171 fichas
 * activas así, incluida una destacada en el home (Vero lo notó mirando
 * "Los Tres Ojos del Conocimiento": la ficha no decía nada del contenido).
 */
function esRelleno(d: string | null | undefined): boolean {
  if (!d) return true;
  return /Este libro usado est[áa] disponible en tuslibros\.cl|ejemplar de segunda mano en buen estado/i.test(d);
}

interface BookRow {
  id: string;
  isbn: string | null;
  title: string;
  author: string;
  publisher: string | null;
  pages: number | null;
  description: string | null;
}

interface Meta {
  publisher: string | null;
  pages: number | null;
  description: string | null;
}

async function fetchFromGoogle(isbn: string, title: string, author: string): Promise<Meta | null> {
  const clean = isbn.replace(/[-\s]/g, "");
  // El título a veces trae el tomo o el traductor pegados con guion; para
  // buscar sirve la parte de antes.
  const tituloBase = title.split(/\s+[—–-]\s+/)[0].trim();
  const apellido = author.trim().split(/\s+/).slice(-1)[0];

  // De la más específica a la más laxa. Antes solo se probaban dos y una
  // consulta libre "título autor" trae cualquier cosa: pidiendo `intitle` e
  // `inauthor` el resultado es del libro y no de un catálogo que lo menciona.
  const queries = [
    clean ? `isbn:${clean}` : null,
    `intitle:${tituloBase} inauthor:${apellido}`,
    `intitle:${tituloBase}`,
    `${tituloBase} ${author}`,
  ].filter(Boolean) as string[];

  let mejor: Meta | null = null;
  // Dos vueltas: primero pidiendo español, después sin restricción de idioma.
  // Muchas ediciones en español no vienen etiquetadas como `es` en Google y con
  // langRestrict quedaban fuera; la sinopsis en inglés la descarta después el
  // filtro de idioma del update, así que no cuesta nada mirarlas.
  for (const { query, es } of queries.flatMap(q => [
    { query: q, es: true },
    { query: q, es: false },
  ])) {
    try {
      // No usar API key — la guardada está inválida y sin key funciona bien.
      // langRestrict=es porque la sinopsis solo se guarda si viene en español:
      // pedirla ya filtrada ahorra descartarla después.
      const url =
        `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}` +
        `&maxResults=3${es ? "&langRestrict=es" : ""}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (!res.ok) continue;
      const data = await res.json();
      if (data.error) continue; // quota exceeded
      if (!data.items?.length) continue;

      for (const item of data.items) {
        const v = item.volumeInfo;
        if (!v) continue;
        const meta: Meta = {
          publisher: v.publisher ?? null,
          pages: v.pageCount ?? null,
          description: v.description ?? null,
        };
        // Una sinopsis es lo que se vino a buscar: si la hay, se corta acá.
        if (meta.description) return meta;
        if (!mejor && (meta.publisher || meta.pages)) mejor = meta;
      }
    } catch { continue; }
  }
  return mejor;
}

async function fetchFromOpenLibrary(isbn: string): Promise<Meta | null> {
  const clean = isbn.replace(/[-\s]/g, "");
  try {
    // Data endpoint for publisher info
    const dataRes = await fetch(
      `https://openlibrary.org/api/books?bibkeys=ISBN:${clean}&format=json&jscmd=data`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (!dataRes.ok) return null;
    const dataJson = await dataRes.json();
    const bookData = dataJson[`ISBN:${clean}`];

    // Details endpoint for pages and description
    const detailsRes = await fetch(
      `https://openlibrary.org/api/books?bibkeys=ISBN:${clean}&format=json&jscmd=details`,
      { signal: AbortSignal.timeout(5000) }
    );
    const detailsJson = detailsRes.ok ? await detailsRes.json() : {};
    const details = detailsJson[`ISBN:${clean}`]?.details ?? {};

    const publisher = bookData?.publishers?.[0]?.name ?? details?.publishers?.[0] ?? null;
    const pages = details?.number_of_pages ?? bookData?.number_of_pages ?? null;
    let description = details?.description?.value ?? details?.description ?? "";

    // Try work-level description
    if (!description && details?.works?.[0]?.key) {
      try {
        const workRes = await fetch(`https://openlibrary.org${details.works[0].key}.json`, {
          signal: AbortSignal.timeout(5000),
        });
        if (workRes.ok) {
          const workData = await workRes.json();
          description = workData.description?.value ?? workData.description ?? "";
        }
      } catch { /* ok */ }
    }

    if (publisher || pages || description) {
      return { publisher, pages, description: description || null };
    }
  } catch { /* ok */ }
  return null;
}

async function fetchMeta(isbn: string, title: string, author: string): Promise<Meta | null> {
  // Try Google Books first
  const google = await fetchFromGoogle(isbn, title, author);
  if (google && (google.publisher || google.pages)) return google;

  // Fallback to Open Library
  const ol = await fetchFromOpenLibrary(isbn);
  if (ol) {
    // Merge: prefer Google description if available
    return {
      publisher: ol.publisher ?? google?.publisher ?? null,
      pages: ol.pages ?? google?.pages ?? null,
      description: google?.description ?? ol.description ?? null,
    };
  }

  return google; // may have description only
}

async function main() {
  // Get books — optionally filter by seller
  let query = supabase.from("books").select("id, isbn, title, author, publisher, pages, description");

  if (sellerId) {
    // Get book IDs for this seller's listings
    const { data: listings } = await supabase
      .from("listings")
      .select("book_id")
      .eq("seller_id", sellerId);
    if (!listings?.length) { console.error("No listings for seller"); return; }
    const bookIds = listings.map(l => l.book_id);
    query = query.in("id", bookIds);
    console.log(`🔍 Filtrando por vendedor: ${sellerId} (${bookIds.length} libros)\n`);
  }

  // Paginado: `books` pasa las 2.000 filas y Supabase corta en 1.000. Sin esto
  // el script decía "Total libros: 1000" y dejaba el resto fuera sin avisar
  // (cuarta vez que pasa lo mismo, ver lib/supabase/paginar.ts).
  const books: BookRow[] = [];
  for (let desde = 0; ; desde += 1000) {
    const { data, error } = await query.range(desde, desde + 999);
    if (error) { console.error(error.message); return; }
    books.push(...((data ?? []) as BookRow[]));
    if (!data || data.length < 1000) break;
  }
  if (!books.length) { console.error("No books found"); return; }

  // Con --activos se enriquece solo lo que alguien puede comprar hoy. El
  // catálogo tiene libros de publicaciones vendidas o pausadas y recorrerlos
  // cuesta 750ms cada uno contra la API de Google.
  let universo = books;
  if (soloActivos) {
    const activos = new Set<string>();
    for (let desde = 0; ; desde += 1000) {
      const { data } = await supabase
        .from("listings")
        .select("book_id")
        .eq("status", "active")
        .range(desde, desde + 999);
      (data ?? []).forEach(l => activos.add(l.book_id as string));
      if (!data || data.length < 1000) break;
    }
    universo = books.filter(b => activos.has(b.id));
    console.log(`Acotado a libros con publicación activa: ${universo.length} de ${books.length}`);
  }

  let needsEnrich = universo.filter(b =>
    soloRelleno ? esRelleno(b.description) : !b.publisher || !b.pages || esRelleno(b.description)
  );
  console.log(`Total libros: ${universo.length}`);
  console.log(`Necesitan enriquecimiento: ${needsEnrich.length}`);
  if (limite && needsEnrich.length > limite) {
    needsEnrich = needsEnrich.slice(0, limite);
    console.log(`Acotado a los primeros ${limite} por --limite`);
  }
  console.log("");

  let enriched = 0;
  let notFound = 0;

  for (const book of needsEnrich) {
    console.log(`  ${book.title} — ${book.author}...`);

    // Rate limit: 500ms between books to avoid throttling without API key
    await new Promise(r => setTimeout(r, 500));

    let meta: Meta | null = null;
    if (book.isbn) {
      meta = await fetchMeta(book.isbn, book.title, book.author);
    } else {
      // Sin ISBN: intentar solo por título+autor en Google
      meta = await fetchFromGoogle("", book.title, book.author);
    }

    if (meta) {
      const updates: Record<string, unknown> = {};
      if (!book.publisher && meta.publisher) updates.publisher = meta.publisher;
      if (!book.pages && meta.pages) updates.pages = meta.pages;
      if (esRelleno(book.description) && meta.description) {
        // Solo guardar sinopsis en español — descartar inglés y spam de ISBN Handbook
        const d = meta.description;
        // Solo aceptar sinopsis en español
        const hasSpanish = /\b(el|la|los|las|del|por|una|con|que|en|de|su|este|esta|como|para|más|entre|sobre|desde|hasta|pero|sino|también|tiene|puede|hace|sido|está|fue|ser|hay|sus|nos|muy)\b/i.test(d);
        const isSpam = d.includes("13-digit number") || d.includes("ISBN Handbook");
        if (hasSpanish && !isSpam) updates.description = d;
      }

      if (Object.keys(updates).length > 0) {
        const summary = Object.entries(updates).map(([k, v]) => {
          if (k === "description") return `sinopsis: ${(v as string).slice(0, 50)}...`;
          return `${k}: ${v}`;
        }).join(", ");
        console.log(`    ✓ ${summary}`);
        if (fix) {
          await supabase.from("books").update(updates).eq("id", book.id);
        }
        enriched++;
      } else {
        console.log(`    — Ya completo`);
      }
    } else {
      console.log(`    ✗ Sin datos`);
      notFound++;
    }

    await new Promise(r => setTimeout(r, 250));
  }

  console.log(`\n--- Resumen ---`);
  console.log(`${fix ? "Enriquecidos" : "Encontrados"}: ${enriched}`);
  console.log(`Sin datos disponibles: ${notFound}`);
  if (!fix && enriched > 0) console.log(`\nEjecuta con --fix para aplicar.`);
}

main();
