import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/seller/listing-views
 *
 * Returns the total view count per listing for the authenticated seller.
 * Only returns data for listings that belong to the logged-in user.
 * Uses the service role key internally to read page_views (admin table),
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

  // Fetch the seller's listing IDs.
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

  // Query page_views for those listing IDs — no date limit so it's cumulative.
  const { data: views, error: viewError } = await supabase
    .from("page_views")
    .select("listing_id")
    .in("listing_id", listingIds);

  if (viewError) {
    return NextResponse.json({ error: viewError.message }, { status: 500 });
  }

  // Aggregate: { listingId -> count }
  const viewMap: Record<string, number> = {};
  for (const row of views ?? []) {
    if (!row.listing_id) continue;
    viewMap[row.listing_id] = (viewMap[row.listing_id] ?? 0) + 1;
  }

  return NextResponse.json({ views: viewMap });
}
