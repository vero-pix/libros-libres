"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  totalListings: number;
  onToggleMap?: () => void;
}

const CATEGORY_CHIPS = [
  { label: "Novela", href: "/?subcategory=ficcion-novela" },
  { label: "Poesía", href: "/?subcategory=general-adulto-poesia" },
  { label: "Historia", href: "/?subcategory=no-ficcion-historia" },
  { label: "Policial", href: "/?subcategory=ficcion-policial" },
  { label: "Escolares", href: "/?subcategory=academico-escolar" },
  { label: "Colección", href: "/?collectible=1" },
  { label: "Ofertas", href: "/?sort=price_asc" },
];

export default function HeroBar({ totalListings }: Props) {
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
      <div className="max-w-7xl mx-auto px-6 pt-10 pb-10 sm:pt-16 sm:pb-14">

        {/* Desktop: dos columnas / Mobile: columna */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:gap-16">

          {/* Columna editorial */}
          <div className="flex-1 max-w-2xl">
            <p className="text-[11px] font-mono uppercase tracking-[0.25em] text-brand-600 mb-4">
              Marketplace de libros usados · Chile
            </p>
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-ink leading-[1.1] tracking-tight">
              Cada estantería{" "}
              <em className="italic text-brand-600 not-italic">es una librería.</em>
            </h1>
            <p className="mt-4 text-sm sm:text-base text-ink-muted leading-relaxed max-w-lg">
              Compra y vende libros usados con personas reales.{" "}
              <span className="text-ink">{totalListings} ejemplares disponibles hoy.</span>
            </p>

            {/* Quote de Vero */}
            <blockquote className="mt-5 pl-4 border-l-2 border-brand-300">
              <p className="font-display italic text-sm text-ink-muted leading-relaxed">
                &ldquo;Empecé subiendo los 12 de mi velador. Ya somos más de 16 vendiendo entre Providencia y Ñuñoa.&rdquo;
              </p>
              <footer className="text-[11px] font-mono text-ink-muted mt-1">— Vero, fundadora</footer>
            </blockquote>

            {/* CTAs */}
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="#tienda"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-500 text-white rounded-xl font-semibold text-sm hover:bg-brand-600 transition-colors shadow-sm"
              >
                Explorar libros
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </Link>
              <Link
                href="/publish"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-cream-dark text-ink rounded-xl font-semibold text-sm hover:bg-cream-warm hover:border-brand-300 transition-colors"
              >
                Publicar uno mío
              </Link>
            </div>
          </div>

          {/* Buscador */}
          <div className="flex-1 max-w-xl mt-10 lg:mt-0">
            <form onSubmit={handleSearch} className="relative group">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Título, autor o ISBN..."
                className="w-full bg-white border-2 border-cream-dark rounded-2xl px-6 py-4 pl-14 text-base shadow-md focus:outline-none focus:ring-2 focus:ring-brand-400/30 focus:border-brand-400 transition-all placeholder:text-gray-400"
              />
              <svg className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <button
                type="submit"
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-brand-500 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-brand-600 transition-colors"
              >
                Buscar
              </button>
            </form>

            {/* Category chips — horizontal scroll en mobile */}
            <div className="mt-4 flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
              {CATEGORY_CHIPS.map((chip) => (
                <Link
                  key={chip.label}
                  href={chip.href}
                  className="flex-shrink-0 px-3.5 py-1.5 bg-white border border-cream-dark rounded-full text-xs font-medium text-ink hover:bg-brand-50 hover:border-brand-300 hover:text-brand-600 transition-all shadow-sm whitespace-nowrap"
                >
                  {chip.label}
                </Link>
              ))}
            </div>

            {/* Link secundario */}
            <p className="mt-4 text-xs text-ink-muted">
              ¿Buscas algo específico?{" "}
              <Link href="/solicitudes" className="text-brand-600 font-medium hover:underline">
                Deja tu solicitud →
              </Link>
            </p>
          </div>
        </div>

      </div>
    </section>
  );
}
