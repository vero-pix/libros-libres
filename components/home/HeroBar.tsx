"use client";

import Link from "next/link";

interface Props {
  totalListings: number;
  onToggleMap?: () => void;
}

export default function HeroBar({ totalListings, onToggleMap }: Props) {
  return (
    <section className="bg-cream-warm border-b border-cream-dark overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 pt-8 pb-7 sm:pt-10 sm:pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6 lg:gap-10 items-end">
          <div className="text-center lg:text-left">
            <h1 className="font-display text-2xl sm:text-3xl lg:text-5xl font-bold text-ink leading-[1.1] tracking-tight">
              tuslibros,{" "}
              <span className="italic text-brand-600">los que ya leíste y los que te faltan.</span>
            </h1>
            <p className="text-ink-muted mt-2 sm:mt-3 text-sm sm:text-base max-w-2xl mx-auto lg:mx-0">
              {totalListings > 0 ? (
                <>
                  {totalListings} ejemplares disponibles hoy, desde <strong className="text-ink">$3.000</strong>.
                  Pago con MercadoPago, envío por courier a todo Chile o retiro en Santiago.
                </>
              ) : (
                <>Cargando el catálogo…</>
              )}
            </p>

            <div className="mt-5 flex flex-wrap gap-3 justify-center lg:justify-start">
              <Link
                href="/search"
                className="inline-flex items-center px-6 py-3 bg-brand-500 text-white text-sm font-semibold rounded-md hover:bg-brand-600 transition-colors shadow"
              >
                Ver {totalListings > 0 ? `${totalListings} libros` : "catálogo"}
              </Link>
              <Link
                href="/publish"
                className="inline-flex items-center px-6 py-3 bg-white border border-ink/20 text-ink text-sm font-semibold rounded-md hover:border-brand-500 hover:text-brand-600 transition-colors"
              >
                Ofrecer mi libro
              </Link>
              <Link
                href="/solicitudes"
                className="inline-flex items-center px-6 py-3 bg-transparent border border-amber-600/60 text-amber-800 text-sm font-semibold rounded-md hover:bg-amber-50 hover:border-amber-700 transition-colors"
              >
                ¿No está? Búscalo acá →
              </Link>
            </div>
          </div>

          {/* Mini-testimonio como social proof inmediato */}
          <aside className="hidden lg:block max-w-xs bg-white/70 border border-cream-dark rounded-xl p-4 shadow-sm">
            <p className="text-[10px] uppercase tracking-wider font-semibold text-brand-600 mb-2">
              Compraron y cuentan
            </p>
            <p className="font-serif italic text-sm text-ink leading-snug">
              “Fácil y sin complicaciones. Muy buena disposición por parte del vendedor,
              volvería a comprar sin ningún problema.”
            </p>
            <p className="text-xs text-ink-muted mt-2">
              — <span className="font-semibold text-ink">Z.</span> · compró <em>La Marina en la historia de Chile · Tomo I</em>
            </p>
          </aside>
        </div>
      </div>
    </section>
  );
}
