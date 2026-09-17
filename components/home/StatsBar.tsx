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
    { value: fmt(listings), label: "libros publicados", href: undefined as string | undefined },
    { value: fmt(stores), label: "tiendas activas", href: "/tiendas" },
    { value: fmtViews(views), label: "visitas al catálogo", href: undefined as string | undefined },
  ];

  return (
    <section className="bg-cream-warm/60 border-b border-cream-dark">
      <div className="max-w-6xl mx-auto px-6 py-3">
        <p className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 text-sm text-ink-muted">
          {stats.map((s, i) => (
            <span key={s.label} className="flex items-center gap-2.5">
              {i > 0 && <span className="text-ink-muted/40" aria-hidden>·</span>}
              {s.href ? (
                <Link href={s.href} className="hover:text-ink transition-colors">
                  <strong className="font-semibold text-ink tabular-nums">{s.value}</strong>{" "}
                  {s.label}
                </Link>
              ) : (
                <span>
                  <strong className="font-semibold text-ink tabular-nums">{s.value}</strong>{" "}
                  {s.label}
                </span>
              )}
            </span>
          ))}
          <Link
            href="/novedades"
            className="text-ink-muted hover:text-ink underline underline-offset-2 transition-colors"
          >
            mira lo nuevo
          </Link>
        </p>
      </div>
    </section>
  );
}
