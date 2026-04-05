"use client";

import { useState, useEffect } from "react";

const STEPS = [
  { label: "Elige tu libro", icon: "book", active: [0] },
  { label: "Paga con MercadoPago", icon: "card", active: [0, 1] },
  { label: "Se divide automáticamente", icon: "split", active: [0, 1, 2] },
  { label: "Vendedor recibe su pago", icon: "check", active: [0, 1, 2, 3] },
];

export default function PaymentAnimation() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setStep((s) => (s + 1) % STEPS.length);
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  return (
    <section id="pago-seguro" className="bg-cream border-b border-cream-dark scroll-mt-20">
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <p className="text-xs font-medium tracking-[0.3em] uppercase text-brand-600 mb-3">
            Pago protegido
          </p>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-ink">
            MercadoPago se encarga de todo
          </h2>
          <p className="text-ink-muted text-sm mt-2 max-w-lg mx-auto">
            Tu dinero está protegido hasta que recibas el libro. El vendedor recibe su pago automáticamente.
          </p>
        </div>

        {/* Flow animation */}
        <div className="max-w-3xl mx-auto">
          <div className="grid grid-cols-4 gap-2 sm:gap-4">
            {STEPS.map((s, i) => (
              <div key={i} className="flex flex-col items-center text-center">
                {/* Icon circle */}
                <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center transition-all duration-700 ${
                  i <= step
                    ? "bg-brand-500 text-white scale-110 shadow-lg shadow-brand-500/20"
                    : "bg-cream-dark text-ink-muted"
                }`}>
                  {s.icon === "book" && (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.331 0 4.473.89 6.074 2.356M12 6.042a8.968 8.968 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.356M12 6.042V20.356" />
                    </svg>
                  )}
                  {s.icon === "card" && (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                    </svg>
                  )}
                  {s.icon === "split" && (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                    </svg>
                  )}
                  {s.icon === "check" && (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                </div>

                {/* Connector line */}
                {i < STEPS.length - 1 && (
                  <div className={`hidden sm:block absolute w-full h-0.5 top-8 left-1/2 transition-colors duration-700 ${
                    i < step ? "bg-brand-500" : "bg-cream-dark"
                  }`} />
                )}

                {/* Label */}
                <p className={`text-xs mt-3 font-medium transition-colors duration-500 ${
                  i <= step ? "text-ink" : "text-ink-muted"
                }`}>
                  {s.label}
                </p>

                {/* Amount detail */}
                {i === 2 && step >= 2 && (
                  <div className="mt-2 text-[10px] text-ink-muted space-y-0.5">
                    <p className="text-brand-600 font-semibold">$8.000 &rarr; vendedor</p>
                    <p>$640 &rarr; tuslibros.cl</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap justify-center gap-6 mt-12 pt-8 border-t border-cream-dark">
            {[
              "Protección al comprador",
              "Devolución garantizada",
              "Datos encriptados",
            ].map((badge) => (
              <span key={badge} className="flex items-center gap-2 text-xs text-ink-muted">
                <svg className="w-4 h-4 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
                {badge}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
