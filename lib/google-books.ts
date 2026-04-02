export interface GoogleBookResult {
  title: string;
  author: string;
  description: string;
  cover_url: string | null;
  genre: string | null;
  published_year: number | null;
  isbn: string;
}

/** Try Open Library for a cover image */
async function fetchOpenLibraryCover(isbn: string): Promise<string | null> {
  const url = `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg?default=false`;
  try {
    const res = await fetch(url, { method: "HEAD", next: { revalidate: 86400 } });
    if (res.ok) return `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`;
  } catch { /* ignore */ }
  return null;
}

export async function fetchBookByISBN(isbn: string): Promise<GoogleBookResult | null> {
  const clean = isbn.replace(/[-\s]/g, "");
  const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
  const url = `https://www.googleapis.com/books/v1/volumes?q=isbn:${clean}${
    apiKey ? `&key=${apiKey}` : ""
  }`;

  const res = await fetch(url, { next: { revalidate: 86400 } });
  if (!res.ok) return null;

  const data = await res.json();
  if (!data.items?.length) return null;

  const v = data.items[0].volumeInfo;
  let cover = v.imageLinks?.thumbnail?.replace("http://", "https://") ?? null;

  // Fallback to Open Library if no Google cover
  if (!cover) {
    cover = await fetchOpenLibraryCover(clean);
  }

  return {
    title: v.title ?? "",
    author: v.authors?.join(", ") ?? "",
    description: v.description ?? "",
    cover_url: cover,
    genre: v.categories?.[0] ?? null,
    published_year: v.publishedDate ? parseInt(v.publishedDate.substring(0, 4)) : null,
    isbn: clean,
  };
}

export async function searchBooks(query: string): Promise<GoogleBookResult[]> {
  const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
  const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=10${
    apiKey ? `&key=${apiKey}` : ""
  }`;

  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) return [];

  const data = await res.json();
  if (!data.items?.length) return [];

  return data.items.map((item: { volumeInfo: Record<string, unknown> }) => {
    const v = item.volumeInfo;
    const isbns = (v.industryIdentifiers as Array<{ type: string; identifier: string }> | undefined) ?? [];
    const isbn13 = isbns.find((i) => i.type === "ISBN_13")?.identifier ?? "";
    const isbn10 = isbns.find((i) => i.type === "ISBN_10")?.identifier ?? "";

    return {
      title: v.title ?? "",
      author: (v.authors as string[] | undefined)?.join(", ") ?? "",
      description: (v.description as string) ?? "",
      cover_url:
        ((v.imageLinks as Record<string, string> | undefined)?.thumbnail?.replace("http://", "https://")) ?? null,
      genre: (v.categories as string[] | undefined)?.[0] ?? null,
      published_year: v.publishedDate
        ? parseInt((v.publishedDate as string).substring(0, 4))
        : null,
      isbn: isbn13 || isbn10,
    };
  });
}
