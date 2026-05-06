/**
 * GET  /api/v1/listings         — Lista tus listings activos
 * POST /api/v1/listings         — Crea un nuevo listing
 *
 * POST body:
 * {
 *   book_id?: string,           // UUID si el libro ya existe en BD
 *   isbn?: string,              // Si no hay book_id, se busca o crea por ISBN
 *   title: string,
 *   author?: string,
 *   publisher?: string,
 *   published_year?: number,
 *   description?: string,
 *   price: number,              // en CLP
 *   condition: "new" | "good" | "fair",
 *   modality?: "sale" | "rent" | "both",
 *   binding?: "tapa_blanda" | "tapa_dura",
 *   city_id?: number
 * }
 */
import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { authenticateApiKey, unauthorized } from "@/lib/apiAuth";
import { suggestTags } from "@/lib/tagSuggester";
import { normalizeGenre } from "@/lib/genreNormalizer";

const serviceSupabase = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

export async function GET(req: NextRequest) {
  const caller = await authenticateApiKey(req);
  if (!caller) return unauthorized();

  const supabase = serviceSupabase();
  const status = req.nextUrl.searchParams.get("status") ?? "active";
  const page = Math.max(1, parseInt(req.nextUrl.searchParams.get("page") ?? "1", 10));
  const limit = Math.min(100, parseInt(req.nextUrl.searchParams.get("limit") ?? "50", 10));
  const offset = (page - 1) * limit;

  const { data, count, error } = await supabase
    .from("listings")
    .select("id, price, condition, modality, status, created_at, book:books(id, isbn, title, author, publisher, published_year, cover_url, category, subcategory)", { count: "exact" })
    .eq("seller_id", caller.sellerId)
    .eq("status", status)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({
    listings: data ?? [],
    total: count ?? 0,
    page,
    limit,
  });
}

export async function POST(req: NextRequest) {
  const caller = await authenticateApiKey(req);
  if (!caller) return unauthorized();

  let body: any;
  try { body = await req.json(); } catch {
    return Response.json({ error: "Body JSON inválido" }, { status: 400 });
  }

  const { book_id, isbn, title, author, publisher, published_year, description,
          price, condition, modality = "sale", binding, city_id } = body;

  if (!title) return Response.json({ error: "El campo 'title' es requerido" }, { status: 400 });
  if (!price || isNaN(Number(price))) return Response.json({ error: "El campo 'price' es requerido y debe ser número" }, { status: 400 });
  if (!condition || !["new", "good", "fair"].includes(condition))
    return Response.json({ error: "condition debe ser: new | good | fair" }, { status: 400 });

  const supabase = serviceSupabase();
  let resolvedBookId: string = book_id;

  if (!resolvedBookId) {
    // Buscar por ISBN primero
    if (isbn) {
      const { data: existing } = await supabase
        .from("books")
        .select("id")
        .ilike("isbn", isbn.trim())
        .maybeSingle();
      if (existing) resolvedBookId = existing.id;
    }

    // Crear libro si no existe
    if (!resolvedBookId) {
      const normalized = normalizeGenre(null, title, description);
      const tags = suggestTags({
        title,
        author,
        category: normalized?.category,
        subcategory: normalized?.subcategory,
        description,
      });
      const { data: newBook, error: bookErr } = await supabase
        .from("books")
        .insert({
          isbn: isbn ?? null,
          title,
          author: author ?? null,
          publisher: publisher ?? null,
          published_year: published_year ?? null,
          description: description ?? null,
          category: normalized?.category ?? null,
          subcategory: normalized?.subcategory ?? null,
          tags,
          created_by: caller.sellerId,
        })
        .select("id")
        .single();

      if (bookErr) return Response.json({ error: bookErr.message }, { status: 500 });
      resolvedBookId = newBook.id;
    }
  }

  // Crear el listing
  const { data: listing, error: listingErr } = await supabase
    .from("listings")
    .insert({
      book_id: resolvedBookId,
      seller_id: caller.sellerId,
      price: Number(price),
      condition,
      modality,
      binding: binding ?? null,
      city_id: city_id ?? null,
      status: "active",
    })
    .select("id, price, condition, modality, status, created_at")
    .single();

  if (listingErr) return Response.json({ error: listingErr.message }, { status: 500 });

  return Response.json({ listing: { ...listing, book_id: resolvedBookId } }, { status: 201 });
}
