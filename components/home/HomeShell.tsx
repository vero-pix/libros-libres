"use client";

import { useState, useCallback, type ReactNode } from "react";
import dynamic from "next/dynamic";
import HeroBar from "./HeroBar";
import TiendaToggle from "./TiendaToggle";
import CollectionBanners from "./CollectionBanners";
import LeadCaptureBar from "@/components/ui/LeadCaptureBar";

const ShelfTransformation = dynamic(() => import("./ShelfTransformation"));

interface Props {
  totalListings: number;
  hasFilters: boolean;
  featuredRow?: ReactNode;
  testimonialBanner?: ReactNode;
  requestsRow?: ReactNode;
  heroRequestStrip?: ReactNode;
  children: ReactNode;
}

export default function HomeShell({ totalListings, hasFilters, featuredRow, testimonialBanner, requestsRow, heroRequestStrip, children }: Props) {
  const [forceMap, setForceMap] = useState(false);

  const handleToggleMap = useCallback(() => {
    setForceMap(true);
  }, []);

  return (
    <>
      {!hasFilters && heroRequestStrip}

      {!hasFilters ? (
        <>
          <HeroBar totalListings={totalListings} onToggleMap={handleToggleMap} />
          {/* SEO: keywords naturales del mercado, invisibles al usuario */}
          <p className="sr-only">
            tuslibros.cl es el marketplace chileno de libros usados.
            Compra y vende libros usados en Chile con mapa geolocalizado,
            pago seguro por MercadoPago y despacho por courier o retiro en
            mano. Encuentra libros usados en Santiago, Valparaíso, Concepción
            y todas las regiones de Chile desde $3.000.
          </p>
        </>
      ) : (
        <h1 className="sr-only">Libros usados en Chile — tuslibros.cl</h1>
      )}

      {/* Above-the-fold: libros destacados + testimonio */}
      {!hasFilters && (featuredRow || testimonialBanner) && (
        <section className="bg-white border-b border-cream-dark">
          <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
            {featuredRow}
            {testimonialBanner}
          </div>
        </section>
      )}

      {/* Economía inversa: se busca */}
      {!hasFilters && requestsRow}

      <main id="tienda" className="max-w-7xl mx-auto px-6 py-10 scroll-mt-32">
        <TiendaToggle forceMap={forceMap} onForceMapConsumed={() => setForceMap(false)} hasFilters={hasFilters}>
          {children}
        </TiendaToggle>
      </main>

      {/* Collection banners */}
      {!hasFilters && (
        <div className="max-w-7xl mx-auto px-6 pb-10">
          <CollectionBanners />
        </div>
      )}

      {/* Manifiesto compacto al final — antes del footer */}
      {!hasFilters && (
        <section id="manifiesto" className="bg-cream-warm border-t border-cream-dark">
          <div className="max-w-6xl mx-auto px-6 py-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div className="text-center lg:text-left">
                <p className="text-xs font-medium tracking-[0.3em] uppercase text-brand-600 mb-3">
                  Por qué existimos
                </p>
                <h2 className="font-display text-xl sm:text-2xl font-bold text-ink leading-tight mb-3">
                  Tus libros merecen circular.{" "}
                  <span className="italic text-brand-600">Yo los conecto contigo.</span>
                </h2>
                <p className="text-sm text-ink-muted leading-relaxed max-w-lg mx-auto lg:mx-0">
                  En Chile hay millones de libros durmiendo en estanterías. Cada
                  casa es una librería que nadie puede ver. Acá las hacemos
                  visibles — por ubicación, por cercanía, por el título que
                  andas buscando y que probablemente está más cerca de lo que
                  crees.
                </p>
              </div>
              <ShelfTransformation />
            </div>
          </div>
        </section>
      )}

      {!hasFilters && <LeadCaptureBar />}
    </>
  );
}
