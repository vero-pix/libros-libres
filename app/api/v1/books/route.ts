/**
 * GET /api/v1/books?isbn=978...
 * Busca un libro por ISBN en la base de datos.
 * Útil para verificar si un libro ya existe antes de crear un listing.
 */
import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { authenticateApiKey, unauthorized } from "@/lib/apiAuth";

const serviceSupabase = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

export async function GET(req: NextRequest) {
  const caller = await authenticateApiKey(req);
  if (!caller) return unauthorized();

  const isbn = req.nextUrl.searchParams.get("isbn");
  const title = req.nextUrl.searchParams.get("title");

  if (!isbn && !title) {
    return Response.json({ error: "Debes pasar ?isbn= o ?title=" }, { status: 400 });
  }

  const supabase = serviceSupabase();
  let query = supabase.from("books").select("id, isbn, title, author, publisher, published_year, cover_url, category, subcategory");

  if (isbn) {
    query = query.ilike("isbn", isbn.trim());
  } else if (title) {
    query = query.ilike("title", `%${title.trim()}%`).limit(10);
  }

  const { data, error } = await query;
  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ books: data ?? [] });
}
