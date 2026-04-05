"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const STEPS = [
  {
    title: "Elige un libro",
    desc: "Busca el libro que quieres leer en la tienda o en el mapa.",
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
      </svg>
    ),
  },
  {
    title: "Arrienda por 7, 14 o 30 días",
    desc: "Pagas el arriendo + una garantía reembolsable. Todo por MercadoPago.",
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
      </svg>
    ),
  },
  {
    title: "Lee y disfruta",
    desc: "El libro llega a tu puerta o lo retiras personalmente.",
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.331 0 4.473.89 6.074 2.356M12 6.042a8.968 8.968 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.356M12 6.042V20.356" />
      </svg>
    ),
  },
  {
    title: "Devuelve y recupera tu garantía",
    desc: "Devuelves el libro en buen estado y recibes tu garantía de vuelta.",
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
      </svg>
    ),
  },
];

export default function RentalSection() {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep((s) => (s + 1) % STEPS.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section id="arriendos" className="bg-ink text-cream scroll-mt-20">
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left — value prop */}
          <div>
            <div className="inline-flex items-center gap-2 bg-brand-500/10 border border-brand-500/20 px-4 py-1.5 rounded-full mb-6">
              <svg className="w-4 h-4 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
              <span className="text-xs font-semibold text-brand-400 uppercase tracking-wider">Nuevo</span>
            </div>

            <h2 className="font-display text-3xl sm:text-4xl font-bold text-cream leading-tight mb-4">
              No compres.
              <br />
              <span className="italic text-brand-400">Arrienda.</span>
            </h2>

            <p className="text-cream/60 leading-relaxed mb-6 max-w-lg">
              Lee lo que quieras sin acumular libros. Pagas solo lo que necesitas,
              devuelves cuando terminas, y recuperas tu garantía. Así de simple.
            </p>

            {/* Price comparison */}
            <div className="flex gap-4 mb-8">
              <div className="bg-cream/[0.05] border border-cream/10 rounded-lg p-4 flex-1">
                <p className="text-cream/40 text-xs uppercase tracking-wider mb-1">Comprar</p>
                <p className="font-display text-2xl font-bold text-cream/30 line-through">$12.000</p>
              </div>
              <div className="bg-brand-500/10 border border-brand-500/20 rounded-lg p-4 flex-1">
                <p className="text-brand-400 text-xs uppercase tracking-wider mb-1">Arrendar 14 días</p>
                <p className="font-display text-2xl font-bold text-brand-400">$3.000</p>
                <p className="text-brand-400/60 text-[11px] mt-0.5">+ garantía reembolsable</p>
              </div>
            </div>

            <Link
              href="/?modality=loan"
              className="inline-flex items-center px-6 py-3 bg-brand-500 text-white text-sm font-semibold rounded-md hover:bg-brand-600 transition-colors"
            >
              Ver libros para arriendo
            </Link>
          </div>

          {/* Right — animated steps */}
          <div className="space-y-3">
            {STEPS.map((step, i) => (
              <button
                key={i}
                onClick={() => setActiveStep(i)}
                className={`w-full flex items-start gap-4 p-5 rounded-lg text-left transition-all duration-500 ${
                  i === activeStep
                    ? "bg-cream/[0.08] border border-cream/15"
                    : "hover:bg-cream/[0.03]"
                }`}
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-500 ${
                  i === activeStep
                    ? "bg-brand-500 text-white"
                    : "bg-cream/[0.06] text-cream/30"
                }`}>
                  {step.icon}
                </div>
                <div>
                  <h3 className={`font-display font-bold text-sm transition-colors duration-500 ${
                    i === activeStep ? "text-cream" : "text-cream/40"
                  }`}>
                    {step.title}
                  </h3>
                  <p className={`text-xs mt-1 transition-colors duration-500 ${
                    i === activeStep ? "text-cream/60" : "text-cream/20"
                  }`}>
                    {step.desc}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
