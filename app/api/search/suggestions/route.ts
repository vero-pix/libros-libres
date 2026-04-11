import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json([]);
  }

  const supabase = await createClient();
  // Strip parentheses that break PostgREST or() syntax
  const clean = q.replace(/[()]/g, "").trim();
  if (!clean) return NextResponse.json([]);
  const term = `%${clean}%`;

  const { data: listings } = await supabase
    .from("listings")
    .select("id, slug, book:books!inner(id, title, author, cover_url), seller:users(username)")
    .eq("status", "active")
    .or(`title.ilike.${term},author.ilike.${term}`, { referencedTable: "books" })
    .limit(8);

  const suggestions = (listings ?? []).map((l: any) => ({
    id: l.id,
    slug: l.slug,
    username: l.seller?.username ?? null,
    title: l.book.title,
    author: l.book.author,
    cover_url: l.book.cover_url,
  }));

  return NextResponse.json(suggestions);
}
