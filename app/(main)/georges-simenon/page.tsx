import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import ListingCard from "@/components/listings/ListingCard";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import { sortListingsForDisplay } from "@/lib/sortListings";
import type { ListingWithBook } from "@/types";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Libros de Georges Simenon Usados en Chile | tuslibros.cl",
  description:
    "Compra libros de Georges Simenon usados en Chile. Las novelas del comisario Maigret y sus novelas duras, en segunda mano. Envío a todo Chile, pago seguro.",
  alternates: { canonical: "https://tuslibros.cl/georges-simenon" },
  keywords: [
    "georges simenon",
    "simenon libros chile",
    "comisario maigret",
    "maigret libros usados",
    "simenon segunda mano",
    "novela negra usada chile",
    "novela policial usada",
  ],
  openGraph: {
    title: "Libros de Georges Simenon Usados en Chile | tuslibros.cl",
    description: "Maigret y las novelas duras de Simenon, usados en Chile. Envío a todo el país o retiro en mano.",
    url: "https://tuslibros.cl/georges-simenon",
    siteName: "tuslibros.cl",
    locale: "es_CL",
    type: "website",
  },
};

const faqs = [
  {
    q: "¿Qué libros de Simenon se consiguen usados en Chile?",
    a: "Sobre todo las novelas del comisario Maigret —su personaje más famoso— y varias de sus novelas duras (romans durs). En tuslibros.cl suelen aparecer ediciones de Tusquets y de colecciones de bolsillo clásicas.",
  },
  {
    q: "¿Cuánto cuesta un libro de Simenon usado?",
    a: "La mayoría va entre $5.000 y $12.000 según la edición y el estado. Las ediciones antiguas de tapa dura o de colección pueden costar más por su valor de coleccionista.",
  },
  {
    q: "¿Por dónde empezar a leer a Simenon?",
    a: "Si te gusta el policial, parte por cualquier Maigret: son novelas breves y autoconclusivas. Si buscas algo más psicológico y oscuro, sus novelas duras como El gato o La nieve estaba sucia son la mejor entrada.",
  },
  {
    q: "¿Puedo vender mis libros de Simenon en tuslibros.cl?",
    a: "Sí. Los lectores de novela negra buscan completar colecciones, así que hay demanda. Publicar es gratis y la comisión es 8% solo cuando el libro se vende con pago por MercadoPago.",
  },
];

