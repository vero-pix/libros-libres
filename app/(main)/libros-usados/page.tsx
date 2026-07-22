import Link from "next/link";
import type { Metadata } from "next";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import { CIUDADES, ORDEN } from "./ciudades";

export const metadata: Metadata = {
  title: "Libros usados en Chile por ciudad",
  description:
    "Encuentra libros usados cerca de ti. Elige tu ciudad —Santiago, Providencia, Valparaíso, Concepción y más— y compra con retiro en persona o envío a domicilio. Pago seguro con MercadoPago.",
  alternates: { canonical: "https://tuslibros.cl/libros-usados" },
  openGraph: {
    title: "Libros usados en Chile por ciudad",
    description:
      "Elige tu ciudad y encuentra libros usados con retiro en persona o despacho a domicilio. Pago seguro.",
    url: "https://tuslibros.cl/libros-usados",
    siteName: "tuslibros.cl",
    type: "website",
    locale: "es_CL",
  },
};

export default function LibrosUsadosHubPage() {
  return (
    <div className="min-h-screen bg-cream">
      <main className="max-w-5xl mx-auto px-6 py-10">
        <Breadcrumbs items={[{ label: "Inicio", href: "/" }, { label: "Libros usados" }]} />

        <section className="mt-8 mb-12 max-w-3xl">
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-ink leading-[1.05] tracking-tight">
            Libros usados en Chile, <span className="italic text-brand-600">cerca de ti.</span>
          </h1>
          <p className="mt-6 text-lg text-ink-muted leading-relaxed">
            Elige tu ciudad para ver libros usados disponibles con retiro en persona o despacho a
            domicilio. Compra y vende con pago seguro vía MercadoPago, a vendedores reales de todo el
            país.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="font-display text-2xl font-bold text-ink mb-5">Elige tu ciudad</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {ORDEN.map((s) => (
              <Link
                key={s}
                href={`/libros-usados/${s}`}
                className="block bg-white rounded-xl border border-cream-dark p-5 hover:border-brand-300 hover:shadow-sm transition-all"
              >
                <span className="font-display text-lg font-bold text-ink">{CIUDADES[s].label}</span>
                <span className="block text-sm text-ink-muted mt-1">Libros usados</span>
              </Link>
            ))}
            <Link
              href="/libros-usados-chile"
              className="block bg-white rounded-xl border border-cream-dark p-5 hover:border-brand-300 hover:shadow-sm transition-all"
            >
              <span className="font-display text-lg font-bold text-ink">Todo Chile</span>
              <span className="block text-sm text-ink-muted mt-1">Catálogo nacional</span>
            </Link>
          </div>
        </section>
      </main>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Inicio", item: "https://tuslibros.cl" },
              { "@type": "ListItem", position: 2, name: "Libros usados", item: "https://tuslibros.cl/libros-usados" },
            ],
          }),
        }}
      />
    </div>
  );
}
