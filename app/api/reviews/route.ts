import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

function createSupabaseFromCookies(cookieStore: Awaited<ReturnType<typeof cookies>>) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            try { cookieStore.set(name, value, options); } catch { /* ignore in RSC */ }
          });
        },
      },
    }
  );
}

/** GET /api/reviews?listing_id=xxx */
export async function GET(req: NextRequest) {
  const listingId = req.nextUrl.searchParams.get("listing_id");
  if (!listingId) {
    return NextResponse.json({ error: "listing_id required" }, { status: 400 });
  }

  const cookieStore = await cookies();
  const supabase = createSupabaseFromCookies(cookieStore);

  const { data: reviews, error } = await supabase
    .from("reviews")
    .select("id, listing_id, reviewer_id, rating, comment, created_at, reviewer:users(id, full_name)")
    .eq("listing_id", listingId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ reviews });
}

/** POST /api/reviews — { listing_id, rating, comment? } */
export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createSupabaseFromCookies(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const body = await req.json();
  const { listing_id, rating, comment } = body;

  if (!listing_id || !rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "listing_id y rating (1-5) requeridos" }, { status: 400 });
  }

  // Check that user has bought or rented this listing
  const { data: order } = await supabase
    .from("orders")
    .select("id")
    .eq("listing_id", listing_id)
    .eq("buyer_id", user.id)
    .eq("status", "paid")
    .limit(1)
    .maybeSingle();

  const { data: rental } = await supabase
    .from("rentals")
    .select("id")
    .eq("listing_id", listing_id)
    .eq("renter_id", user.id)
    .eq("status", "paid")
    .limit(1)
    .maybeSingle();

  if (!order && !rental) {
    return NextResponse.json({ error: "Solo puedes reseñar libros que hayas comprado o arrendado" }, { status: 403 });
  }

  const { data: review, error } = await supabase
    .from("reviews")
    .insert({
      listing_id,
      reviewer_id: user.id,
      rating: Math.round(rating),
      comment: comment?.trim() || null,
    })
    .select("id, rating, comment, created_at")
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Ya dejaste una reseña para este libro" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ review }, { status: 201 });
}
