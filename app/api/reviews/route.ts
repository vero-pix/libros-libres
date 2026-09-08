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

/**
 * Tope de caracteres del comentario (decisión C5).
 * Sin `export`: un archivo de ruta de Next solo puede exportar los handlers y
 * las opciones de segmento. Exportarlo rompe el build con "does not match the
 * required types of a Next.js Route".
 */
const COMENTARIO_MAX = 300;

/**
 * POST /api/reviews — { listing_id, rating, comment? }
 *
 * Reseña de vendedor. Desde el 08-09-2026 exige una orden **entregada**
 * (decisión C5): la policy `Comprador resena su orden entregada` verifica lo
 * mismo en la base, y esta ruta lo valida antes para poder devolver un mensaje
 * que se entienda en vez de un error de RLS.
 *
 * `order_id` y `seller_id` NO los manda el cliente: se derivan de la orden acá.
 * Así el cliente no puede declarar un vendedor que no corresponde, y la policy
 * lo vuelve a comprobar contra la misma orden.
 *
 * El arriendo dejó de dar derecho a reseña: se descontinuó el 24-07-2026 y su
 * flujo nunca produjo una orden entregada, así que no calzaba con la policy.
 */
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

  const texto = typeof comment === "string" ? comment.trim() : "";
  if (texto.length > COMENTARIO_MAX) {
    return NextResponse.json(
      { error: `El comentario no puede pasar de ${COMENTARIO_MAX} caracteres` },
      { status: 400 }
    );
  }

  // La orden entregada es la que habilita la reseña y la que aporta order_id y
  // seller_id. Se pide la más reciente por si el mismo comprador le compró el
  // mismo ejemplar más de una vez (posible con un listing repuesto).
  const { data: entregada } = await supabase
    .from("orders")
    .select("id, seller_id")
    .eq("listing_id", listing_id)
    .eq("buyer_id", user.id)
    .eq("status", "delivered")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!entregada) {
    // Se distingue "no lo compraste" de "todavía no lo marcas como recibido":
    // el segundo caso tiene arreglo y el comprador tiene que saber cuál es.
    const { data: enCurso } = await supabase
      .from("orders")
      .select("id")
      .eq("listing_id", listing_id)
      .eq("buyer_id", user.id)
      .in("status", ["paid", "shipped"])
      .limit(1)
      .maybeSingle();

    if (enCurso) {
      return NextResponse.json(
        { error: "Puedes reseñar cuando marques el pedido como recibido en Mis Pedidos." },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { error: "Solo puedes reseñar libros que hayas comprado acá." },
      { status: 403 }
    );
  }

  const { data: review, error } = await supabase
    .from("reviews")
    .insert({
      listing_id,
      reviewer_id: user.id,
      order_id: entregada.id,
      seller_id: entregada.seller_id,
      rating: Math.round(rating),
      comment: texto || null,
    })
    .select("id, rating, comment, created_at")
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Ya dejaste una reseña para esta compra" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ review }, { status: 201 });
}
