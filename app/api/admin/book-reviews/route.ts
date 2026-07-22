import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

/**
 * Siembra EDITORIAL de reseñas de obra (anti cold-start).
 * Solo admin. Inserta reseñas firmadas como el medio (is_editorial=true,
 * reviewer_id=NULL, author_label). JAMÁS usuarios falsos: son reseñas honestas
 * del equipo, marcadas y firmadas como tales.
 *
 * Usa el service role porque la reseña editorial no tiene reviewer_id y no
 * pasaría la RLS de "usuario crea su reseña".
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { bookId, rating, title, body, authorLabel } = await req.json();

  if (!bookId || !body?.trim()) {
    return NextResponse.json({ error: "Faltan datos (bookId y body)" }, { status: 400 });
  }

  // rating es opcional para editorial; si viene, debe ser 1-5.
  let ratingNum: number | null = null;
  if (rating != null && rating !== "") {
    ratingNum = Number(rating);
    if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return NextResponse.json({ error: "rating debe ser 1-5 o vacío" }, { status: 400 });
    }
  }

  const admin = createServiceRoleClient();

  // Una editorial por obra (índice parcial único book_reviews_one_editorial_idx).
  // Upsert manual: si ya existe editorial para la obra, la actualiza.
  const { data: existing } = await admin
    .from("book_reviews")
    .select("id")
    .eq("book_id", bookId)
    .eq("is_editorial", true)
    .maybeSingle();

  const payload = {
    book_id: bookId,
    reviewer_id: null,
    author_label: authorLabel?.trim() || "Equipo tuslibros",
    rating: ratingNum,
    title: title?.trim() || null,
    body: body.trim(),
    is_editorial: true,
    status: "published" as const,
  };

  const query = existing
    ? admin.from("book_reviews").update(payload).eq("id", existing.id).select("id").single()
    : admin.from("book_reviews").insert(payload).select("id").single();

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ id: data.id, updated: !!existing });
}
