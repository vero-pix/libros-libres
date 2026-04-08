"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

const MODALITY_OPTIONS = [
  { value: "", label: "Todos" },
  { value: "sale", label: "Venta" },
  { value: "loan", label: "Arriendo" },
  { value: "both", label: "Venta y arriendo" },
];

export default function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [modality, setModality] = useState(searchParams.get("modality") ?? "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (modality) params.set("modality", modality);
    router.push(`/search?${params.toString()}`);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="relative">
        <span className="absolute inset-y-0 left-3 flex items-center text-gray-400">
          🔍
        </span>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Título, autor o género..."
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
        />
      </div>
      <select
        value={modality}
        onChange={(e) => setModality(e.target.value)}
        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-400 bg-white"
      >
        {MODALITY_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <button
        type="submit"
        className="w-full bg-brand-500 hover:bg-brand-600 text-white font-medium py-2.5 rounded-xl text-sm transition-colors"
      >
        Buscar
      </button>
    </form>
  );
}
