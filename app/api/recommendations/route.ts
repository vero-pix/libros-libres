import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const genres = searchParams.get("genres")?.split(",").filter(Boolean) ?? [];
  const authors = searchParams.get("authors")?.split(",").filter(Boolean) ?? [];
  const exclude = searchParams.get("exclude")?.split(",").filter(Boolean) ?? [];

  const supabase = await createClient();

  // If we have genres or authors, try to find matching listings
  if (genres.length > 0 || authors.length > 0) {
    let query = supabase
      .from("listings")
      .select(
        `id, slug, price, condition, modality, cover_image_url, status, created_at,
         book:books(id, title, author, cover_url, genre),
         seller:users(id, full_name, avatar_url, username, mercadopago_user_id)`
      )
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(30);

    if (exclude.length > 0) {
      query = query.not("id", "in", `(${exclude.join(",")})`);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const listings = data ?? [];

    // Score each listing by how well it matches viewed genres/authors
    const scored = listings.map((listing) => {
      let score = 0;
      const book = listing.book as unknown as { genre?: string; author?: string } | null;
      if (!book) return { listing, score };

      const bookGenre = book.genre ?? "";
      const bookAuthor = book.author ?? "";

      if (bookGenre && genres.some((g) => g.toLowerCase() === bookGenre.toLowerCase())) {
        score += 2;
      }
      if (bookAuthor && authors.some((a) => bookAuthor.toLowerCase().includes(a.toLowerCase()))) {
        score += 3;
      }
      return { listing, score };
    });

    // Filter to only those with a match, then sort by score desc
    const matched = scored
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)
      .map((s) => s.listing);

    if (matched.length > 0) {
      return NextResponse.json(matched, {
        headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
      });
    }
  }

  // Fallback: newest listings
  let fallbackQuery = supabase
    .from("listings")
    .select(
      `id, price, condition, modality, cover_image_url, status, created_at,
       book:books(id, title, author, cover_url, genre),
       seller:users(id, full_name, avatar_url, username, mercadopago_user_id)`
    )
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(6);

  if (exclude.length > 0) {
    fallbackQuery = fallbackQuery.not("id", "in", `(${exclude.join(",")})`);
  }

  const { data: fallbackData, error: fallbackError } = await fallbackQuery;

  if (fallbackError) {
    return NextResponse.json({ error: fallbackError.message }, { status: 500 });
  }

  return NextResponse.json(fallbackData ?? [], {
    headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
  });
}
