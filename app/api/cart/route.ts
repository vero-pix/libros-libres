import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** GET /api/cart — list cart items */
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ items: [] });

  const { data } = await supabase
    .from("cart_items")
    .select(`
      id, added_at,
      listing:listings(id, price, status, cover_image_url,
        book:books(title, author, cover_url),
        seller:users(id, full_name)
      )
    `)
    .eq("user_id", user.id)
    .order("added_at", { ascending: false });

  return NextResponse.json({ items: data ?? [] });
}

/** POST /api/cart — add item */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { listing_id } = await req.json();
  if (!listing_id) return NextResponse.json({ error: "Falta listing_id" }, { status: 400 });

  const { error } = await supabase
    .from("cart_items")
    .upsert({ user_id: user.id, listing_id }, { onConflict: "user_id,listing_id" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

/** DELETE /api/cart — remove item */
export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { listing_id } = await req.json();
  if (!listing_id) return NextResponse.json({ error: "Falta listing_id" }, { status: 400 });

  await supabase
    .from("cart_items")
    .delete()
    .eq("user_id", user.id)
    .eq("listing_id", listing_id);

  return NextResponse.json({ ok: true });
}
