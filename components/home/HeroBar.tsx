"use client";

import Link from "next/link";

interface Props {
  totalListings: number;
  onToggleMap?: () => void;
}

export default function HeroBar({ totalListings, onToggleMap }: Props) {
  return (
    <section className="bg-cream-warm border-b border-cream-dark overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-8">
        {/* Tagline — links to manifesto */}
        <a href="#manifiesto" className="flex-shrink-0 group">
          <h1 className="font-display text-xl sm:text-2xl font-bold text-ink leading-tight group-hover:text-brand-600 transition-colors">
            Cada estantería es una{" "}
            <span className="italic text-brand-600">librería.</span>
          </h1>
          <p className="text-ink-muted text-xs mt-1 group-hover:text-ink transition-colors">
            {totalListings} libros en la red &middot; Descubre por qué
          </p>
        </a>

        {/* Scroll horizontal de cards */}
        <div className="flex-1 overflow-x-auto scrollbar-hide snap-x snap-mandatory">
          <div className="flex gap-3 min-w-max pr-6">
            {/* Explorar — scrolls to store */}
            <button
              onClick={() => {
                document.getElementById("tienda")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="flex-shrink-0 w-44 bg-white border border-cream-dark shadow-sm p-4 hover:border-brand-500 hover:shadow-lg transition-all text-left snap-start rounded-xl"
            >
              <svg className="w-6 h-6 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.331 0 4.473.89 6.074 2.356M12 6.042a8.968 8.968 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.356M12 6.042V20.356" />
              </svg>
              <h3 className="font-display font-bold text-ink text-xs mt-2 leading-tight">
                Explorar catálogo
              </h3>
              <p className="text-ink-muted text-[11px] mt-1 leading-snug">
                {totalListings} libros disponibles
              </p>
            </button>

            {/* Escanea */}
            <a
              href="#como-publicar"
              className="flex-shrink-0 w-44 bg-white border border-cream-dark shadow-sm p-4 hover:border-brand-500 hover:shadow-lg transition-all snap-start rounded-xl"
            >
              <svg className="w-5 h-5 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
              </svg>
              <h3 className="font-display font-bold text-ink text-xs mt-2 leading-tight">
                Escanea y publica
              </h3>
              <p className="text-ink-muted text-[11px] mt-1 leading-snug">
                Del ISBN al mapa en 10 seg
              </p>
            </a>

            {/* Pago */}
            <a
              href="#pago-seguro"
              className="flex-shrink-0 w-44 bg-white border border-cream-dark shadow-sm p-4 hover:border-brand-500 hover:shadow-lg transition-all snap-start rounded-xl"
            >
              <svg className="w-5 h-5 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
              </svg>
              <h3 className="font-display font-bold text-ink text-xs mt-2 leading-tight">
                Pago seguro
              </h3>
              <p className="text-ink-muted text-[11px] mt-1 leading-snug">
                MercadoPago protege cada compra
              </p>
            </a>

            {/* Envío */}
            <a
              href="#envio"
              className="flex-shrink-0 w-44 bg-white border border-cream-dark shadow-sm p-4 hover:border-brand-500 hover:shadow-lg transition-all snap-start rounded-xl"
            >
              <svg className="w-5 h-5 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
              </svg>
              <h3 className="font-display font-bold text-ink text-xs mt-2 leading-tight">
                Despacho flexible
              </h3>
              <p className="text-ink-muted text-[11px] mt-1 leading-snug">
                Courier, retiro o en persona
              </p>
            </a>

            {/* Arriendo — highlighted */}
            <a
              href="#arriendos"
              className="flex-shrink-0 w-44 bg-gradient-to-br from-brand-50 to-brand-100 border border-brand-200 shadow-sm p-4 hover:border-brand-500 hover:shadow-lg transition-all snap-start rounded-xl"
            >
              <svg className="w-5 h-5 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.331 0 4.473.89 6.074 2.356M12 6.042a8.968 8.968 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.356M12 6.042V20.356" />
              </svg>
              <h3 className="font-display font-bold text-brand-700 text-xs mt-2 leading-tight">
                Arrienda libros
              </h3>
              <p className="text-brand-600/70 text-[11px] mt-1 leading-snug">
                Lee, devuelve, ahorra
              </p>
            </a>
          </div>
        </div>

        {/* CTA */}
        <Link
          href="/publish"
          className="flex-shrink-0 hidden lg:inline-flex items-center px-5 py-2.5 bg-brand-500 text-white text-xs font-semibold uppercase tracking-wide rounded-md hover:bg-brand-600 transition-colors shadow-sm"
        >
          Publicar gratis
        </Link>
      </div>
    </section>
  );
}
