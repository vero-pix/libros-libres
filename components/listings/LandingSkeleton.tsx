/**
 * Esqueleto de las landings de categoría y de autor (15-09-2026). Las dos
 * comparten forma: migas, encabezado editorial y grilla de portadas de seis
 * columnas. Si el esqueleto calza con esa forma, la página no salta cuando
 * llegan los libros.
 *
 * Detalle que quedó de Martfury: las portadas entran de a una, en cascada, en
 * vez de latir todas juntas. Con reduce-motion aparecen quietas.
 */
export default function LandingSkeleton({ mensaje = "Buscando en los estantes…" }: { mensaje?: string }) {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10" aria-busy="true" aria-live="polite">
      <span className="sr-only">{mensaje}</span>

      {/* migas */}
      <div className="h-3.5 w-44 bg-cream-warm rounded animate-pulse" aria-hidden />

      {/* encabezado editorial */}
      <div className="mt-6 mb-10 max-w-2xl" aria-hidden>
        <div className="h-3 w-36 bg-cream-warm/80 rounded animate-pulse" />
        <div className="h-10 w-72 max-w-full bg-cream-warm rounded mt-3 animate-pulse" />
        <div className="space-y-2 mt-5">
          <div className="h-4 bg-cream-warm/70 rounded animate-pulse" />
          <div className="h-4 bg-cream-warm/70 rounded animate-pulse" />
          <div className="h-4 w-3/5 bg-cream-warm/70 rounded animate-pulse" />
        </div>
        <p className="text-xs text-ink-muted/60 mt-4 font-mono motion-safe:animate-pulse">{mensaje}</p>
      </div>

      {/* grilla de portadas */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4" aria-hidden>
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="bg-paper-card rounded-[3px] border border-line overflow-hidden opacity-0 motion-safe:animate-fade-up motion-reduce:opacity-100"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className="px-5 pt-5 pb-3.5 bg-gradient-to-b from-[#f6f0e4] to-[#efe7d6] flex justify-center">
              <div className="w-[64%] aspect-[148/225] rounded-[2px_4px_4px_2px] bg-cream-dark/40" />
            </div>
            <div className="px-4 pb-4 space-y-2">
              <div className="h-3.5 bg-cream-warm rounded" />
              <div className="h-3 w-2/3 bg-cream-warm/70 rounded" />
              <div className="h-4 w-1/3 bg-cream-warm rounded mt-3" />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
