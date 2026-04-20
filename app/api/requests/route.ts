import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/requests
 * Lista solicitudes públicas (sin datos de contacto).
 * Por defecto: últimas 20 no resueltas.
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 20), 100);
  const includeFulfilled = url.searchParams.get("include_fulfilled") === "1";

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );

  let query = supabase
    .from("book_requests")
    .select("id, title, author, isbn, notes, requester_location, fulfilled, fulfilled_listing_id, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (!includeFulfilled) query = query.eq("fulfilled", false);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ requests: data ?? [] });
}

/**
 * POST /api/requests
 * Crea una solicitud. No requiere login (mejor UX), pero si hay sesión la vinculamos.
 */
export async function POST(req: NextRequest) {
  const { title, author, isbn, notes, requester_name, requester_email, requester_whatsapp, requester_location } =
    (await req.json()) as {
      title?: string;
      author?: string;
      isbn?: string;
      notes?: string;
      requester_name?: string;
      requester_email?: string;
      requester_whatsapp?: string;
      requester_location?: string;
    };

  if (!title || title.trim().length < 2) {
    return NextResponse.json({ error: "Falta el título del libro" }, { status: 400 });
  }

  // Tomar el usuario logueado si existe
  const ssrClient = await createClient();
  const {
    data: { user },
  } = await ssrClient.auth.getUser();

  const admin = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );

  const { data, error } = await admin
    .from("book_requests")
    .insert({
      title: title.trim(),
      author: author?.trim() || null,
      isbn: isbn?.trim() || null,
      notes: notes?.trim() || null,
      requester_name: requester_name?.trim() || null,
      requester_email: requester_email?.trim() || null,
      requester_whatsapp: requester_whatsapp?.trim() || null,
      requester_location: requester_location?.trim() || null,
      requester_user_id: user?.id ?? null,
    })
    .select("id, title, author")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ request: data }, { status: 201 });
}
