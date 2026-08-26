import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

/**
 * GET /api/seller/listing-views
 *
 * Returns the total view count per listing for the authenticated seller.
 * Only returns data for listings that belong to the logged-in user.
 * Uses the service role key to read page_views (no RLS restrictions),
 * but scopes the result to the seller's own listing IDs for privacy.
 */
export async function GET() {
  const supabase = await createClient();

  // Verify the user is logged in.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  // Fetch the seller's listing IDs using their own auth context.
  const { data: listings, error: listingError } = await supabase
    .from("listings")
    .select("id")
    .eq("seller_id", user.id);

  if (listingError) {
    return NextResponse.json({ error: listingError.message }, { status: 500 });
  }

  // If seller has no listings, return an empty map immediately.
  const listingIds = (listings ?? []).map((l) => l.id);
  if (listingIds.length === 0) {
    return NextResponse.json({ views: {} });
  }

  // Use service role client to query page_views (bypasses RLS).
  const serviceClient = createServiceRoleClient();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  /**
   * Trae TODAS las filas paginando.
   *
   * Acá vivía el bug: la consulta pedía `page_views` sin `.range()` y filtraba
   * los últimos 7 días en memoria. Supabase corta en 1.000 filas por defecto, y
   * las 215 publicaciones de vero acumulan 1.263 desde abril — así que llegaban
   * solo las 1.000 más antiguas, todas anteriores a la semana, y el contador
   * mostraba "0 visitas en tus libros los últimos 7 días" mientras los números
   * por libro seguían apareciendo. El vendedor con más catálogo era el que veía
   * la plataforma más muerta. (25 ago 2026)
   *
   * Mismo error que el commit b306871 en el contador del login.
   * Ver [[reference_supabase_techo_1000_filas]].
   */
  async function traerTodo(desdeFecha?: Date) {
    const filas: { listing_id: string | null; created_at: string }[] = [];
    for (let desde = 0; ; desde += 1000) {
      let q = serviceClient
        .from("page_views")
        .select("listing_id, created_at")
        .in("listing_id", listingIds)
        .order("created_at", { ascending: false })
        .range(desde, desde + 999);
      if (desdeFecha) q = q.gte("created_at", desdeFecha.toISOString());

      const { data, error } = await q;
      if (error) throw new Error(error.message);
      filas.push(...(data ?? []));
      if (!data || data.length < 1000) break;
    }
    return filas;
  }

  let historico: { listing_id: string | null; created_at: string }[];
  let semana: { listing_id: string | null; created_at: string }[];
  try {
    // La ventana semanal se filtra EN LA CONSULTA, no en memoria.
    [historico, semana] = await Promise.all([traerTodo(), traerTodo(sevenDaysAgo)]);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }

  // Aggregate: { listingId -> count } and calculate weekly total
  const viewMap: Record<string, number> = {};
  const weeklyMap: Record<string, number> = {};

  for (const row of historico) {
    if (!row.listing_id) continue;
    viewMap[row.listing_id] = (viewMap[row.listing_id] ?? 0) + 1;
  }
  for (const row of semana) {
    if (!row.listing_id) continue;
    weeklyMap[row.listing_id] = (weeklyMap[row.listing_id] ?? 0) + 1;
  }
  const totalWeeklyViews = semana.filter((r) => r.listing_id).length;

  return NextResponse.json({ 
    views: viewMap, 
    weeklyViews: weeklyMap,
    totalWeekly: totalWeeklyViews 
  });
}
