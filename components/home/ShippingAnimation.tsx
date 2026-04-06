"use client";

import { useState, useEffect } from "react";

const COURIERS = [
  {
    name: "Chilexpress",
    time: "1-3 días",
    desc: "Envío estándar a todo Chile",
    color: "text-red-500",
    bg: "bg-red-50",
  },
  {
    name: "Punto de retiro",
    time: "Acuerdan lugar",
    desc: "Coordinas un punto de encuentro",
    color: "text-orange-500",
    bg: "bg-orange-50",
  },
  {
    name: "Retiro en persona",
    time: "Cuando quieras",
    desc: "Coordina directo con el vendedor",
    color: "text-green-500",
    bg: "bg-green-50",
  },
];

export default function ShippingAnimation() {
  const [active, setActive] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActive((a) => (a + 1) % COURIERS.length);
      setProgress(0);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  // Animate progress bar
  useEffect(() => {
    const timer = setTimeout(() => setProgress(100), 200);
    return () => clearTimeout(timer);
  }, [active]);

  return (
    <section id="envio" className="bg-cream-warm border-b border-cream-dark scroll-mt-20">
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <p className="text-xs font-medium tracking-[0.3em] uppercase text-brand-600 mb-3">
            Despacho
          </p>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-ink">
            Tu libro llega a la puerta
          </h2>
        </div>

        <div className="max-w-2xl mx-auto">
          {/* Route animation */}
          <div className="flex items-center justify-between mb-10 px-4">
            {/* Origin */}
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-brand-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
              </div>
              <p className="text-xs text-ink-muted mt-2">Vendedor</p>
            </div>

            {/* Progress bar with courier icon */}
            <div className="flex-1 mx-4 relative">
              <div className="h-1 bg-cream-dark rounded-full">
                <div
                  className="h-1 bg-brand-500 rounded-full transition-all duration-[3000ms] ease-linear"
                  style={{ width: `${progress}%` }}
                />
              </div>
              {/* Moving courier icon */}
              <div
                className="absolute -top-3 transition-all duration-[3000ms] ease-linear"
                style={{ left: `${Math.min(progress, 95)}%` }}
              >
                <svg className="w-7 h-7 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                </svg>
              </div>
            </div>

            {/* Destination */}
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-brand-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                </svg>
              </div>
              <p className="text-xs text-ink-muted mt-2">Comprador</p>
            </div>
          </div>

          {/* Courier options */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {COURIERS.map((courier, i) => (
              <button
                key={courier.name}
                onClick={() => { setActive(i); setProgress(0); }}
                className={`p-5 rounded-lg border text-left transition-all duration-500 ${
                  i === active
                    ? `${courier.bg} border-current shadow-sm`
                    : "bg-white border-cream-dark hover:border-cream-dark/60"
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className={`font-display font-bold text-sm ${i === active ? courier.color : "text-ink"}`}>
                    {courier.name}
                  </span>
                </div>
                <p className={`text-lg font-bold ${i === active ? courier.color : "text-ink"}`}>
                  {courier.time}
                </p>
                <p className="text-xs text-ink-muted mt-1">{courier.desc}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
