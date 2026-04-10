"use client";

import { useState } from "react";
import type { AdminUser } from "./types";

const TOOLS = [
  { key: "covers", label: "Buscar portadas faltantes", desc: "Busca portadas en Open Library y Google Books para libros sin imagen", url: "/api/admin/backfill-covers", method: "GET" as const },
  { key: "audit", label: "Auditar portadas rotas", desc: "Verifica que las URLs de portada existentes realmente funcionen", url: "/api/admin/audit-covers", method: "GET" as const },
  { key: "descriptions", label: "Enriquecer sinopsis", desc: "Busca sinopsis en español para libros sin descripción", url: "/api/admin/backfill-descriptions", method: "POST" as const },
  { key: "metadata", label: "Enriquecer metadata", desc: "Busca editorial, páginas y sinopsis en Google Books y Open Library", url: "/api/admin/enrich-metadata", method: "POST" as const },
];

export default function ToolsTab({ users }: { users: AdminUser[] }) {
  const [results, setResults] = useState<Record<string, { loading: boolean; result: string | null; error: string | null }>>({});
  const [sellerId, setSellerId] = useState<string>("");

  async function runTool(key: string, url: string, method: "GET" | "POST" = "POST") {
    setResults((prev) => ({ ...prev, [key]: { loading: true, result: null, error: null } }));
    try {
      const sep = url.includes("?") ? "&" : "?";
      const finalUrl = sellerId ? `${url}${sep}seller_id=${sellerId}` : url;
      const res = await fetch(finalUrl, { method });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error desconocido");
      const summary = typeof data.summary === "string" ? data.summary : JSON.stringify(data, null, 2);
      setResults((prev) => ({ ...prev, [key]: { loading: false, result: summary, error: null } }));
    } catch (err: unknown) {
      setResults((prev) => ({ ...prev, [key]: { loading: false, result: null, error: (err as Error).message } }));
    }
  }

  const sellerOptions = users
    .filter((u) => u.full_name)
    .sort((a, b) => (a.full_name ?? "").localeCompare(b.full_name ?? ""));

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">Herramientas de mantenimiento de la tienda. Cada acción consulta APIs externas y puede tardar unos minutos.</p>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <label className="block text-xs font-medium text-gray-600 mb-1.5">Aplicar sobre</label>
        <select
          value={sellerId}
          onChange={(e) => setSellerId(e.target.value)}
          className="w-full max-w-sm px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
        >
          <option value="">Toda la tienda</option>
          {sellerOptions.map((u) => (
            <option key={u.id} value={u.id}>
              {u.full_name} ({u.email})
            </option>
          ))}
        </select>
      </div>

      {TOOLS.map((tool) => {
        const state = results[tool.key];
        return (
          <div key={tool.key} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-semibold text-gray-900 text-sm">{tool.label}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{tool.desc}</p>
              </div>
              <button
                onClick={() => runTool(tool.key, tool.url, tool.method)}
                disabled={state?.loading}
                className="px-4 py-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap flex items-center gap-2"
              >
                {state?.loading && <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                {state?.loading ? "Ejecutando..." : "Ejecutar"}
              </button>
            </div>
            {state?.result && (
              <pre className="mt-3 p-3 bg-gray-50 rounded-lg text-xs text-gray-700 overflow-x-auto whitespace-pre-wrap max-h-60 overflow-y-auto">{state.result}</pre>
            )}
            {state?.error && (
              <p className="mt-3 text-xs text-red-600 bg-red-50 rounded-lg p-3">{state.error}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
