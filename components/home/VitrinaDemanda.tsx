import Link from "next/link";
import Image from "next/image";
import type { LibroBuscado } from "@/lib/demandaBusqueda";

interface Props {
  libros: LibroBuscado[];
}

const CONDICION: Record<string, string> = {
  new: "Nuevo",
  like_new: "Como nuevo",
  very_good: "Muy buen estado",
  good: "Buen estado",
  fair: "Estado regular",
  acceptable: "Aceptable",
};

function urlLibro(l: LibroBuscado): string {
  return l.vendedorUsername && l.slug
    ? `/libro/${l.vendedorUsername}/${l.slug}`
    : `/listings/${l.listingId}`;
}

const IconoLupa = ({ size = 12 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
);

/**
 * "Lo que más se busca acá": la vitrina que sale de la demanda real, no de la
 * curaduría a mano. Un libro grande —el término más buscado— y tres al lado.
 *
 * El badge con el número de búsquedas es el punto entero de la sección: le da
 * al visitante una razón para mirar ESTE libro y no otro. La vitrina anterior
 * mostraba portada, título y precio, sin decir nunca por qué estaba ahí.
 */
export default function VitrinaDemanda({ libros }: Props) {
  if (!libros || libros.length < 4) return null;

  const [principal, ...resto] = libros;
  const secundarios = resto.slice(0, 3);

  return (
    <section className="mb-10">
      <div className="flex items-end justify-between gap-6 mb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="w-[6px] h-6 rounded-sm bg-brand-500" aria-hidden="true" />
            <h2 className="font-display text-xl sm:text-2xl font-semibold text-ink tracking-tight">
              Lo que más se busca acá
            </h2>
          </div>
          <p className="text-[11px] font-mono text-ink-muted mt-1.5 ml-[16px]">
            Los libros que la gente vino a buscar este mes — y que sí tenemos
          </p>
        </div>
        <Link
          href="/search"
          className="text-xs font-semibold text-brand-600 hover:underline flex-shrink-0 pb-1"
        >
          Buscar el tuyo →
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* El más buscado */}
        <Link
          href={urlLibro(principal)}
          className="group flex bg-paper-card border-2 border-brand-500 rounded-2xl overflow-hidden shadow-card hover:shadow-book transition-all duration-300"
        >
          <div className="relative w-[32%] min-w-[110px] max-w-[168px] bg-cream-warm flex-shrink-0">
            <Image
              src={principal.coverUrl!}
              alt={principal.titulo}
              fill
              className="object-cover group-hover:scale-[1.02] transition-transform duration-500"
              sizes="168px"
            />
          </div>
          <div className="flex flex-col p-4 sm:p-5 flex-grow min-w-0">
            <span className="self-start inline-flex items-center gap-1.5 bg-brand-500 text-brand-950 font-mono text-[10px] font-medium px-2.5 py-1.5 rounded tracking-wide mb-3">
              <IconoLupa />
              {principal.busquedas} PERSONAS LO BUSCARON
            </span>
            <h3 className="font-display text-base sm:text-xl font-semibold text-ink leading-tight line-clamp-3">
              {principal.titulo}
            </h3>
            {principal.autor && (
              <p className="font-display italic text-sm text-ink-muted mt-1 line-clamp-1">{principal.autor}</p>
            )}
            <div className="mt-auto pt-4">
              <div className="flex items-baseline gap-2.5 flex-wrap">
                {principal.precio != null && (
                  <span className="text-xl sm:text-2xl font-bold text-ink tracking-tight tabular-nums">
                    ${principal.precio.toLocaleString("es-CL")}
                  </span>
                )}
                {principal.condicion && (
                  <span className="font-mono text-[10px] text-ink-muted">
                    {CONDICION[principal.condicion] ?? principal.condicion}
                  </span>
                )}
              </div>
              {principal.vendedorNombre && (
                <p className="text-[11.5px] text-ink-muted mt-2">
                  vende <span className="font-semibold text-green">{principal.vendedorNombre}</span>
                </p>
              )}
              <span className="mt-4 flex items-center justify-center h-11 rounded-lg bg-ink text-cream text-sm font-semibold group-hover:bg-ink-deep transition-colors">
                Ver el libro
              </span>
            </div>
          </div>
        </Link>

        {/* Los otros tres */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          {secundarios.map((l) => (
            <Link
              key={l.listingId}
              href={urlLibro(l)}
              className="group flex flex-col bg-paper-card border border-paper-edge rounded-xl overflow-hidden shadow-card hover:shadow-book hover:-translate-y-0.5 transition-all duration-300"
            >
              <div className="relative aspect-[3/4] bg-cream-warm">
                <Image
                  src={l.coverUrl!}
                  alt={l.titulo}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 33vw, 180px"
                />
                <span className="absolute top-2 left-2 inline-flex items-center gap-1 bg-brand-500 text-brand-950 font-mono text-[9.5px] font-medium px-1.5 py-1 rounded">
                  <IconoLupa size={9} />
                  {l.busquedas}
                </span>
              </div>
              <div className="p-3 flex flex-col flex-grow">
                <h3 className="text-[12.5px] font-semibold text-ink leading-tight line-clamp-2 group-hover:text-brand-600 transition-colors">
                  {l.titulo}
                </h3>
                {l.autor && (
                  <p className="font-display italic text-[11px] text-ink-muted mt-0.5 line-clamp-1">{l.autor}</p>
                )}
                {l.precio != null && (
                  <span className="text-base font-bold text-ink tracking-tight mt-auto pt-2 tabular-nums">
                    ${l.precio.toLocaleString("es-CL")}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
