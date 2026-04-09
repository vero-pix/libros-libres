/**
 * Enriquece libros existentes con editorial, páginas y sinopsis.
 * Fuentes: Google Books API + Open Library (fallback).
 *
 * Usage:
 *   npx tsx scripts/enrich-books-metadata.ts          # dry-run
 *   npx tsx scripts/enrich-books-metadata.ts --fix     # aplicar cambios
 *   npx tsx scripts/enrich-books-metadata.ts --fix --seller ID  # solo libros de un vendedor
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

interface Meta {
  publisher: string | null;
  pages: number | null;
  description: string | null;
}

async function fetchFromGoogle(isbn: string, title: string, author: string): Promise<Meta | null> {
  const clean = isbn.replace(/[-\s]/g, "");
  for (const query of [`isbn:${clean}`, `${title} ${author}`]) {
    try {
      // No usar API key — la guardada está inválida y sin key funciona bien
      const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=1`;
      const res = await fetch(url);
      if (!res.ok) continue;
      const data = await res.json();
      if (data.error) continue; // quota exceeded
      if (!data.items?.length) continue;

      const v = data.items[0].volumeInfo;
      if (v.publisher || v.pageCount || v.description) {
        return {
          publisher: v.publisher ?? null,
          pages: v.pageCount ?? null,
          description: v.description ?? null,
        };
      }
    } catch { continue; }
  }
  return null;
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

  const { data: books } = await query;
  if (!books?.length) { console.error("No books found"); return; }

  const needsEnrich = books.filter(b => !b.publisher || !b.pages || !b.description);
  console.log(`Total libros: ${books.length}`);
  console.log(`Necesitan enriquecimiento: ${needsEnrich.length}\n`);

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
      if (!book.description && meta.description) {
        // Solo guardar sinopsis en español — descartar inglés y spam de ISBN Handbook
        const d = meta.description;
        const isEnglish = /\b(the|you|this|have|will|that|from|your|with)\b/i.test(d) && !/\b(el|la|los|las|del|por|una|con|que)\b/i.test(d);
        const isSpam = d.includes("13-digit number") || d.includes("ISBN Handbook");
        if (!isEnglish && !isSpam) updates.description = d;
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
