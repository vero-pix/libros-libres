import Link from "next/link";
import ListingCard from "@/components/listings/ListingCard";
import { Button } from "@/components/ui/Button";
import type { ListingWithBook } from "@/types";

interface Props {
  /** Palabras que se sacaron del slug, para explicar qué se buscó. */
  consulta: string;
  parecidos: ListingWithBook[];
  /** Vendedor de la URL, si existe. Permite ofrecer su vitrina. */
  vendedor?: { username: string; nombre: string } | null;
  /** false cuando la lista es el respaldo (lo último que entró), no coincidencias. */
  sonCoincidencias: boolean;
}

/**
 * Un slug que ya no existe mandaba un 308 a la home, sin explicación: la
 * persona venía de Google sabiendo qué libro quería y aterrizaba en la portada.
 * Acá le decimos qué pasó y le dejamos tres salidas: buscar, ver parecidos o
 * entrar a la vitrina del vendedor.
 */
export default function LibroNoDisponible({ consulta, parecidos, vendedor, sonCoincidencias }: Props) {
  return (
    <div className="max-w-5xl mx-auto px-4 py-12 sm:py-16">
      <div className="text-center max-w-xl mx-auto">
        <p className="text-[11px] font-mono text-ink-muted uppercase tracking-wider mb-3">
          Ejemplar único
        </p>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink leading-tight">
          Este libro ya no está disponible
        </h1>
        <p className="text-ink-muted mt-3 leading-relaxed">
          Cada libro acá es un ejemplar único: cuando se vende, se va. Puede que
          alguien más tenga el mismo título, así que déjame buscarlo.
        </p>

        <form action="/search" method="get" className="mt-6 flex gap-2">
          <input
            type="search"
            name="q"
            defaultValue={consulta}
            placeholder="Busca por título o autor"
            aria-label="Buscar libros"
            className="flex-1 rounded-full border border-ink/15 bg-white px-5 py-3 text-sm text-ink placeholder:text-ink-muted/70 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
          />
          <Button type="submit">Buscar</Button>
        </form>

        {vendedor && (
          <p className="text-sm text-ink-muted mt-4">
            O mira lo que tiene{" "}
            <Link
              href={`/vendedor/${vendedor.username}`}
              className="text-brand-600 hover:underline"
            >
              {vendedor.nombre}
            </Link>
            .
          </p>
        )}
      </div>

      {parecidos.length > 0 && (
        <div className="mt-14">
          <h2 className="font-display text-lg font-bold text-ink mb-5">
            {sonCoincidencias ? "Parecidos a lo que buscabas" : "Lo último que llegó"}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {parecidos.map((listing) => (
              <ListingCard key={listing.id} listing={listing} showDistance={false} />
            ))}
          </div>
        </div>
      )}

      <div className="mt-12 text-center">
        <Link href="/" className="text-sm text-brand-600 hover:underline">
          Ver todo el catálogo →
        </Link>
      </div>
    </div>
  );
}
