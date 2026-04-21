"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { EmptyState } from "@/components/admin/SharedUI";

interface SearchQuery {
  id: string;
  query: string;
  normalized_query: string;
  results_count: number;
  created_at: string;
}

interface Aggregated {
  q: string;
  original: string;
  count: number;
  avgResults: number;
  withResults: number;
  without: number;
  lastSeen: string;
}

export default function SearchesTab() {
  const [raw, setRaw] = useState<SearchQuery[]>([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(7);
  const [view, setView] = useState<"top" | "gaps" | "all">("top");

  useEffect(() => {
    async function load() {
      setLoading(true);
      const supabase = createClient();
      const since = new Date(Date.now() - days * 864e5).toISOString();
      const { data, error } = await supabase
        .from("search_queries")
        .select("id, query, normalized_query, results_count, created_at")
        .gte("created_at", since)
        .order("created_at", { ascending: false });
      if (error) {
        console.error(error);
      } else {
        setRaw(data ?? []);
      }
      setLoading(false);
    }
    load();
  }, [days]);

  // Agrupar por normalized_query
  const counts: Record<string, Aggregated> = {};
  for (const r of raw) {
    const key = r.normalized_query;
    if (!counts[key]) {
      counts[key] = {
        q: key,
        original: r.query,
        count: 0,
        avgResults: 0,
        withResults: 0,
        without: 0,
        lastSeen: r.created_at,
      };
    }
    counts[key].count += 1;
    counts[key].avgResults += r.results_count;
    if (r.results_count > 0) counts[key].withResults += 1;
    else counts[key].without += 1;
    if (r.created_at > counts[key].lastSeen) counts[key].lastSeen = r.created_at;
  }
  const aggregated = Object.values(counts).map((c) => ({
    ...c,
    avgResults: c.count > 0 ? +(c.avgResults / c.count).toFixed(1) : 0,
  }));

  const topQueries = [...aggregated].sort((a, b) => b.count - a.count);
  const gapQueries = aggregated.filter((c) => c.without === c.count).sort((a, b) => b.count - a.count);

  return (
    <div className="space-y-6">
      {/* Controles */}
      <div className="flex flex-wrap items-center gap-3 bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex gap-2">
          <button
            onClick={() => setDays(1)}
            className={`px-3 py-1.5 rounded-lg text-sm ${days === 1 ? "bg-ink text-white" : "bg-gray-100 text-gray-600"}`}
          >
            24h
          </button>
          <button
            onClick={() => setDays(7)}
            className={`px-3 py-1.5 rounded-lg text-sm ${days === 7 ? "bg-ink text-white" : "bg-gray-100 text-gray-600"}`}
          >
            7 días
          </button>
          <button
            onClick={() => setDays(30)}
            className={`px-3 py-1.5 rounded-lg text-sm ${days === 30 ? "bg-ink text-white" : "bg-gray-100 text-gray-600"}`}
          >
            30 días
          </button>
        </div>
        <div className="h-5 w-px bg-gray-200" />
        <div className="flex gap-2">
          <button
            onClick={() => setView("top")}
            className={`px-3 py-1.5 rounded-lg text-sm ${view === "top" ? "bg-gold text-white" : "bg-gray-100 text-gray-600"}`}
          >
            Top búsquedas
          </button>
          <button
            onClick={() => setView("gaps")}
            className={`px-3 py-1.5 rounded-lg text-sm ${view === "gaps" ? "bg-gold text-white" : "bg-gray-100 text-gray-600"}`}
          >
            Gaps catálogo ({gapQueries.length})
          </button>
          <button
            onClick={() => setView("all")}
            className={`px-3 py-1.5 rounded-lg text-sm ${view === "all" ? "bg-gold text-white" : "bg-gray-100 text-gray-600"}`}
          >
            Historial
          </button>
        </div>
        <div className="ml-auto text-xs text-gray-500">
          {raw.length} búsquedas · {aggregated.length} únicas
        </div>
      </div>

      {loading && <p className="text-sm text-gray-500">Cargando búsquedas…</p>}

      {!loading && raw.length === 0 && (
        <EmptyState text={`Aún no hay búsquedas registradas en los últimos ${days} ${days === 1 ? "día" : "días"}. El tracking arrancó el 21 de abril 2026.`} />
      )}

      {!loading && raw.length > 0 && view === "top" && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs text-gray-500 uppercase">
                <th className="px-4 py-3 w-12">#</th>
                <th className="px-4 py-3">Query</th>
                <th className="px-4 py-3 w-20 text-right">Veces</th>
                <th className="px-4 py-3 w-24 text-right">Prom. resultados</th>
                <th className="px-4 py-3 w-32">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {topQueries.slice(0, 50).map((q, i) => (
                <tr key={q.q}>
                  <td className="px-4 py-2.5 text-gray-400">{i + 1}</td>
                  <td className="px-4 py-2.5 text-gray-900 font-medium">{q.original}</td>
                  <td className="px-4 py-2.5 text-right text-gray-900 font-semibold">{q.count}</td>
                  <td className="px-4 py-2.5 text-right text-gray-600">{q.avgResults}</td>
                  <td className="px-4 py-2.5">
                    {q.without === q.count ? (
                      <span className="inline-block px-2 py-0.5 rounded text-xs bg-red-50 text-red-700">🚫 Sin resultados</span>
                    ) : q.withResults === q.count ? (
                      <span className="inline-block px-2 py-0.5 rounded text-xs bg-green-50 text-green-700">✓ Con resultados</span>
                    ) : (
                      <span className="inline-block px-2 py-0.5 rounded text-xs bg-amber-50 text-amber-700">⚠ Mixto</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && raw.length > 0 && view === "gaps" && (
        <>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-900">
            <strong>Gaps del catálogo.</strong> Cada query de abajo es alguien que buscó y NO encontró nada. Publicar libros que respondan a estas queries = capturar demanda insatisfecha.
          </div>
          {gapQueries.length === 0 ? (
            <EmptyState text="Aún no hay queries con 0 resultados. ¡Buena señal o poca data todavía!" />
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-xs text-gray-500 uppercase">
                    <th className="px-4 py-3 w-12">#</th>
                    <th className="px-4 py-3">Query</th>
                    <th className="px-4 py-3 w-20 text-right">Veces</th>
                    <th className="px-4 py-3 w-40">Última vez</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {gapQueries.slice(0, 50).map((q, i) => (
                    <tr key={q.q}>
                      <td className="px-4 py-2.5 text-gray-400">{i + 1}</td>
                      <td className="px-4 py-2.5 text-gray-900 font-medium">{q.original}</td>
                      <td className="px-4 py-2.5 text-right text-red-700 font-semibold">{q.count}</td>
                      <td className="px-4 py-2.5 text-gray-500 text-xs">
                        {new Date(q.lastSeen).toLocaleString("es-CL", { dateStyle: "short", timeStyle: "short" })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {!loading && raw.length > 0 && view === "all" && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs text-gray-500 uppercase">
                <th className="px-4 py-3">Query</th>
                <th className="px-4 py-3 w-24 text-right">Resultados</th>
                <th className="px-4 py-3 w-40">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {raw.slice(0, 200).map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-2.5 text-gray-900">{r.query}</td>
                  <td className="px-4 py-2.5 text-right">
                    <span className={r.results_count === 0 ? "text-red-700 font-semibold" : "text-gray-600"}>
                      {r.results_count}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-gray-500 text-xs">
                    {new Date(r.created_at).toLocaleString("es-CL", { dateStyle: "short", timeStyle: "short" })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
