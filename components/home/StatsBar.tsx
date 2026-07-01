import Link from "next/link";

interface Props {
  listings: number;
  stores: number;
  views: number;
}

const fmt = (n: number) => n.toLocaleString("es-CL");
// Vistas: sobre 10 mil las mostramos redondeadas y amables ("31 mil")
const fmtViews = (n: number) => (n >= 10000 ? `${Math.round(n / 1000)} mil` : fmt(n));

/**
 * Contador de confianza (prueba social) — arriba del fold en el home.
 * Muestra los números fuertes y honestos: libros publicados, tiendas activas y
 * visitas. NO muestra "vendidos" a propósito (hoy es ~0 / off-platform y delataría
 * el problema en vez de dar confianza). Idea de Carlos (CIMLibros).
 */
export default function StatsBar({ listings, stores, views }: Props) {
  const stats = [
    { value: fmt(listings), label: "libros publicados" },
    { value: fmt(stores), label: "tiendas activas" },
    { value: fmtViews(views), label: "visitas al catálogo" },
  ];

  return (
    <section className="bg-cream-warm/60 border-b border-cream-dark">
      <div className="max-w-6xl mx-auto px-6 py-5">
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 sm:gap-x-14">
          {stats.map((s) => (
            <div key={s.label} className="text-center animate-fade-up">
              <div className="font-display text-2xl sm:text-3xl font-bold text-ink leading-none tabular-nums">
                {s.value}
              </div>
              <div className="text-[11px] font-mono uppercase tracking-wider text-ink-muted mt-1.5">
                {s.label}
              </div>
            </div>
          ))}
          <Link
            href="/novedades"
            className="self-center text-xs font-semibold text-brand-600 hover:text-coral hover:underline transition-colors"
          >
            Mira lo nuevo →
          </Link>
        </div>
      </div>
    </section>
  );
}
