"use client";

import Link from "next/link";
import { trackEvent } from "@/utils/analytics";

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
              El marketplace chileno para hacer circular tus libros.
              Compra y vende con pago seguro, envíos a todo Chile o retiro directo en tu ciudad.
            </p>

            <div className="mt-6 flex flex-wrap gap-3 justify-center lg:justify-start">
              <Link
                href="/search"
                className="inline-flex items-center px-8 py-3.5 bg-brand-500 text-white text-sm font-bold rounded-xl hover:bg-brand-600 transition-all shadow-lg hover:shadow-brand-500/20 hover:-translate-y-0.5 active:translate-y-0"
              >
                Explorar catálogo
              </Link>
              <Link
                href="/publish"
                onClick={() => trackEvent("click_offer_book")}
                className="inline-flex items-center px-8 py-3.5 bg-white border-2 border-brand-500 text-brand-600 text-sm font-bold rounded-xl hover:bg-brand-50 transition-all shadow-sm"
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
              “Encantado con mi primera compra. Los libros llegaron rápido y en buen estado hasta la puerta de mi casa, además con una sorpresa buenísima. Una experiencia recomendada 👌🏻”
            </p>
            <p className="text-xs text-ink-muted mt-2">
              — <span className="font-semibold text-ink">Camilo</span> · bundle de 3 libros a Concepción
            </p>
          </aside>
        </div>
      </div>
    </section>
  );
}
