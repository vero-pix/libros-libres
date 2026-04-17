export default function TestimonialBanner() {
  return (
    <section className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-sm font-semibold text-ink uppercase tracking-wide">
          Compraron y cuentan
        </h2>
      </div>
      <blockquote className="relative bg-cream-warm border border-cream-dark/40 rounded-xl px-6 py-6 sm:px-10 sm:py-8">
        <span
          aria-hidden
          className="absolute -top-3 left-6 text-5xl font-serif text-brand-500 leading-none select-none"
        >
          “
        </span>
        <p className="font-serif italic text-lg sm:text-xl text-ink leading-relaxed">
          Fácil y sin complicaciones. Muy buena disposición por parte del
          vendedor, volvería a comprar sin ningún problema.
        </p>
        <footer className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm">
          <span className="font-semibold text-ink">— Z.</span>
          <span className="text-ink-muted">
            Compró <em>La Marina en la historia de Chile — Tomo I</em>
          </span>
          <span className="text-ink-muted/70 text-xs ml-auto">Abril 2026</span>
        </footer>
      </blockquote>
    </section>
  );
}
