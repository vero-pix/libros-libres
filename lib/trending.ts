/**
 * Google Trends integration for Chile book ranking.
 *
 * Uses `google-trends-api` to fetch interest-over-time data
 * scoped to Chile (geo: "CL") and returns a 0-100 score per keyword.
 */

// google-trends-api ships no types
const googleTrends = require("google-trends-api"); // eslint-disable-line

export interface TrendScore {
  keyword: string;
  score: number; // 0-100
}

/**
 * Query Google Trends for a batch of keywords (max 5) in Chile.
 * Returns a score (average interest over the last 30 days) for each keyword.
 */
export async function getTrendScores(
  keywords: string[]
): Promise<TrendScore[]> {
  if (keywords.length === 0) return [];
  if (keywords.length > 5) {
    throw new Error("Google Trends supports max 5 keywords per request");
  }

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  try {
    const rawResult = await googleTrends.interestOverTime({
      keyword: keywords,
      geo: "CL",
      startTime: thirtyDaysAgo,
      endTime: now,
    });

    const parsed = JSON.parse(rawResult);
    const timelineData = parsed?.default?.timelineData ?? [];

    // For each keyword, compute average interest across all data points
    const scores: TrendScore[] = keywords.map((kw, idx) => {
      if (timelineData.length === 0) {
        return { keyword: kw, score: 0 };
      }
      const sum = timelineData.reduce(
        (acc: number, point: any) => acc + (point.value?.[idx] ?? 0),
        0
      );
      const avg = Math.round(sum / timelineData.length);
      return { keyword: kw, score: Math.min(100, Math.max(0, avg)) };
    });

    return scores;
  } catch (err) {
    console.error("[trending] Google Trends error:", err);
    // Return 0 scores on failure so we don't wipe existing data
    return keywords.map((kw) => ({ keyword: kw, score: 0 }));
  }
}

/**
 * Process a large list of keywords in batches of 5, with delays between batches
 * to respect Google Trends rate limits.
 */
export async function getTrendScoresBatched(
  keywords: string[],
  delayMs = 2000
): Promise<Map<string, number>> {
  const results = new Map<string, number>();

  for (let i = 0; i < keywords.length; i += 5) {
    const batch = keywords.slice(i, i + 5);
    const scores = await getTrendScores(batch);
    for (const s of scores) {
      results.set(s.keyword, s.score);
    }

    // Delay between batches to avoid rate limiting
    if (i + 5 < keywords.length) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return results;
}
