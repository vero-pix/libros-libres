import { NextRequest, NextResponse } from "next/server";
import { translateGenre } from "@/lib/genres";

/**
 * Try Google Books first, then fall back to Open Library.
 * Open Library is free, unlimited, and has good coverage for Latin American editions.
 */

async function searchGoogleBooks(isbn: string) {
  const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
  if (apiKey === "AIza..." || !apiKey) return null; // skip if placeholder

  // Try Spanish edition first, then any language
  for (const lang of ["es", ""]) {
    const langParam = lang ? `&langRestrict=${lang}` : "";
    const url = `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}${langParam}${apiKey ? `&key=${apiKey}` : ""}`;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      const res = await fetch(url, { next: { revalidate: 86400 }, signal: controller.signal });
      clearTimeout(timeout);
      if (!res.ok) continue;
      const data = await res.json();
      if (!data.items?.length) continue;

      const v = data.items[0].volumeInfo;
      if (v.description || lang === "") {
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
          publisher: v.publisher ?? null,
          pages: v.pageCount ?? null,
        };
      }
    } catch {
      continue;
    }
  }
  return null;
}

async function searchOpenLibrary(isbn: string) {
  try {
    // Use the books API which is more reliable than /isbn/ endpoint
    const booksRes = await fetch(
      `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`,
      { next: { revalidate: 86400 } }
    );
    if (!booksRes.ok) return null;
    const booksData = await booksRes.json();
    const bookInfo = booksData[`ISBN:${isbn}`];

    // Also try the edition endpoint for more details
    const res = await fetch(
      `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=details`,
      { next: { revalidate: 86400 } }
    );
    const detailsData = res.ok ? await res.json() : {};
    const details = detailsData[`ISBN:${isbn}`]?.details ?? {};

    // Merge data from both endpoints
    const data = {
      title: bookInfo?.title ?? details?.title ?? "",
      authors: details?.authors ?? bookInfo?.authors?.map((a: any) => ({ key: a.url?.replace("https://openlibrary.org", "") ?? "" })) ?? [],
      covers: details?.covers ?? [],
      subjects: bookInfo?.subjects?.map((s: any) => s.name) ?? details?.subjects ?? [],
      description: details?.description ?? "",
      publish_date: bookInfo?.publish_date ?? details?.publish_date ?? "",
      works: details?.works ?? [],
      publishers: bookInfo?.publishers?.map((p: any) => p.name) ?? details?.publishers ?? [],
      pages: details?.number_of_pages ?? bookInfo?.number_of_pages ?? null,
    };

    // Get author name(s) — try bookInfo first (has names), fallback to API
    let author = "";
    if (bookInfo?.authors?.length) {
      author = bookInfo.authors.map((a: any) => a.name).filter(Boolean).join(", ");
    } else if (data.authors?.length) {
      const authorKeys = data.authors.map((a: { key: string }) => a.key).filter(Boolean);
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

    // Get cover — verify it exists (Open Library returns 1x1 transparent for invalid ISBNs)
    let cover_url: string | null = null;
    const coverId = data.covers?.[0];
    if (coverId) {
      cover_url = `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`;
    } else {
      const testUrl = `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg?default=false`;
      try {
        const headRes = await fetch(testUrl, { method: "HEAD" });
        if (headRes.ok) {
          cover_url = `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`;
        }
      } catch { /* no cover available */ }
    }

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
              publisher: data.publishers?.[0] ?? null,
              pages: data.pages ?? null,
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
      publisher: data.publishers?.[0] ?? null,
      pages: data.pages ?? null,
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
