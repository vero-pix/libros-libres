import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json([]);
  }

  const supabase = await createClient();
  const term = `%${q}%`;

  const { data: books } = await supabase
    .from("books")
    .select("id, title, author, cover_url")
    .or(`title.ilike.${term},author.ilike.${term}`)
    .limit(8);

  const suggestions = (books ?? []).map((b) => ({
    id: b.id,
    title: b.title,
    author: b.author,
    cover_url: b.cover_url,
  }));

  return NextResponse.json(suggestions);
}
