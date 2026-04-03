import { NextRequest, NextResponse } from "next/server";
import { translateGenre } from "@/lib/genres";

/**
 * Search book by title+author in Google Books and Open Library.
 * Returns cover, description, genre for auto-completion.
 */

export async function GET(request: NextRequest) {
  const title = request.nextUrl.searchParams.get("title");
  const author = request.nextUrl.searchParams.get("author");

  if (!title) {
    return NextResponse.json({ error: "Título requerido" }, { status: 400 });
  }

  const query = `${title} ${author ?? ""}`.trim();

  // Try Google Books
  const gbResult = await searchGoogleBooks(query);
  if (gbResult) return NextResponse.json(gbResult);

  // Fallback: Open Library
  const olResult = await searchOpenLibrary(query);
  if (olResult) return NextResponse.json(olResult);

  return NextResponse.json({ error: "No se encontraron datos" }, { status: 404 });
}

async function searchGoogleBooks(query: string) {
  const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
  if (apiKey === "AIza..." || !apiKey) return null;

  try {
    const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=1&langRestrict=es${apiKey ? `&key=${apiKey}` : ""}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.items?.length) return null;

    const v = data.items[0].volumeInfo;
    return {
      cover_url: v.imageLinks?.thumbnail?.replace("http://", "https://") ?? null,
      description: v.description ?? null,
      genre: v.categories?.[0] ? translateGenre(v.categories[0]) : null,
      source: "Google Books",
    };
  } catch {
    return null;
  }
}

async function searchOpenLibrary(query: string) {
  try {
    const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=1&fields=key,cover_i,subject,first_sentence`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.docs?.length) return null;

    const doc = data.docs[0];
    const coverId = doc.cover_i;
    const cover_url = coverId
      ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`
      : null;

    const genre = doc.subject?.[0] ? translateGenre(doc.subject[0]) : null;

    // Try to get full description from the work page
    let description = doc.first_sentence?.[0] ?? null;
    if (doc.key) {
      try {
        const workRes = await fetch(`https://openlibrary.org${doc.key}.json`);
        if (workRes.ok) {
          const work = await workRes.json();
          const fullDesc = work.description?.value ?? work.description;
          if (fullDesc && typeof fullDesc === "string") {
            description = fullDesc;
          }
        }
      } catch { /* keep first_sentence */ }
    }

    return { cover_url, description, genre, source: "Open Library" };
  } catch {
    return null;
  }
}
