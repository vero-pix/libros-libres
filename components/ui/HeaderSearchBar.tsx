"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useRef } from "react";

interface Suggestion {
  id: string;
  title: string;
  author: string;
  cover_url: string | null;
}

export default function HeaderSearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Fetch suggestions with debounce
  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (query.trim().length < 2) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search/suggestions?q=${encodeURIComponent(query.trim())}`);
        const data = await res.json();
        setSuggestions(data);
        setOpen(data.length > 0);
        setActiveIdx(-1);
      } catch {
        setSuggestions([]);
      }
    }, 250);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  // Close on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      setOpen(false);
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === "Enter" && activeIdx >= 0) {
      e.preventDefault();
      selectSuggestion(suggestions[activeIdx]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  function selectSuggestion(s: Suggestion) {
    setQuery(s.title);
    setOpen(false);
    router.push(`/listings/${s.id}`);
  }

  return (
    <div ref={wrapperRef} className="relative flex-1 max-w-2xl">
      <form onSubmit={handleSubmit} className="flex">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Encuentra tu próximo libro, por autor, título o palabra clave"
          className="flex-1 px-4 py-2.5 border border-gray-300 border-r-0 rounded-l-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400 bg-white"
          autoComplete="off"
        />
        <button
          type="submit"
          className="bg-brand-500 hover:bg-brand-600 text-white font-medium px-6 py-2.5 rounded-r-lg text-sm transition-colors whitespace-nowrap"
        >
          Buscar
        </button>
      </form>

      {/* Dropdown */}
      {open && suggestions.length > 0 && (
        <ul className="absolute top-full left-0 right-0 mt-1 bg-white border border-cream-dark/30 rounded-xl shadow-lg overflow-hidden z-50 max-h-80 overflow-y-auto">
          {suggestions.map((s, i) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => selectSuggestion(s)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left text-sm transition-colors ${
                  i === activeIdx ? "bg-brand-50" : "hover:bg-cream-warm/50"
                }`}
              >
                {s.cover_url ? (
                  <img
                    src={s.cover_url}
                    alt=""
                    className="w-8 h-11 object-cover rounded-sm shrink-0"
                  />
                ) : (
                  <div className="w-8 h-11 bg-cream-dark/20 rounded-sm shrink-0 flex items-center justify-center text-[8px] text-ink-muted">
                    📚
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-medium text-ink truncate">{s.title}</p>
                  <p className="text-xs text-ink-muted truncate">{s.author}</p>
                </div>
              </button>
            </li>
          ))}
          <li>
            <button
              type="button"
              onClick={handleSubmit as any}
              className="w-full px-4 py-2.5 text-left text-xs text-brand-600 font-medium hover:bg-brand-50 transition-colors border-t border-cream-dark/10"
            >
              Ver todos los resultados para &ldquo;{query}&rdquo;
            </button>
          </li>
        </ul>
      )}
    </div>
  );
}
