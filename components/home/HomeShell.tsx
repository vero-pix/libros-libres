"use client";

import { useState, useCallback, type ReactNode } from "react";
import HeroBar from "./HeroBar";
import TiendaToggle from "./TiendaToggle";
import ScanAnimation from "./ScanAnimation";
import PaymentAnimation from "./PaymentAnimation";
import ShippingAnimation from "./ShippingAnimation";
import RentalSection from "./RentalSection";

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
      {!hasFilters && (
        <HeroBar totalListings={totalListings} onToggleMap={handleToggleMap} />
      )}

      {/* Manifiesto — el "por qué" */}
      {!hasFilters && (
        <section id="manifiesto" className="bg-cream-warm border-b border-cream-dark scroll-mt-20">
          <div className="max-w-4xl mx-auto px-6 py-12 text-center">
            <p className="text-xs font-medium tracking-[0.3em] uppercase text-brand-600 mb-4">
              Por qué existimos
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-ink leading-tight mb-4">
              Uber liberó el transporte.
              <br />
              <span className="italic text-brand-600">Nosotros liberamos las estanterías.</span>
            </h2>
            <p className="text-ink-muted leading-relaxed max-w-2xl mx-auto">
              Hay millones de libros acumulando polvo en casas de Chile. Uber hizo visible
              cada auto disponible en tu ciudad. Nosotros hacemos visible cada libro.
              Geolocalización en tiempo real, pago seguro, despacho a tu puerta.
              La red de libros más grande de Chile.
            </p>
          </div>
        </section>
      )}

      <main id="tienda" className="max-w-7xl mx-auto px-6 py-10 scroll-mt-4">
        <TiendaToggle forceMap={forceMap} onForceMapConsumed={() => setForceMap(false)}>
          {children}
        </TiendaToggle>
      </main>

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
