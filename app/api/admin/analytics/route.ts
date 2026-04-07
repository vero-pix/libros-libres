import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** GET /api/admin/analytics?days=7 */
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  // Check admin
  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const days = parseInt(req.nextUrl.searchParams.get("days") ?? "7", 10);
  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data: views } = await supabase
    .from("page_views")
    .select("path, browser, os, device, user_id, listing_id, session_id, created_at")
    .gte("created_at", since.toISOString())
    .order("created_at", { ascending: false })
    .limit(5000);

  const rows = views ?? [];

  // Aggregate
  const totalViews = rows.length;
  const uniqueSessions = new Set(rows.map((r) => r.session_id).filter(Boolean)).size;
  const loggedInViews = rows.filter((r) => r.user_id).length;

  // Group by browser
  const browsers: Record<string, number> = {};
  for (const r of rows) {
    browsers[r.browser] = (browsers[r.browser] ?? 0) + 1;
  }

  // Group by OS
  const osStat: Record<string, number> = {};
  for (const r of rows) {
    osStat[r.os] = (osStat[r.os] ?? 0) + 1;
  }

  // Group by device
  const devices: Record<string, number> = {};
  for (const r of rows) {
    devices[r.device] = (devices[r.device] ?? 0) + 1;
  }

  // Top pages
  const pageCounts: Record<string, number> = {};
  for (const r of rows) {
    pageCounts[r.path] = (pageCounts[r.path] ?? 0) + 1;
  }
  const topPages = Object.entries(pageCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([path, count]) => ({ path, count }));

  // Views per day
  const dailyCounts: Record<string, number> = {};
  for (const r of rows) {
    const day = r.created_at.slice(0, 10);
    dailyCounts[day] = (dailyCounts[day] ?? 0) + 1;
  }
  const daily = Object.entries(dailyCounts)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, count]) => ({ date, count }));

  // Top listings viewed
  const listingCounts: Record<string, number> = {};
  for (const r of rows) {
    if (r.listing_id) {
      listingCounts[r.listing_id] = (listingCounts[r.listing_id] ?? 0) + 1;
    }
  }
  const topListingIds = Object.entries(listingCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  let topListings: { id: string; title: string; author: string; views: number }[] = [];
  if (topListingIds.length > 0) {
    const { data: listingsData } = await supabase
      .from("listings")
      .select("id, book:books(title, author)")
      .in("id", topListingIds.map(([id]) => id));

    const listingMap = new Map((listingsData ?? []).map((l: any) => [l.id, l]));
    topListings = topListingIds.map(([id, count]) => {
      const l = listingMap.get(id) as any;
      return {
        id,
        title: l?.book?.title ?? "—",
        author: l?.book?.author ?? "—",
        views: count,
      };
    });
  }

  return NextResponse.json({
    totalViews,
    uniqueSessions,
    loggedInViews,
    browsers,
    os: osStat,
    devices,
    topPages,
    topListings,
    daily,
    days,
  });
}
