"use client";

import { useState, useCallback, type ReactNode } from "react";
import dynamic from "next/dynamic";
import HeroBar from "./HeroBar";
import TiendaToggle from "./TiendaToggle";
import CollectionBanners from "./CollectionBanners";
import AdSlot from "@/components/ui/AdSlot";

const ScanAnimation = dynamic(() => import("./ScanAnimation"));
const PaymentAnimation = dynamic(() => import("./PaymentAnimation"));
const ShippingAnimation = dynamic(() => import("./ShippingAnimation"));
const RentalSection = dynamic(() => import("./RentalSection"));
const ShelfTransformation = dynamic(() => import("./ShelfTransformation"));

interface Props {
  totalListings: number;
  hasFilters: boolean;
  children: ReactNode; // the grid content
}

export default function HomeShell({ totalListings, hasFilters, children }: Props) {
  const [forceMap, setForceMap] = useState(false);

  const handleToggleMap = useCallback(() => {
    setForceMap(true);
  }, []);

  return (
    <>
      {!hasFilters ? (
        <HeroBar totalListings={totalListings} onToggleMap={handleToggleMap} />
      ) : (
        <h1 className="sr-only">Libros usados cerca de ti — tuslibros.cl</h1>
      )}

      {/* Manifiesto — el "por qué" */}
      {!hasFilters && (
        <section id="manifiesto" className="bg-cream-warm border-b border-cream-dark scroll-mt-20">
          <div className="max-w-6xl mx-auto px-6 py-16">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Left — message */}
              <div className="text-center lg:text-left">
                <p className="text-xs font-medium tracking-[0.3em] uppercase text-brand-600 mb-4">
                  Por qué existimos
                </p>
                <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-ink leading-tight mb-4">
                  Tus libros merecen circular.
                  <br />
                  <span className="italic text-brand-600">Nosotros los conectamos.</span>
                </h2>
                <p className="text-ink-muted leading-relaxed max-w-lg mx-auto lg:mx-0">
                  Hay millones de libros acumulando polvo en casas de Chile.
                  Cada estantería es una librería que nadie puede ver.
                  Nosotros la hacemos visible: geolocalización en tiempo real,
                  pago seguro, despacho a tu puerta.
                </p>
                <p className="text-ink-muted leading-relaxed mt-4 max-w-lg mx-auto lg:mx-0">
                  Tu experiencia es personal. Tu estantería se transforma
                  en una vitrina para lectores cerca de ti. Cada libro que
                  publicas es un libro que encuentra un nuevo lector.
                </p>
              </div>

              {/* Right — animated illustration */}
              <ShelfTransformation />
            </div>
          </div>
        </section>
      )}

      {/* Collection banners */}
      {!hasFilters && (
        <div className="max-w-7xl mx-auto px-6 pt-6">
          <CollectionBanners />
        </div>
      )}

      <main id="tienda" className="max-w-7xl mx-auto px-6 py-10 scroll-mt-32">
        <TiendaToggle forceMap={forceMap} onForceMapConsumed={() => setForceMap(false)}>
          {children}
        </TiendaToggle>
      </main>

      {/* Ad between store and features */}
      {!hasFilters && process.env.NEXT_PUBLIC_ADSENSE_CLIENT && (
        <div className="max-w-5xl mx-auto px-6 py-4">
          <AdSlot slot="between-sections" format="horizontal" />
        </div>
      )}

      {/* Feature sections — below the store */}
      {!hasFilters && (
        <>
          <ScanAnimation />
          <PaymentAnimation />
          <ShippingAnimation />
          <RentalSection />
        </>
      )}
    </>
  );
}
