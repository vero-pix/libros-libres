import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("listings")
    .select(
      `
      id,
      modality,
      price,
      condition,
      notes,
      latitude,
      longitude,
      address,
      status,
      deprioritized,
      created_at,
      book:books (
        id,
        title,
        author,
        cover_url,
        genre,
        isbn
      ),
      seller:users (
        id,
        full_name,
        avatar_url
      )
    `
    )
    .eq("status", "active")
    .not("latitude", "is", null)
    .not("longitude", "is", null)
    .order("deprioritized", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? [], {
    headers: { "Cache-Control": "no-store" },
  });
}
