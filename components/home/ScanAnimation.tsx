"use client";

import { useState, useEffect } from "react";

const STEPS = [
  {
    label: "Escanea el ISBN",
    detail: "Apunta tu cámara al código de barras",
    barcode: true,
  },
  {
    label: "Autocompletamos todo",
    detail: "Título, autor, portada y sinopsis desde APIs",
    fields: [
      { name: "Título", value: "Cien años de soledad", auto: true },
      { name: "Autor", value: "Gabriel García Márquez", auto: true },
      { name: "Portada", value: "portada.jpg", auto: true },
      { name: "Sinopsis", value: "La saga de los Buendía...", auto: true },
      { name: "Categoría", value: "Ficción Literaria", auto: true },
    ],
  },
  {
    label: "Tú pones el resto",
    detail: "Precio, condición y ubicación",
    fields: [
      { name: "Precio", value: "$8.000", auto: false },
      { name: "Condición", value: "Buen estado", auto: false },
      { name: "Ubicación", value: "Providencia, Santiago", auto: false },
    ],
  },
  {
    label: "¡Publicado!",
    detail: "Tu libro ya aparece en el mapa",
    published: true,
  },
];

export default function ScanAnimation() {
  const [step, setStep] = useState(0);
  const [fieldIndex, setFieldIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setStep((s) => (s + 1) % STEPS.length);
      setFieldIndex(0);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  // Animate fields appearing one by one
  useEffect(() => {
    const current = STEPS[step];
    if (!current.fields) return;
    if (fieldIndex >= current.fields.length) return;
    const timer = setTimeout(() => setFieldIndex((i) => i + 1), 400);
    return () => clearTimeout(timer);
  }, [step, fieldIndex]);

  const current = STEPS[step];

  return (
    <section id="como-publicar" className="bg-cream-warm border-b border-cream-dark scroll-mt-20">
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-10">
          <p className="text-xs font-medium tracking-[0.3em] uppercase text-brand-600 mb-3">
            Publicar es gratis
          </p>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-ink">
            Del código de barras al mapa en 10 segundos
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Phone mockup */}
          <div className="flex justify-center">
            <div className="relative w-[280px] h-[500px] bg-ink rounded-[36px] p-3 shadow-2xl">
              <div className="w-full h-full bg-cream rounded-[28px] overflow-hidden flex flex-col">
                {/* Status bar */}
                <div className="flex items-center justify-between px-5 pt-3 pb-2">
                  <span className="text-[10px] font-semibold text-ink">tuslibros.cl</span>
                  <div className="flex gap-1">
                    <div className="w-3 h-2 bg-ink/20 rounded-sm" />
                    <div className="w-3 h-2 bg-ink/20 rounded-sm" />
                  </div>
                </div>

                {/* Content area */}
                <div className="flex-1 px-4 pb-4 flex flex-col">
                  {/* Step indicator */}
                  <div className="flex gap-1 mb-4">
                    {STEPS.map((_, i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-colors duration-500 ${
                          i <= step ? "bg-brand-500" : "bg-cream-dark"
                        }`}
                      />
                    ))}
                  </div>

                  {/* Barcode scanning */}
                  {current.barcode && (
                    <div className="flex-1 flex flex-col items-center justify-center gap-4">
                      <div className="relative w-48 h-32 border-2 border-dashed border-brand-500/40 rounded-lg flex items-center justify-center">
                        {/* Barcode lines */}
                        <div className="flex gap-[2px]">
                          {[3,1,2,1,3,2,1,3,1,2,3,1,2,1,3,2,1,2,3,1].map((w, i) => (
                            <div key={i} className="bg-ink rounded-sm" style={{ width: `${w}px`, height: "40px" }} />
                          ))}
                        </div>
                        {/* Scan line */}
                        <div className="absolute left-2 right-2 h-0.5 bg-brand-500 animate-scan" />
                      </div>
                      <p className="text-xs text-ink-muted">ISBN: 978-0-307-47472-8</p>
                    </div>
                  )}

                  {/* Fields appearing */}
                  {current.fields && (
                    <div className="flex-1 flex flex-col gap-2">
                      <p className="text-[10px] uppercase tracking-wider text-ink-muted mb-1">
                        {current.detail}
                      </p>
                      {current.fields.map((field, i) => (
                        <div
                          key={field.name}
                          className={`flex items-center gap-2 p-2 rounded-md border transition-all duration-500 ${
                            i < fieldIndex
                              ? field.auto
                                ? "bg-brand-50 border-brand-200"
                                : "bg-white border-cream-dark"
                              : "opacity-0 translate-y-2"
                          }`}
                          style={{ transitionDelay: `${i * 100}ms` }}
                        >
                          <span className="text-[10px] text-ink-muted w-16 flex-shrink-0">{field.name}</span>
                          <span className="text-xs font-medium text-ink truncate">{field.value}</span>
                          {field.auto && i < fieldIndex && (
                            <svg className="w-3 h-3 text-brand-600 flex-shrink-0 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                            </svg>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Published state */}
                  {current.published && (
                    <div className="flex-1 flex flex-col items-center justify-center gap-3">
                      <div className="w-16 h-16 rounded-full bg-brand-100 flex items-center justify-center">
                        <svg className="w-8 h-8 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      </div>
                      <p className="font-display font-bold text-ink text-sm">Cien años de soledad</p>
                      <p className="text-xs text-ink-muted">Ya aparece en el mapa</p>
                      <div className="w-full h-24 bg-cream-dark rounded-lg mt-2 flex items-center justify-center">
                        <svg className="w-6 h-6 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Steps description */}
          <div className="space-y-6">
            {STEPS.map((s, i) => (
              <div
                key={i}
                className={`flex gap-4 p-4 rounded-lg transition-all duration-500 ${
                  i === step ? "bg-white shadow-sm border border-cream-dark" : "opacity-50"
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold ${
                  i === step ? "bg-brand-500 text-white" : "bg-cream-dark text-ink-muted"
                }`}>
                  {i + 1}
                </div>
                <div>
                  <h3 className="font-display font-bold text-ink text-sm">{s.label}</h3>
                  <p className="text-xs text-ink-muted mt-1">{s.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
