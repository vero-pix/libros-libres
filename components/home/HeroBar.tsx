"use client";

import Link from "next/link";

interface Props {
  totalListings: number;
  onToggleMap?: () => void;
}

export default function HeroBar({ totalListings, onToggleMap }: Props) {
  return (
    <section className="bg-ink overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 py-6 flex items-center gap-8">
        {/* Tagline — links to manifesto */}
        <a href="#manifiesto" className="flex-shrink-0 group">
          <h1 className="font-display text-xl sm:text-2xl font-bold text-cream leading-tight group-hover:text-brand-400 transition-colors">
            Cada estantería es una{" "}
            <span className="italic text-brand-400">librería.</span>
          </h1>
          <p className="text-cream/50 text-xs mt-1 group-hover:text-cream/70 transition-colors">
            {totalListings} libros en la red &middot; Descubre por qué
          </p>
        </a>

        {/* Scroll horizontal de cards */}
        <div className="flex-1 overflow-x-auto scrollbar-hide">
          <div className="flex gap-4 min-w-max pr-6">
            {/* Mapa — toggles map view */}
            <button
              onClick={() => {
                onToggleMap?.();
                document.getElementById("tienda")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="flex-shrink-0 w-44 bg-cream/[0.04] border border-cream/10 p-4 hover:bg-brand-500/20 hover:border-brand-500/30 transition-colors text-left"
            >
              <svg className="w-5 h-5 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
              <h3 className="font-display font-bold text-cream text-xs mt-2 leading-tight">
                Mapa en tiempo real
              </h3>
              <p className="text-cream/50 text-[11px] mt-1 leading-snug">
                Ver libros cerca tuyo
              </p>
            </button>

            {/* Escanea — links to feature section */}
            <a
              href="#como-publicar"
              className="flex-shrink-0 w-44 bg-cream/[0.04] border border-cream/10 p-4 hover:bg-cream/[0.08] transition-colors"
            >
              <svg className="w-5 h-5 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
              </svg>
              <h3 className="font-display font-bold text-cream text-xs mt-2 leading-tight">
                Escanea y publica
              </h3>
              <p className="text-cream/50 text-[11px] mt-1 leading-snug">
                Del ISBN al mapa en 10 seg
              </p>
            </a>

            {/* Pago */}
            <a
              href="#pago-seguro"
              className="flex-shrink-0 w-44 bg-cream/[0.04] border border-cream/10 p-4 hover:bg-cream/[0.08] transition-colors"
            >
              <svg className="w-5 h-5 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
              </svg>
              <h3 className="font-display font-bold text-cream text-xs mt-2 leading-tight">
                Pago seguro
              </h3>
              <p className="text-cream/50 text-[11px] mt-1 leading-snug">
                MercadoPago protege cada compra
              </p>
            </a>

            {/* Envío */}
            <a
              href="#envio"
              className="flex-shrink-0 w-44 bg-cream/[0.04] border border-cream/10 p-4 hover:bg-cream/[0.08] transition-colors"
            >
              <svg className="w-5 h-5 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
              </svg>
              <h3 className="font-display font-bold text-cream text-xs mt-2 leading-tight">
                Envío mismo día
              </h3>
              <p className="text-cream/50 text-[11px] mt-1 leading-snug">
                Chilexpress, Rappi o retiro
              </p>
            </a>

            {/* Arriendo */}
            <a
              href="#arriendos"
              className="flex-shrink-0 w-44 bg-brand-500/10 border border-brand-500/20 p-4 hover:bg-brand-500/20 transition-colors"
            >
              <svg className="w-5 h-5 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.331 0 4.473.89 6.074 2.356M12 6.042a8.968 8.968 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.356M12 6.042V20.356" />
              </svg>
              <h3 className="font-display font-bold text-cream text-xs mt-2 leading-tight">
                Arrienda libros
              </h3>
              <p className="text-cream/50 text-[11px] mt-1 leading-snug">
                Lee, devuelve, ahorra
              </p>
            </a>
          </div>
        </div>

        {/* CTA */}
        <Link
          href="/publish"
          className="flex-shrink-0 hidden sm:inline-flex items-center px-5 py-2.5 bg-brand-500 text-white text-xs font-semibold uppercase tracking-wide hover:bg-brand-600 transition-colors"
        >
          Publicar gratis
        </Link>
      </div>
    </section>
  );
}
