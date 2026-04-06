import { NextRequest, NextResponse } from "next/server";
import { translateGenre } from "@/lib/genres";

/**
 * Try Google Books first, then fall back to Open Library.
 * Open Library is free, unlimited, and has good coverage for Latin American editions.
 */

async function searchGoogleBooks(isbn: string) {
  const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
  if (apiKey === "AIza..." || !apiKey) return null; // skip if placeholder

  const url = `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}${apiKey ? `&key=${apiKey}` : ""}`;

  try {
    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.items?.length) return null;

    const v = data.items[0].volumeInfo;
    return {
      title: v.title ?? "",
      author: v.authors?.join(", ") ?? "",
      description: v.description ?? "",
      cover_url: v.imageLinks?.thumbnail?.replace("http://", "https://") ?? null,
      genre: v.categories?.[0] ? translateGenre(v.categories[0]) : null,
      published_year: v.publishedDate
        ? parseInt(v.publishedDate.substring(0, 4))
        : null,
      isbn,
    };
  } catch {
    return null;
  }
}

async function searchOpenLibrary(isbn: string) {
  try {
    const res = await fetch(
      `https://openlibrary.org/isbn/${isbn}.json`,
      { next: { revalidate: 86400 } }
    );
    if (!res.ok) return null;
    const data = await res.json();

    // Get author name(s)
    let author = "";
    if (data.authors?.length) {
      const authorKeys = data.authors.map((a: { key: string }) => a.key);
      const authorNames = await Promise.all(
        authorKeys.slice(0, 3).map(async (key: string) => {
          try {
            const aRes = await fetch(`https://openlibrary.org${key}.json`, {
              next: { revalidate: 86400 },
            });
            if (!aRes.ok) return "";
            const aData = await aRes.json();
            return aData.name ?? "";
          } catch {
            return "";
          }
        })
      );
      author = authorNames.filter(Boolean).join(", ");
    }

    // Get cover
    const coverId = data.covers?.[0];
    const cover_url = coverId
      ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`
      : `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`;

    // Get subject/genre
    const genre = data.subjects?.[0] ? translateGenre(data.subjects[0]) : null;

    // Get publish year
    const published_year = data.publish_date
      ? parseInt(data.publish_date.match(/\d{4}/)?.[0] ?? "0") || null
      : null;

    // Description: try edition first, then fetch the "work" for richer data
    let description = data.description?.value ?? data.description ?? "";
    if (!description && data.works?.[0]?.key) {
      try {
        const workRes = await fetch(`https://openlibrary.org${data.works[0].key}.json`, {
          next: { revalidate: 86400 },
        });
        if (workRes.ok) {
          const workData = await workRes.json();
          description = workData.description?.value ?? workData.description ?? "";
          // Also grab subjects from work if edition didn't have them
          if (!genre && workData.subjects?.length) {
            const workGenre = translateGenre(workData.subjects[0]);
            return {
              title: data.title ?? "",
              author,
              description,
              cover_url,
              genre: workGenre,
              published_year,
              isbn,
            };
          }
        }
      } catch { /* fallback gracefully */ }
    }

    return {
      title: data.title ?? "",
      author,
      description,
      cover_url,
      genre,
      published_year,
      isbn,
    };
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const isbn = request.nextUrl.searchParams.get("isbn");

  if (!isbn) {
    return NextResponse.json({ error: "ISBN requerido" }, { status: 400 });
  }

  const cleanISBN = isbn.replace(/[-\s]/g, "");

  // Try Google Books first
  const googleResult = await searchGoogleBooks(cleanISBN);
  if (googleResult) {
    return NextResponse.json(googleResult);
  }

  // Fallback to Open Library
  const olResult = await searchOpenLibrary(cleanISBN);
  if (olResult) {
    return NextResponse.json(olResult);
  }

  return NextResponse.json({ error: "Libro no encontrado" }, { status: 404 });
}
