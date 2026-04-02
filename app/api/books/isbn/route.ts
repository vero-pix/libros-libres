import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const isbn = request.nextUrl.searchParams.get("isbn");

  if (!isbn) {
    return NextResponse.json({ error: "ISBN requerido" }, { status: 400 });
  }

  const cleanISBN = isbn.replace(/[-\s]/g, "");
  const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
  const url = `https://www.googleapis.com/books/v1/volumes?q=isbn:${cleanISBN}${apiKey ? `&key=${apiKey}` : ""}`;

  try {
    const res = await fetch(url, { next: { revalidate: 86400 } });
    const data = await res.json();

    if (!data.items?.length) {
      return NextResponse.json({ error: "Libro no encontrado" }, { status: 404 });
    }

    const volumeInfo = data.items[0].volumeInfo;

    return NextResponse.json({
      title: volumeInfo.title ?? "",
      author: volumeInfo.authors?.join(", ") ?? "",
      description: volumeInfo.description ?? "",
      cover_url: volumeInfo.imageLinks?.thumbnail ?? null,
      genre: volumeInfo.categories?.[0] ?? null,
      published_year: volumeInfo.publishedDate
        ? parseInt(volumeInfo.publishedDate.substring(0, 4))
        : null,
      isbn: cleanISBN,
    });
  } catch {
    return NextResponse.json({ error: "Error al consultar Google Books" }, { status: 500 });
  }
}
