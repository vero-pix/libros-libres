import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchBookByISBN } from "@/lib/google-books";

export async function GET() {
  const supabase = await createClient();

  // Basic auth check
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch books missing cover_url but having an isbn
  const { data: books, error } = await supabase
    .from("books")
    .select("id, isbn")
    .is("cover_url", null)
    .not("isbn", "is", null);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let updated = 0;
  let failed = 0;
  const errors: { id: string; isbn: string; reason: string }[] = [];

  for (const book of books ?? []) {
    try {
      const result = await fetchBookByISBN(book.isbn);
      if (result?.cover_url) {
        const { error: updateError } = await supabase
          .from("books")
          .update({ cover_url: result.cover_url })
          .eq("id", book.id);

        if (updateError) {
          failed++;
          errors.push({ id: book.id, isbn: book.isbn, reason: updateError.message });
        } else {
          updated++;
        }
      } else {
        failed++;
        errors.push({ id: book.id, isbn: book.isbn, reason: "No cover found in Google Books" });
      }
    } catch (err) {
      failed++;
      errors.push({
        id: book.id,
        isbn: book.isbn,
        reason: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  return NextResponse.json({
    total: books?.length ?? 0,
    updated,
    failed,
    errors,
  });
}
