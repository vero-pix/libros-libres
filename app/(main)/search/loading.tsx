/**
 * Esqueleto de la búsqueda. Antes del 10-09-2026 no había ninguno en el sitio: la
 * pantalla se quedaba con el contenido anterior mientras Supabase respondía, y en
 * una consulta lenta parecía que el filtro no había hecho nada.
 *
 * Reproduce la forma real de la página —barra lateral de categorías y grilla de
 * portadas en proporción de libro— para que no salte el layout cuando llegan los
 * datos. Va sin animación de pulso en el bloque de la portada: con veinte tarjetas
 * latiendo a la vez el efecto marea más de lo que informa.
 */
export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-8" aria-busy="true" aria-live="polite">
      <span className="sr-only">Buscando libros…</span>

      <div className="h-4 w-48 bg-cream-warm rounded animate-pulse" />
      <div className="h-9 w-80 max-w-full bg-cream-warm rounded mt-4 animate-pulse" />

      <div className="flex gap-8 mt-10">
        {/* barra lateral de categorías */}
        <aside className="hidden lg:block w-56 flex-shrink-0 space-y-3" aria-hidden>
          <div className="h-5 w-28 bg-cream-warm rounded animate-pulse" />
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className="h-4 bg-cream-warm/70 rounded animate-pulse"
              style={{ width: `${60 + ((i * 13) % 35)}%` }}
            />
          ))}
        </aside>

        {/* grilla */}
        <div className="flex-1 min-w-0">
          <div className="h-10 w-full bg-cream-warm/60 rounded-xl animate-pulse" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4 mt-6">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="bg-paper-card rounded-[3px] border border-line overflow-hidden"
                aria-hidden
              >
                <div className="px-5 pt-5 pb-3.5 bg-gradient-to-b from-[#f6f0e4] to-[#efe7d6] flex justify-center">
                  <div className="w-[64%] aspect-[148/225] rounded-[2px_4px_4px_2px] bg-cream-dark/40" />
                </div>
                <div className="px-4 pb-4 space-y-2">
                  <div className="h-3.5 bg-cream-warm rounded animate-pulse" />
                  <div className="h-3 w-2/3 bg-cream-warm/70 rounded animate-pulse" />
                  <div className="h-4 w-1/3 bg-cream-warm rounded mt-3 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
