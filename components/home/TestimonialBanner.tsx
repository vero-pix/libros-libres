const testimonials = [
  {
    initial: "Z.",
    quote:
      "Fácil y sin complicaciones. Muy buena disposición por parte del vendedor, volvería a comprar sin ningún problema.",
    purchase: "La Marina en la historia de Chile — Tomo I",
    date: "Abril 2026",
  },
  {
    initial: "Camilo",
    quote:
      "Encantado con mi primera compra. Los libros llegaron rápido y en buen estado hasta la puerta de mi casa, además con una sorpresa buenísima. Una experiencia recomendada 👌🏻",
    purchase: "Bundle de 3 libros · Concepción",
    date: "Abril 2026",
  },
];

export default function TestimonialBanner() {
  return (
    <section className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-sm font-semibold text-ink uppercase tracking-wide">
          Compraron y cuentan
        </h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {testimonials.map((t) => (
          <blockquote
            key={t.initial + t.purchase}
            className="relative bg-cream-warm border border-cream-dark/40 rounded-xl px-6 py-6 sm:px-8 sm:py-7"
          >
            <span
              aria-hidden
              className="absolute -top-3 left-6 text-5xl font-serif text-brand-500 leading-none select-none"
            >
              “
            </span>
            <p className="font-serif italic text-base sm:text-lg text-ink leading-relaxed">
              {t.quote}
            </p>
            <footer className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm">
              <span className="font-semibold text-ink">— {t.initial}</span>
              <span className="text-ink-muted">
                Compró <em>{t.purchase}</em>
              </span>
              <span className="text-ink-muted/70 text-xs ml-auto">{t.date}</span>
            </footer>
          </blockquote>
        ))}
      </div>
    </section>
  );
}
