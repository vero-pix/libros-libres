import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Reseñas a nivel de OBRA (books.id). Independientes de la copia (listing).
 * La misma reseña se muestra en TODAS las copias del mismo libro.
 */

const MAX_BODY = 2000;
const MAX_TITLE = 120;

/** GET /api/book-reviews?bookId=xxx — reseñas publicadas de la obra */
export async function GET(req: NextRequest) {
  const bookId = req.nextUrl.searchParams.get("bookId");
  if (!bookId) {
    return NextResponse.json({ error: "bookId requerido" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("book_reviews")
    .select("id, rating, title, body, is_editorial, author_label, created_at, reviewer:users!book_reviews_reviewer_id_fkey(id, full_name)")
    .eq("book_id", bookId)
    .eq("status", "published")
    // Editorial primero, luego las más recientes.
    .order("is_editorial", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ reviews: data ?? [] });
}

/**
 * POST /api/book-reviews — crea o edita la reseña del usuario para esa obra.
 * Body: { bookId, rating, title?, body }. Un usuario, una reseña por obra (upsert).
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Debes iniciar sesión para reseñar" }, { status: 401 });
  }

  const { bookId, rating, title, body } = await req.json();

  if (!bookId || !body?.trim()) {
    return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
  }

  const ratingNum = Number(rating);
  if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
    return NextResponse.json({ error: "La nota debe ser de 1 a 5 estrellas" }, { status: 400 });
  }

  const cleanBody = body.trim().slice(0, MAX_BODY);
  const cleanTitle = title?.trim().slice(0, MAX_TITLE) || null;

  // Upsert sobre UNIQUE(book_id, reviewer_id): una reseña por usuario y obra.
  const { data, error } = await supabase
    .from("book_reviews")
    .upsert(
      {
        book_id: bookId,
        reviewer_id: user.id,
        rating: ratingNum,
        title: cleanTitle,
        body: cleanBody,
        is_editorial: false,
        status: "published",
      },
      { onConflict: "book_id,reviewer_id" }
    )
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ id: data.id });
}
