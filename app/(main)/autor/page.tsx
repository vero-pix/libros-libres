import { Metadata } from "next";
import Link from "next/link";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import { AUTHORS } from "./[slug]/authors.config";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Autores — Libros Usados en Chile | tuslibros.cl",
  description:
    "Explora autores destacados en tuslibros.cl: José Donoso, Gabriela Mistral, Nicanor Parra, Roberto Bolaño, Juan Emar, María Luisa Bombal y más. Libros usados con envío a todo Chile o retiro en mano.",
  alternates: { canonical: "https://tuslibros.cl/autor" },
  openGraph: {
    title: "Autores — Libros Usados en Chile | tuslibros.cl",
    description:
      "Explora autores destacados en tuslibros.cl. Libros usados con envío a todo Chile o retiro en mano.",
    url: "https://tuslibros.cl/autor",
    siteName: "tuslibros.cl",
    locale: "es_CL",
    type: "website",
  },
};

export default function AutoresIndexPage() {
  const authors = Object.values(AUTHORS).sort((a, b) =>
    a.displayName.localeCompare(b.displayName, "es")
  );

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <Breadcrumbs items={[{ label: "Inicio", href: "/" }, { label: "Autores" }]} />

      <div className="mb-10 max-w-2xl">
        <p className="text-[11px] font-mono text-ink-muted uppercase tracking-wider mb-2">
          Descubre por autor
        </p>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-ink mb-4 leading-tight">
          Autores
        </h1>
        <p className="text-ink-muted text-base leading-relaxed">
          Una selección de autoras y autores para explorar en el catálogo de libros
          usados de tuslibros.cl. Cada página reúne sus obras disponibles ahora mismo.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {authors.map((a) => (
          <Link
            key={a.slug}
            href={`/autor/${a.slug}`}
            className="block border border-cream-dark rounded-xl bg-white p-5 hover:border-brand-600 transition-colors"
          >
            <h2 className="font-display text-lg font-bold text-ink">{a.displayName}</h2>
            <p className="text-xs text-ink-muted mt-1">{a.subtitle}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
