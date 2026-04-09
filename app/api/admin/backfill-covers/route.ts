import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

async function fetchCoverUrl(isbn: string): Promise<string | null> {
  // Try Open Library first (free, no rate limits)
  try {
    const olRes = await fetch(`https://openlibrary.org/isbn/${isbn}.json`);
    if (olRes.ok) {
      const olData = await olRes.json();
      const coverId = olData.covers?.[0];
      if (coverId) return `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`;
    }
  } catch { /* continue */ }

  // Fallback: direct Open Library cover URL (returns 1x1 if not found)
  try {
    const directUrl = `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg?default=false`;
    const headRes = await fetch(directUrl, { method: "HEAD" });
    if (headRes.ok) return `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`;
  } catch { /* continue */ }

  return null;
}

export async function GET(req: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sellerId = new URL(req.url).searchParams.get("seller_id");

  let booksQuery = supabase
    .from("books")
    .select("id, isbn")
    .is("cover_url", null)
    .not("isbn", "is", null);

  if (sellerId) {
    const { data: listings } = await supabase.from("listings").select("book_id").eq("seller_id", sellerId).eq("status", "active");
    const bookIds = listings?.map((l) => l.book_id) ?? [];
    if (bookIds.length === 0) return NextResponse.json({ total: 0, updated: 0, failed: 0, errors: [] });
    booksQuery = booksQuery.in("id", bookIds);
  }

  const { data: books, error } = await booksQuery;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let updated = 0;
  let failed = 0;
  const errors: { id: string; isbn: string; reason: string }[] = [];

  for (const book of books ?? []) {
    const coverUrl = await fetchCoverUrl(book.isbn);
    if (coverUrl) {
      const { error: updateError } = await supabase
        .from("books")
        .update({ cover_url: coverUrl })
        .eq("id", book.id);

      if (updateError) {
        failed++;
        errors.push({ id: book.id, isbn: book.isbn, reason: updateError.message });
      } else {
        updated++;
      }
    } else {
      failed++;
      errors.push({ id: book.id, isbn: book.isbn, reason: "No cover found" });
    }
  }

  return NextResponse.json({ total: books?.length ?? 0, updated, failed, errors });
}
