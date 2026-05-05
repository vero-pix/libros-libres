"use client";

import Link from "next/link";
import { trackEvent } from "@/utils/analytics";

interface Props {
  totalListings: number;
  onToggleMap?: () => void;
}

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  totalListings: number;
  onToggleMap?: () => void;
}

const QUICK_SEARCHES = [
  { label: "Poesía", query: "poesía" },
  { label: "Novela Negra", query: "policial" },
  { label: "Escolares", query: "escolar" },
  { label: "Borges", query: "borges" },
  { label: "Lectura Complementaria", query: "lectura complementaria" },
];

export default function HeroBar({ totalListings, onToggleMap }: Props) {
  const [query, setQuery] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <section className="bg-cream-warm border-b border-cream-dark overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 pt-10 pb-12 sm:pt-16 sm:pb-20">
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
          <h1 className="font-display text-3xl sm:text-4xl lg:text-6xl font-bold text-ink leading-[1.1] tracking-tight">
            tuslibros,{" "}
            <span className="italic text-brand-600">los que ya leíste y los que te faltan.</span>
          </h1>
          
          <p className="text-ink-muted mt-4 text-base sm:text-lg max-w-2xl">
            El marketplace chileno para hacer circular tus libros. Busca entre {totalListings} ejemplares listos para viajar a tu casa.
          </p>

          {/* Search Bar Gigante */}
          <form onSubmit={handleSearch} className="mt-8 sm:mt-10 w-full max-w-2xl relative group">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Busca por título, autor o tema (ej: Novela negra, Neruda...)"
              className="w-full bg-white border-2 border-brand-500/20 rounded-2xl px-6 py-4 sm:py-5 pl-14 text-lg shadow-xl shadow-brand-500/10 focus:outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all placeholder:text-gray-400"
            />
            <svg className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <button 
              type="submit"
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-brand-500 text-white px-5 py-2 sm:py-2.5 rounded-xl font-bold text-sm hover:bg-brand-600 transition-colors shadow-sm"
            >
              Buscar
            </button>
          </form>

          {/* Quick Search Chips */}
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-ink-muted mr-1 self-center">Tendencias:</span>
            {QUICK_SEARCHES.map((qs) => (
              <button
                key={qs.label}
                onClick={() => router.push(`/search?q=${encodeURIComponent(qs.query)}`)}
                className="px-3.5 py-1.5 bg-white border border-cream-dark rounded-full text-xs font-medium text-ink hover:bg-brand-50 hover:border-brand-300 hover:text-brand-600 transition-all shadow-sm"
              >
                #{qs.label}
              </button>
            ))}
          </div>

          <div className="mt-10 flex gap-6 items-center text-xs font-bold uppercase tracking-[0.2em] text-ink-muted">
            <Link href="/publish" className="hover:text-brand-600 transition-colors">Vender libros</Link>
            <span className="w-1 h-1 bg-cream-dark rounded-full"></span>
            <Link href="/solicitudes" className="hover:text-brand-600 transition-colors">Lo que otros buscan</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
