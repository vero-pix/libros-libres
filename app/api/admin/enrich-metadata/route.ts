import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServerClient } from "@supabase/ssr";

interface Meta {
  publisher: string | null;
  pages: number | null;
  description: string | null;
}

async function fetchFromGoogle(isbn: string, title: string, author: string): Promise<Meta | null> {
  const clean = isbn.replace(/[-\s]/g, "");
  const queries = clean ? [`isbn:${clean}`, `${title} ${author}`] : [`${title} ${author}`];
  for (const query of queries) {
    try {
      const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=1`;
      const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (!res.ok) continue;
      const data = await res.json();
      if (data.error || !data.items?.length) continue;
      const v = data.items[0].volumeInfo;
      if (v.publisher || v.pageCount || v.description) {
        return { publisher: v.publisher ?? null, pages: v.pageCount ?? null, description: v.description ?? null };
      }
    } catch { continue; }
  }
  return null;
}

async function fetchFromOpenLibrary(isbn: string): Promise<Meta | null> {
  const clean = isbn.replace(/[-\s]/g, "");
  if (!clean) return null;
  try {
    const [dataRes, detailsRes] = await Promise.all([
      fetch(`https://openlibrary.org/api/books?bibkeys=ISBN:${clean}&format=json&jscmd=data`, { signal: AbortSignal.timeout(5000) }),
      fetch(`https://openlibrary.org/api/books?bibkeys=ISBN:${clean}&format=json&jscmd=details`, { signal: AbortSignal.timeout(5000) }),
    ]);
    const dataJson = dataRes.ok ? await dataRes.json() : {};
    const bookData = dataJson[`ISBN:${clean}`];
    const detailsJson = detailsRes.ok ? await detailsRes.json() : {};
    const details = detailsJson[`ISBN:${clean}`]?.details ?? {};

    const publisher = bookData?.publishers?.[0]?.name ?? details?.publishers?.[0] ?? null;
    const pages = details?.number_of_pages ?? bookData?.number_of_pages ?? null;
    const description = details?.description?.value ?? details?.description ?? null;

    if (publisher || pages || description) return { publisher, pages, description: typeof description === "string" ? description : null };
  } catch { /* ok */ }
  return null;
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const sellerId = new URL(req.url).searchParams.get("seller_id");

  const adminDb = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } },
  );

  let books: any[] | null;
  if (sellerId) {
    // Get book IDs for this seller's active listings
    const { data: listings } = await adminDb.from("listings").select("book_id").eq("seller_id", sellerId).eq("status", "active");
    const bookIds = listings?.map((l) => l.book_id) ?? [];
    if (bookIds.length === 0) return NextResponse.json({ summary: "Este vendedor no tiene libros activos." });
    const { data } = await adminDb.from("books").select("id, isbn, title, author, publisher, pages, description").in("id", bookIds);
    books = data;
  } else {
    const { data } = await adminDb.from("books").select("id, isbn, title, author, publisher, pages, description");
    books = data;
  }

  if (!books?.length) return NextResponse.json({ summary: "No hay libros en la base de datos." });

  const needsEnrich = books.filter((b) => !b.publisher || !b.pages || !b.description);
  let enriched = 0;
  const details: string[] = [];

  for (const book of needsEnrich) {
    // Rate limit
    await new Promise((r) => setTimeout(r, 400));

    let meta: Meta | null = null;
    const google = await fetchFromGoogle(book.isbn ?? "", book.title, book.author ?? "");
    const ol = book.isbn ? await fetchFromOpenLibrary(book.isbn) : null;

    if (google && ol) {
      meta = { publisher: google.publisher ?? ol.publisher, pages: google.pages ?? ol.pages, description: google.description ?? ol.description };
    } else {
      meta = google ?? ol;
    }

    if (!meta) continue;

    const updates: Record<string, unknown> = {};
    if (!book.publisher && meta.publisher) updates.publisher = meta.publisher;
    if (!book.pages && meta.pages) updates.pages = meta.pages;
    if (!book.description && meta.description) {
      const d = meta.description;
      const hasSpanish = /\b(el|la|los|las|del|por|una|con|que|en|de|su|este|esta|como|para|más|entre|sobre|desde|hasta|pero|sino|también|tiene|puede|hace|sido|está|fue|ser|hay|sus|nos|muy)\b/i.test(d);
      const isSpam = d.includes("13-digit number") || d.includes("ISBN Handbook");
      if (hasSpanish && !isSpam) updates.description = d;
    }

    if (Object.keys(updates).length > 0) {
      await adminDb.from("books").update(updates).eq("id", book.id);
      enriched++;
      details.push(`${book.title}: ${Object.keys(updates).join(", ")}`);
    }
  }

  const summary = `Enriquecidos: ${enriched} de ${needsEnrich.length} libros pendientes (${books.length} total).\n\n${details.join("\n")}`;
  return NextResponse.json({ summary });
}
