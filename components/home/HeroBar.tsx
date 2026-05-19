"use client";

import Link from "next/link";

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
  return (
    <section className="bg-cream-warm border-b border-cream-dark overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 pt-10 pb-10 sm:pt-14 sm:pb-12">

        <div className="max-w-3xl">
          <p className="text-[11px] font-mono uppercase tracking-[0.25em] text-brand-600 mb-4">
            Marketplace de libros usados · Chile
          </p>
          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-ink leading-[1.1] tracking-tight">
            Cada estantería{" "}
            <em className="italic text-brand-600 not-italic">es una librería.</em>
          </h1>
          <p className="mt-4 text-sm sm:text-base text-ink-muted leading-relaxed max-w-xl">
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

          {/* Category chips — exploración rápida */}
          <div className="mt-6 flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
            <span className="flex-shrink-0 text-[11px] font-mono uppercase tracking-wider text-ink-muted self-center mr-1">
              Explorar:
            </span>
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
        </div>

      </div>
    </section>
  );
}
