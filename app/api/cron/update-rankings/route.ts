import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getTrendScoresBatched } from "@/lib/trending";

export const maxDuration = 300; // 5 min — long-running cron
export const dynamic = "force-dynamic";

/**
 * POST /api/cron/update-rankings
 *
 * Called daily by Vercel Cron to update trending_score on listings
 * based on Google Trends data for Chile.
 *
 * Protected by CRON_SECRET header check.
 */
export async function GET(request: Request) {
  // Verify cron secret (Vercel sends this automatically for cron jobs)
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Fetch all active listings with book titles
  const { data: listings, error: fetchError } = await supabase
    .from("listings")
    .select("id, book:books(title, author)")
    .eq("status", "active");

  if (fetchError) {
    console.error("[cron/update-rankings] Fetch error:", fetchError);
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  if (!listings || listings.length === 0) {
    return NextResponse.json({ message: "No active listings", updated: 0 });
  }

  // Build keyword map: listing id -> search keyword (title + author)
  const listingKeywords = new Map<string, string>();
  for (const listing of listings as any[]) {
    const book = listing.book;
    if (!book?.title) continue;
    // Use "title autor" as keyword — more specific for trends
    const keyword = book.author
      ? `${book.title} ${book.author}`.slice(0, 100)
      : book.title.slice(0, 100);
    listingKeywords.set(listing.id, keyword);
  }

  // Deduplicate keywords to avoid querying the same one multiple times
  const uniqueKeywords = Array.from(new Set(Array.from(listingKeywords.values())));

  console.log(
    `[cron/update-rankings] Querying trends for ${uniqueKeywords.length} unique keywords from ${listings.length} listings`
  );

  // Query Google Trends in batches of 5 with 2s delays
  const scores = await getTrendScoresBatched(uniqueKeywords, 2000);

  // Update each listing's trending_score
  let updated = 0;
  let errors = 0;

  for (const [listingId, keyword] of Array.from(listingKeywords.entries())) {
    const score = scores.get(keyword) ?? 0;

    // Only update if we got a real score (> 0) to avoid wiping existing data
    // on Google Trends failures (which return 0)
    if (score === 0) continue;

    const { error: updateError } = await supabase
      .from("listings")
      .update({ trending_score: score })
      .eq("id", listingId);

    if (updateError) {
      errors++;
      console.error(
        `[cron/update-rankings] Update error for ${listingId}:`,
        updateError.message
      );
    } else {
      updated++;
    }
  }

  console.log(
    `[cron/update-rankings] Done. Updated: ${updated}, Errors: ${errors}`
  );

  return NextResponse.json({
    message: "Rankings updated",
    total: listings.length,
    uniqueKeywords: uniqueKeywords.length,
    updated,
    errors,
  });
}
