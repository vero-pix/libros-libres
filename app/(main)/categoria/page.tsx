import { Metadata } from "next";
import Link from "next/link";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import { CATEGORIAS } from "./[slug]/categorias.config";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Categorías — Libros Usados en Chile",
  description:
    "Explora los libros usados de tuslibros.cl por categoría: novela, historia, poesía, ensayo, infantil, universitario, escolar e idiomas. Envío a todo Chile o retiro en mano.",
  alternates: { canonical: "https://tuslibros.cl/categoria" },
  openGraph: {
    title: "Categorías — Libros Usados en Chile",
    description:
      "Explora los libros usados de tuslibros.cl por categoría. Envío a todo Chile o retiro en mano.",
    url: "https://tuslibros.cl/categoria",
    siteName: "tuslibros.cl",
    locale: "es_CL",
    type: "website",
  },
};

/** Agrupa por categoría gruesa para que el índice se lea como el catálogo real. */
const GRUPOS: { titulo: string; dbCategory: string }[] = [
  { titulo: "Ficción", dbCategory: "ficcion" },
  { titulo: "No ficción", dbCategory: "no-ficcion" },
  { titulo: "Infantil y juvenil", dbCategory: "infantil-juvenil" },
  { titulo: "Académico", dbCategory: "academico" },
  { titulo: "Idiomas", dbCategory: "idiomas" },
];

export default function CategoriasIndexPage() {
  const todas = Object.values(CATEGORIAS);

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <Breadcrumbs items={[{ label: "Inicio", href: "/" }, { label: "Categorías" }]} />

      <div className="mb-10 max-w-2xl">
        <p className="text-[11px] font-mono text-ink-muted uppercase tracking-wider mb-2">
          Descubre por categoría
        </p>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-ink mb-4 leading-tight">
          Categorías
        </h1>
        <p className="text-ink-muted text-base leading-relaxed">
          El catálogo de tuslibros.cl viene de bibliotecas que se achicaron y de
          librerías que llevan años acumulando. Estas son las secciones donde más
          se mueve: entra a la que te interese y mira qué hay hoy.
        </p>
      </div>

      <div className="space-y-10">
        {GRUPOS.map((g) => {
          const items = todas.filter((c) => c.dbCategory === g.dbCategory);
          if (!items.length) return null;
          const padre = items.find((c) => !c.dbSubcategory);
          const hijas = items
            .filter((c) => c.dbSubcategory)
            .sort((a, b) => a.displayName.localeCompare(b.displayName, "es"));
          return (
            <section key={g.dbCategory}>
              <h2 className="font-display text-xl font-bold text-ink mb-3">
                {padre ? (
                  <Link href={`/categoria/${padre.slug}`} className="hover:text-brand-600 transition-colors">
                    {g.titulo}
                  </Link>
                ) : (
                  g.titulo
                )}
              </h2>
              <div className="flex flex-wrap gap-2">
                {hijas.map((c) => (
                  <Link
                    key={c.slug}
                    href={`/categoria/${c.slug}`}
                    className="px-3 py-1.5 rounded-lg border border-cream-dark text-sm text-ink-muted hover:bg-cream-warm hover:text-ink transition-colors"
                  >
                    {c.displayName}
                  </Link>
                ))}
                {!hijas.length && padre && (
                  <Link
                    href={`/categoria/${padre.slug}`}
                    className="px-3 py-1.5 rounded-lg border border-cream-dark text-sm text-ink-muted hover:bg-cream-warm hover:text-ink transition-colors"
                  >
                    Ver {padre.displayName.toLowerCase()}
                  </Link>
                )}
              </div>
            </section>
          );
        })}
      </div>

      <div className="text-center mt-14">
        <p className="text-ink-muted mb-2">¿Tienes libros que ya leíste?</p>
        <Link href="/publish" className="text-brand-600 font-semibold hover:underline text-lg">
          Publícalos gratis y encuentra a su próximo lector &rarr;
        </Link>
      </div>
    </main>
  );
}
