import Link from "next/link";
import Image from "next/image";
import type { PiezaDestacada } from "@/lib/piezaDestacada";

/**
 * La caluga del sidebar: un libro, una razón, un precio.
 *
 * Es deliberadamente distinta de las tarjetas del catálogo — borde de tinta,
 * portada apaisada y una frase escrita a mano. Si se pareciera a una ficha más,
 * no serviría para lo que existe: detener a alguien que va de paso.
 */
export default function CalugaPieza({
  pieza,
  variante = "sidebar",
}: {
  pieza: PiezaDestacada | null;
  /** "portada": la fila ancha que reemplazó a las once filas curadas de la
   *  home (17-09-2026). Mismo dato, otra forma. */
  variante?: "sidebar" | "portada";
}) {
  if (!pieza) return null;

  if (variante === "portada") {
    return (
      <Link
        href={pieza.url}
        className="group mb-10 grid overflow-hidden rounded-2xl border-2 border-ink bg-paper-card shadow-card transition-shadow duration-300 hover:shadow-book sm:grid-cols-[minmax(0,240px)_1fr]"
      >
        {pieza.coverUrl && (
          <div className="relative h-44 w-full overflow-hidden bg-cream-warm sm:h-full sm:min-h-[220px]">
            <Image
              src={pieza.coverUrl}
              alt={pieza.titulo}
              fill
              className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]"
              sizes="(max-width: 640px) 100vw, 240px"
            />
          </div>
        )}

        <div className="flex flex-col justify-center gap-3 p-6 sm:p-8">
          <span className="inline-block w-fit rounded bg-ink px-2 py-1 font-mono text-[9.5px] uppercase tracking-[0.14em] text-cream">
            {pieza.rotulo}
          </span>

          <div>
            <h2 className="font-display text-2xl font-semibold leading-tight text-ink sm:text-[28px]">
              {pieza.titulo}
            </h2>
            {pieza.autor && (
              <p className="mt-1 font-display text-base italic text-ink-muted">{pieza.autor}</p>
            )}
          </div>

          <p className="max-w-[60ch] leading-relaxed text-ink-muted">{pieza.gancho}</p>

          {pieza.precio != null && (
            <p className="text-xl font-bold tabular-nums tracking-tight text-ink transition-colors group-hover:text-brand-600">
              ${pieza.precio.toLocaleString("es-CL")}
            </p>
          )}
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={pieza.url}
      className="group block mb-6 rounded-xl overflow-hidden border-2 border-ink bg-paper-card shadow-card hover:shadow-book transition-all duration-300"
    >
      {pieza.coverUrl && (
        <div className="relative w-full h-32 bg-cream-warm overflow-hidden">
          <Image
            src={pieza.coverUrl}
            alt={pieza.titulo}
            fill
            className="object-cover object-top group-hover:scale-[1.03] transition-transform duration-500"
            sizes="224px"
          />
        </div>
      )}

      <div className="p-3.5">
        <span className="inline-block font-mono text-[9.5px] uppercase tracking-[0.14em] text-cream bg-ink px-2 py-1 rounded">
          {pieza.rotulo}
        </span>

        <h3 className="font-display text-[15px] font-semibold text-ink leading-tight mt-2.5 line-clamp-3">
          {pieza.titulo}
        </h3>
        {pieza.autor && (
          <p className="font-display italic text-[11.5px] text-ink-muted mt-0.5 line-clamp-1">{pieza.autor}</p>
        )}

        <p className="text-[12px] text-ink-muted leading-snug mt-2.5 border-t border-paper-edge pt-2.5">
          {pieza.gancho}
        </p>

        {pieza.precio != null && (
          <p className="text-base font-bold text-ink tracking-tight mt-2.5 tabular-nums group-hover:text-brand-600 transition-colors">
            ${pieza.precio.toLocaleString("es-CL")}
          </p>
        )}
      </div>
    </Link>
  );
}
