"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useRef, useTransition } from "react";
import { libroUrl } from "@/lib/urls";
import Image from "next/image";

interface Suggestion {
  id: string;
  slug: string | null;
  username: string | null;
  title: string;
  author: string;
  cover_url: string | null;
}

export default function HeaderSearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

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
      startTransition(() => {
        router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      });
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
    startTransition(() =>
      router.push(
        libroUrl({
          id: s.id,
          slug: s.slug,
          seller: { username: s.username },
        })
      )
    );
  }

  return (
    <div ref={wrapperRef} className="relative w-full">
      {/* Pill de búsqueda editorial */}
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2.5 bg-paper-card border border-line-strong rounded-full px-4 py-2.5 transition-colors focus-within:border-ink/40"
      >
        <svg className="w-4 h-4 text-ink-muted shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Busca por título, autor o género…"
          className="flex-1 min-w-0 bg-transparent border-0 outline-none text-sm text-black placeholder:text-ink-muted"
          autoComplete="off"
          aria-label="Buscar libros"
        />
      </form>

      {/* Dropdown de sugerencias */}
      {open && suggestions.length > 0 && (
        <ul className="absolute top-full left-0 right-0 mt-2 bg-paper-card border border-line rounded-2xl shadow-card overflow-hidden z-50 max-h-80 overflow-y-auto">
          {suggestions.map((s, i) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => selectSuggestion(s)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left text-sm transition-colors ${
                  i === activeIdx ? "bg-cream-warm/60" : "hover:bg-cream-warm/40"
                }`}
              >
                {s.cover_url ? (
                  <div className="w-8 h-11 relative rounded-sm overflow-hidden shrink-0 shadow-sm">
                    <Image src={s.cover_url} alt="" fill className="object-cover" sizes="32px" />
                  </div>
                ) : (
                  <div className="w-8 h-11 bg-cream-dark/30 rounded-sm shrink-0 flex items-center justify-center text-[8px] text-ink-muted">
                    📚
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-display font-medium text-ink truncate">{s.title}</p>
                  <p className="font-display italic text-xs text-ink-muted truncate">{s.author}</p>
                </div>
              </button>
            </li>
          ))}
          <li>
            <button
              type="button"
              onClick={handleSubmit as any}
              className="w-full px-4 py-2.5 text-left text-xs font-mono uppercase tracking-wider text-coral font-semibold hover:bg-cream-warm/40 transition-colors border-t border-line"
            >
              Ver todos los resultados para &ldquo;{query}&rdquo;
            </button>
          </li>
        </ul>
      )}
    </div>
  );
}
