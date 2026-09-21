import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/server";
import ListingCard from "@/components/listings/ListingCard";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import { getListingsPrimavera } from "@/lib/primavera";
import { esPrimavera } from "@/lib/fechasChile";

export const revalidate = 300;

const URL = "https://tuslibros.cl/primavera";

export const metadata: Metadata = {
  title: "Libros de primavera: fantasía, poesía y novedades usadas en Chile",
  description:
    "La selección de primavera de tuslibros.cl: fantasía, romantasy y poesía usadas, de personas reales en todo Chile. Retiro en mano o despacho por courier.",
  alternates: { canonical: URL },
  keywords: [
    "libros de fantasia usados",
    "romantasy chile",
    "libros de fantasia chile",
    "poesia usada chile",
    "novedades libros usados",
    "libros primavera",
  ],
  openGraph: {
    title: "Libros de primavera en tuslibros.cl",
    description:
      "Fantasía, romantasy y poesía: lo que recién llegó a las estanterías de otros.",
    url: URL,
    siteName: "tuslibros.cl",
    locale: "es_CL",
    type: "website",
  },
};

const faqs = [
  {
    q: "¿Por qué una selección de primavera?",
    a: "Porque en septiembre la gente ordena la casa y suelta libros, y porque es cuando más se busca algo distinto para leer. Acá junto lo que recién llegó al catálogo: fantasía, romantasy y poesía, que es lo que más se pide y lo que menos abunda usado en Chile.",
  },
  {
    q: "¿Hay fantasía y romantasy de verdad?",
    a: "Sí, y es lo más nuevo del catálogo. Durante meses la gente buscó fantasía acá y no encontraba nada: Cinder, por ejemplo, se buscó 26 veces sin un solo resultado. Hoy hay sagas completas —Percy Jackson, Asesino de brujas, Sombras de Magia, Crave— además de Sarah J. Maas, Olivie Blake, Laura Gallego y Chloe Gong.",
  },
  {
    q: "¿Son libros usados?",
    a: "Sí, todos usados, y cada ficha dice en qué estado está. Varios están como nuevos: son de gente que los leyó una vez y necesita el espacio en la repisa.",
  },
  {
    q: "¿Cómo los recibo?",
    a: "Depende del vendedor: retiro en mano si están cerca tuyo, o despacho por courier a todo Chile. Sobre $20.000 el envío va gratis. El pago con MercadoPago queda protegido.",
  },
  {
    q: "¿Y si el que busco no está?",
    a: "Déjalo en «Se busca» con el título y te aviso cuando alguien lo publique. Es gratis, y funciona: la gente publica lo que sabe que alguien está esperando.",
  },
];

export default async function PrimaveraPage() {
  const supabase = await createClient();
  const listings = await getListingsPrimavera(supabase, 48);
  const vigente = esPrimavera();

  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Libros de primavera: fantasía, poesía y novedades usadas en Chile",
    description:
      "Selección de primavera de tuslibros.cl: fantasía, romantasy y poesía, usados, en todo Chile.",
    url: URL,
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: "https://tuslibros.cl" },
      { "@type": "ListItem", position: 2, name: "Primavera", item: URL },
    ],
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <div className="min-h-screen bg-cream">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      <section className="bg-hero border-b border-hero-line">
        <div className="max-w-6xl mx-auto px-6 pt-8 pb-12">
          <Breadcrumbs items={[{ label: "Inicio", href: "/" }, { label: "Primavera" }]} />
          <p className="inline-flex items-center gap-3 text-[11px] font-mono uppercase tracking-[0.22em] text-coral mt-6 mb-4 before:content-[''] before:w-6 before:h-px before:bg-current">
            {vigente ? "Primavera 2026" : "Selección de primavera"}
          </p>
          <h1 className="font-display text-4xl sm:text-5xl font-normal text-ink leading-[1.05] tracking-[-0.02em] max-w-3xl">
            Se acabó el invierno{" "}
            <em className="italic">de releer lo mismo.</em>
          </h1>
          <p className="mt-6 font-display italic text-lg sm:text-xl text-ink-muted/90 leading-snug max-w-2xl">
            Fantasía, romantasy y poesía. Lo que recién llegó a las estanterías de
            otras personas y todavía no tiene dueño nuevo.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="#seleccion">Ver los {listings.length} libros</ButtonLink>
            <ButtonLink href="/publish" variant="secondary">Publicar uno mío</ButtonLink>
          </div>
        </div>
      </section>

      <section id="seleccion" className="max-w-7xl mx-auto px-6 py-10 scroll-mt-32">
        {listings.length === 0 ? (
          <p className="text-sm text-ink-muted">
            Por ahora no hay libros en la selección.{" "}
            <a className="text-link underline" href="/solicitudes">Pide el que buscas</a> y te aviso cuando llegue.
          </p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {listings.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        )}
      </section>

      <section className="bg-white border-y border-cream-dark">
        <div className="max-w-3xl mx-auto px-6 py-12">
          <h2 className="font-display text-2xl font-bold text-ink mb-6">Preguntas</h2>
          <div className="space-y-6">
            {faqs.map((f) => (
              <div key={f.q}>
                <h3 className="font-display text-base font-semibold text-ink mb-1.5">{f.q}</h3>
                <p className="text-sm text-ink-muted leading-relaxed">{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
