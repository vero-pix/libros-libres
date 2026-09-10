import Link from "next/link";
import Navbar from "@/components/ui/Navbar";
import { ButtonLink } from "@/components/ui/Button";

/**
 * La 404 del sitio. Hasta el 10-09-2026 no existía: con 59 rutas publicadas y el
 * grueso del tráfico llegando de Google, quien caía en una URL vieja veía la
 * pantalla gris por defecto de Next y se iba.
 *
 * No es una pantalla de disculpa: es una salida. Sigue la regla de nunca dejar a
 * alguien sin dónde seguir — buscar, mirar el catálogo, o pedir el libro por el
 * "Se busca", que es justo lo que sirve cuando el libro que buscaba ya se vendió.
 */
export default function NotFound() {
  return (
    <>
      <Navbar />
      <main className="max-w-3xl mx-auto px-6 py-20 sm:py-28">
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-ink-muted">
          Error 404
        </p>

        <h1 className="font-display text-4xl sm:text-5xl text-ink leading-[1.1] mt-4">
          Esta página no está.
        </h1>

        <p className="mt-5 text-lg text-ink-muted leading-relaxed max-w-xl">
          Puede que el libro que buscabas ya se haya vendido, o que la dirección
          esté mal escrita. Los libros usados son de un solo ejemplar: cuando se
          van, se van.
        </p>

        <div className="mt-9 flex flex-wrap gap-3">
          <ButtonLink href="/search" size="lg">
            Buscar en el catálogo
          </ButtonLink>
          <ButtonLink href="/solicitudes" variant="outline" size="lg">
            Pedir que lo busquemos
          </ButtonLink>
        </div>

        <div className="mt-14 pt-8 border-t border-line">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-muted">
            O parte por acá
          </p>
          <ul className="mt-4 grid sm:grid-cols-2 gap-x-8 gap-y-3">
            {[
              { href: "/", label: "La portada" },
              { href: "/libros-usados-chile", label: "Libros usados en Chile" },
              { href: "/libros-antiguos", label: "Libros antiguos y de colección" },
              { href: "/tiendas", label: "Las librerías del sitio" },
              { href: "/vender", label: "Vender mis libros" },
              { href: "/ayuda", label: "Centro de ayuda" },
            ].map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="text-ink hover:text-coral transition-colors underline-offset-4 hover:underline"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </main>
    </>
  );
}
