"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export default function HeaderSearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-1 max-w-2xl">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Encuentra tu próximo libro, por autor, título o palabra clave"
        className="flex-1 px-4 py-2.5 border-2 border-gray-300 border-r-0 rounded-l-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400"
      />
      <button
        type="submit"
        className="bg-brand-500 hover:bg-brand-600 text-white font-medium px-6 py-2.5 rounded-r-md text-sm transition-colors whitespace-nowrap"
      >
        Buscar
      </button>
    </form>
  );
}
