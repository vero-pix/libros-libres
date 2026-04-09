import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/books
 * Filtra libros por categoría, subcategoría, tags, precio, condición.
 * Soporta paginación y sorting.
 */
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const params = req.nextUrl.searchParams;

  const category = params.get("category");
  const subcategory = params.get("subcategory");
  const tags = params.getAll("tag");
  const priceMin = params.get("price_min");
  const priceMax = params.get("price_max");
  const condition = params.get("condition");
  const sortBy = params.get("sort_by") ?? "created_at";
  const sortOrder = params.get("sort_order") === "asc" ? true : false;
  const page = Math.max(1, parseInt(params.get("page") ?? "1", 10));
  const limit = Math.min(50, Math.max(1, parseInt(params.get("limit") ?? "20", 10)));
  const offset = (page - 1) * limit;

  let query = supabase
    .from("listings")
    .select(
      `*, book:books!inner(*), seller:users(id, full_name, avatar_url, username)`,
      { count: "exact" }
    )
    .eq("status", "active");

  if (category) query = query.eq("book.category", category);
  if (subcategory) query = query.eq("book.subcategory", subcategory);
  if (tags.length > 0) query = query.overlaps("book.tags", tags);
  if (condition) query = query.eq("condition", condition);
  if (priceMin) query = query.gte("price", Number(priceMin));
  if (priceMax) query = query.lte("price", Number(priceMax));

  // Sorting
  const validSorts = ["price", "created_at", "title"];
  const sortField = validSorts.includes(sortBy) ? sortBy : "created_at";
  if (sortField === "title") {
    // Can't sort by joined field easily, use default
    query = query.order("created_at", { ascending: false });
  } else {
    query = query.order(sortField, { ascending: sortOrder });
  }

  query = query.range(offset, offset + limit - 1);

  const { data, count, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    data: data ?? [],
    count: count ?? 0,
    filters: { category, subcategory, tags, priceMin, priceMax, condition },
    page,
    limit,
    totalPages: Math.ceil((count ?? 0) / limit),
  });
}
