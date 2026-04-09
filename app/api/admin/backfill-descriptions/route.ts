import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServerClient } from "@supabase/ssr";
import { translateGenre } from "@/lib/genres";

/**
 * POST /api/admin/backfill-descriptions
 * Busca sinopsis en español para libros que no tienen descripción.
 * Solo admin.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const sellerId = req.nextUrl.searchParams.get("seller_id");

  // Use service role for updates
  const adminDb = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );

  // Get books without description
  let booksQuery = adminDb
    .from("books")
    .select("id, title, author, isbn, description")
    .or("description.is.null,description.eq.");

  if (sellerId) {
    const { data: listings } = await adminDb.from("listings").select("book_id").eq("seller_id", sellerId).eq("status", "active");
    const bookIds = listings?.map((l) => l.book_id) ?? [];
    if (bookIds.length === 0) return NextResponse.json({ message: "Este vendedor no tiene libros activos.", updated: 0 });
    booksQuery = booksQuery.in("id", bookIds);
  }

  const { data: books } = await booksQuery.limit(50);

  if (!books?.length) {
    return NextResponse.json({ message: "Todos los libros tienen sinopsis", updated: 0 });
  }

  let updated = 0;
  let failed = 0;
  const results: { title: string; status: string }[] = [];

  for (const book of books) {
    let description: string | null = null;

    // Try Google Books in Spanish first
    if (book.isbn) {
      try {
        const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
        if (apiKey && apiKey !== "AIza...") {
          // Spanish first
          for (const lang of ["es", ""]) {
            const langParam = lang ? `&langRestrict=${lang}` : "";
            const res = await fetch(
              `https://www.googleapis.com/books/v1/volumes?q=isbn:${book.isbn}${langParam}&key=${apiKey}`
            );
            if (res.ok) {
              const data = await res.json();
              const desc = data.items?.[0]?.volumeInfo?.description;
              if (desc) { description = desc; break; }
            }
          }
        }
      } catch {}
    }

    // Fallback: search by title + author in Spanish
    if (!description) {
      try {
        const q = encodeURIComponent(`${book.title} ${book.author}`);
        const res = await fetch(
          `https://www.googleapis.com/books/v1/volumes?q=${q}&langRestrict=es&maxResults=1${
            process.env.GOOGLE_BOOKS_API_KEY ? `&key=${process.env.GOOGLE_BOOKS_API_KEY}` : ""
          }`
        );
        if (res.ok) {
          const data = await res.json();
          description = data.items?.[0]?.volumeInfo?.description || null;
        }
      } catch {}
    }

    // Fallback: Open Library work description
    if (!description && book.isbn) {
      try {
        const res = await fetch(
          `https://openlibrary.org/api/books?bibkeys=ISBN:${book.isbn}&format=json&jscmd=details`
        );
        if (res.ok) {
          const data = await res.json();
          const details = data[`ISBN:${book.isbn}`]?.details;
          description = details?.description?.value ?? details?.description ?? null;

          // Try the work level
          if (!description && details?.works?.[0]?.key) {
            const workRes = await fetch(`https://openlibrary.org${details.works[0].key}.json`);
            if (workRes.ok) {
              const workData = await workRes.json();
              description = workData.description?.value ?? workData.description ?? null;
            }
          }
        }
      } catch {}
    }

    if (description) {
      await adminDb.from("books").update({ description }).eq("id", book.id);
      updated++;
      results.push({ title: book.title, status: "ok" });
    } else {
      failed++;
      results.push({ title: book.title, status: "no encontrada" });
    }

    // Rate limit: wait 200ms between API calls
    await new Promise((r) => setTimeout(r, 200));
  }

  return NextResponse.json({ updated, failed, total: books.length, results });
}
