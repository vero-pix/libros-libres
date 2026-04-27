import Link from "next/link";
import { createPublicClient } from "@/lib/supabase/public";

interface BookRequest {
  id: string;
  title: string;
  author: string | null;
  requester_location: string | null;
  created_at: string;
}

export default async function RequestsRow() {
  const supabase = createPublicClient();

  // Fetch unfulfilled book requests — direct demand from buyers.
  const { data: requests } = await supabase
    .from("book_requests")
    .select("id, title, author, requester_location, created_at")
    .eq("fulfilled", false)
    .order("created_at", { ascending: false })
    .limit(4);

  // Fetch raw search queries from the last 7 days (with OR without results).
  // A wider window + all results makes this section resilient — it won't
  // vanish just because no one searched with 0 results in the last 48h.
  const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data: rawSearches } = await supabase
    .from("search_queries")
    .select("query, results_count, created_at")
    .gt("created_at", since7d)
    .order("created_at", { ascending: false })
    .limit(200); // Fetch more so we can rank after deduplication.

  // Deduplicate searches by normalized query and rank by frequency.
  // Prefer queries with 0 results (true gap in catalog) but show all if needed.
  const queryCounts = new Map<string, { original: string; count: number; hasGap: boolean }>();
  for (const s of rawSearches ?? []) {
    const key = s.query.trim().toLowerCase();
    if (!key || key.length < 3) continue; // Skip noise (very short queries).
    const existing = queryCounts.get(key);
    if (existing) {
      existing.count += 1;
      if (s.results_count === 0) existing.hasGap = true;
    } else {
      queryCounts.set(key, {
        original: s.query.trim(),
        count: 1,
        hasGap: s.results_count === 0,
      });
    }
  }

  // Sort: catalog gaps first, then by frequency descending.
  const topSearches = Array.from(queryCounts.values())
    .sort((a, b) => {
      if (a.hasGap !== b.hasGap) return a.hasGap ? -1 : 1;
      return b.count - a.count;
    })
    .slice(0, 4);

  const hasContent =
    (requests && requests.length > 0) || topSearches.length > 0;

  // Nothing to show at all — hide section completely.
  if (!hasContent) return null;

  // Build unified demand items merging book_requests + top search queries.
  const demandItems = [
    ...(requests ?? []).map((r) => ({ ...r, type: "request" as const })),
    ...topSearches.map((s) => ({
      id: `s-${s.original}`,
      title: s.original,
      author: null as string | null,
      // Show search frequency as social proof for sellers.
      requester_location: s.count > 1 ? `${s.count} búsquedas esta semana` : "Alguien esta semana",
      type: "search" as const,
    })),
  ].slice(0, 8);

  return (
    <section className="bg-gradient-to-br from-amber-50 via-cream-warm to-amber-100/60 border-y border-amber-200/60">
      <div className="max-w-7xl mx-auto px-6 py-10 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-8 items-start">
          {/* Left — concept */}
          <div className="max-w-sm">
            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-amber-800">
                Economía inversa
              </span>
              <span className="text-[10px] font-medium text-amber-700/70">· nuevo</span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-ink leading-tight mb-3">
              Se busca.{" "}
              <span className="italic text-amber-700">La comunidad pide.</span>
            </h2>
            <p className="text-sm text-ink-muted leading-relaxed mb-4">
              Acá los compradores piden libros que no están en el catálogo. Si
              eres vendedor y tienes alguno, publícalo — hay un lector esperando.
            </p>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/solicitudes"
                className="inline-flex items-center px-4 py-2 bg-amber-700 text-white text-xs font-semibold uppercase tracking-wider rounded-md hover:bg-amber-800 transition-colors"
              >
                Pedir un libro
              </Link>
              <Link
                href="/publish"
                className="inline-flex items-center px-4 py-2 bg-white border border-amber-700/40 text-amber-800 text-xs font-semibold uppercase tracking-wider rounded-md hover:border-amber-800 hover:bg-amber-50 transition-colors"
              >
                Publicar el mío
              </Link>
            </div>
          </div>

          {/* Right — list */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {demandItems.map((r) => (
              <Link
                key={r.id}
                href={`/publish?title=${encodeURIComponent(r.title)}${r.author ? `&author=${encodeURIComponent(r.author)}` : ""}`}
                className="group bg-white/90 backdrop-blur rounded-xl border border-amber-200 hover:border-amber-500 hover:shadow-md p-4 transition-all"
              >
                <div className="flex items-start gap-3">
                  <span className={`text-[10px] uppercase tracking-[0.2em] font-bold px-2 py-0.5 rounded-full whitespace-nowrap mt-0.5 ${
                    r.type === 'request' ? 'text-amber-700 bg-amber-100' : 'text-orange-700 bg-orange-100'
                  }`}>
                    {r.type === 'request' ? 'Se busca' : 'Demanda hoy'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-display font-bold text-sm text-ink leading-snug line-clamp-2 group-hover:text-amber-800 transition-colors">
                      {r.title}
                    </p>
                    {r.author && (
                      <p className="text-xs text-ink-muted italic line-clamp-1 mt-0.5">
                        {r.author}
                      </p>
                    )}
                    {r.requester_location && (
                      <p className="text-[11px] text-amber-800 font-semibold mt-1.5 flex items-center gap-1">
                        <span aria-hidden>📍</span> {r.requester_location}
                      </p>
                    )}
                    <p className="text-[10px] text-amber-700 font-semibold uppercase tracking-wider mt-2 group-hover:text-amber-900">
                      ¿Lo tienes? Publícalo →
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