export default async function SimenonPage() {
  const supabase = await createClient();

  const { data: raw } = await supabase
    .from("listings")
    .select(`*, book:books(*), seller:users(id, full_name, avatar_url, username, mercadopago_user_id)`)
    .eq("status", "active")
    .limit(1000);

  const matched = ((raw ?? []) as any[]).filter((item) => {
    if (!item.book) return false;
    return `${item.book.author ?? ""}`.toLowerCase().includes("simenon");
  }) as unknown as ListingWithBook[];

  const listings = sortListingsForDisplay(matched).slice(0, 8);

  const personJsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: "Georges Simenon",
    birthDate: "1903-02-13",
    birthPlace: { "@type": "Place", name: "Lieja, Bélgica" },
    nationality: "Belga",
    jobTitle: "Escritor",
    description:
      "Georges Simenon fue uno de los escritores más prolíficos del siglo XX, creador del comisario Maigret y autor de cientos de novelas policiales y psicológicas (romans durs).",
    sameAs: ["https://es.wikipedia.org/wiki/Georges_Simenon"],
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: "https://tuslibros.cl" },
      { "@type": "ListItem", position: 2, name: "Libros de Georges Simenon", item: "https://tuslibros.cl/georges-simenon" },
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
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      <div className="min-h-screen bg-cream">
        <main className="max-w-5xl mx-auto px-6 py-10">
          <Breadcrumbs items={[{ label: "Inicio", href: "/" }, { label: "Georges Simenon" }]} />

          <section className="mt-8 mb-12 max-w-3xl">
            <h1 className="font-display text-4xl sm:text-5xl font-bold text-ink leading-[1.05] tracking-tight">
              Libros de Georges Simenon —{" "}
              <span className="italic text-brand-600">usados, en Chile.</span>
            </h1>
            <p className="mt-5 text-lg text-ink-muted leading-relaxed">
              El creador del comisario Maigret y uno de los autores más prolíficos del siglo XX.
              Novela negra y novelas psicológicas de segunda mano, con envío a todo el país.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/search?q=simenon" className="inline-flex items-center px-6 py-3 bg-brand-500 text-white text-sm font-semibold rounded-xl hover:bg-brand-600 transition-colors shadow-sm">
                Ver ejemplares disponibles
              </Link>
              <Link href="/solicitudes" className="inline-flex items-center px-6 py-3 bg-white border border-ink/20 text-ink text-sm font-semibold rounded-xl hover:border-brand-500 hover:text-brand-600 transition-colors">
                Avisar cuando llegue uno →
              </Link>
            </div>
          </section>

          {listings.length > 0 ? (
            <section className="mb-16">
              <h2 className="font-display text-2xl font-bold text-ink mb-5">Disponibles ahora</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {listings.map((l) => <ListingCard key={l.id} listing={l} />)}
              </div>
              <div className="mt-6">
                <Link href="/search?q=simenon" className="text-sm text-brand-600 font-semibold hover:text-brand-700 transition-colors">
                  Ver todos los libros de Simenon →
                </Link>
              </div>
            </section>
          ) : (
            <section className="mb-16 bg-white border border-cream-dark rounded-2xl p-8 text-center">
              <p className="font-display text-xl text-ink mb-2">No hay ejemplares disponibles hoy</p>
              <p className="text-sm text-ink-muted mb-6">Crea una solicitud y te avisamos cuando aparezca uno.</p>
              <Link href="/solicitudes" className="inline-flex items-center px-5 py-2.5 bg-brand-500 text-white text-sm font-semibold rounded-lg hover:bg-brand-600 transition-colors">
                Solicitar libro de Simenon
              </Link>
            </section>
          )}

          <section className="mb-16">
            <h2 className="font-display text-2xl font-bold text-ink mb-4">Lo más buscado de Simenon</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { title: "Las novelas del comisario Maigret", desc: "El detective más humano de la novela negra. Más de 70 títulos breves y autoconclusivos, ideales para leer en orden o saltado. Sus lectores buscan completar la colección." },
                { title: "El gato (1967)", desc: "Una de sus novelas duras más celebradas. El retrato implacable de un matrimonio que se odia en silencio. Pura tensión psicológica." },
                { title: "La nieve estaba sucia (1948)", desc: "Considerada su obra maestra fuera del universo Maigret. Una novela sombría sobre la ocupación y la culpa, comparada con Dostoievski." },
                { title: "Pietr, el Letón (1931)", desc: "La primera aparición de Maigret. El origen del personaje que definiría el policial europeo del siglo XX." },
              ].map((b) => (
                <div key={b.title} className="bg-white rounded-xl p-5 border border-cream-dark">
                  <h3 className="font-semibold text-ink mb-1 text-sm">{b.title}</h3>
                  <p className="text-xs text-ink-muted leading-relaxed">{b.desc}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-16 bg-ink text-cream rounded-2xl p-8 md:p-10">
            <h2 className="font-display text-2xl font-bold mb-3">¿Tienes libros de Simenon que ya no leerás?</h2>
            <p className="text-cream/80 text-sm leading-relaxed max-w-xl mb-6">
              Los lectores de novela negra buscan completar colecciones. Publicar es gratis y solo cobramos 8% cuando se vende.
            </p>
            <Link href="/publish" className="inline-flex items-center px-6 py-3 bg-brand-500 text-white text-sm font-semibold rounded-xl hover:bg-brand-600 transition-colors">
              Publicar mis libros →
            </Link>
          </section>

          <section className="mb-12">
            <h2 className="font-display text-2xl font-bold text-ink mb-6">Preguntas frecuentes</h2>
            <div className="space-y-3">
              {faqs.map((f, i) => (
                <details key={i} className="group bg-white border border-cream-dark/50 rounded-xl p-5 cursor-pointer">
                  <summary className="font-semibold text-ink text-sm list-none flex items-center justify-between gap-4">
                    {f.q}
                    <span className="text-brand-500 text-lg group-open:rotate-45 transition-transform duration-200 shrink-0">+</span>
                  </summary>
                  <p className="mt-3 text-sm text-ink-muted leading-relaxed">{f.a}</p>
                </details>
              ))}
            </div>
          </section>

          <section className="mb-12 border-t border-cream-dark pt-10">
            <p className="text-xs text-ink-muted uppercase tracking-widest font-semibold mb-4">También puede interesarte</p>
            <div className="flex flex-wrap gap-3">
              <Link href="/mario-vargas-llosa" className="text-sm text-brand-600 font-medium hover:text-brand-700 underline underline-offset-2 transition-colors">Libros de Vargas Llosa</Link>
              <span className="text-ink-muted">·</span>
              <Link href="/distopias-clasicas" className="text-sm text-brand-600 font-medium hover:text-brand-700 underline underline-offset-2 transition-colors">Distopías clásicas</Link>
              <span className="text-ink-muted">·</span>
              <Link href="/libros-antiguos" className="text-sm text-brand-600 font-medium hover:text-brand-700 underline underline-offset-2 transition-colors">Libros antiguos y de colección</Link>
              <span className="text-ink-muted">·</span>
              <Link href="/libros-usados-chile" className="text-sm text-brand-600 font-medium hover:text-brand-700 underline underline-offset-2 transition-colors">Libros usados en Chile</Link>
            </div>
          </section>
        </main>
      </div>
    </>
  );
}
