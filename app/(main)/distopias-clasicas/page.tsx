import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import ListingCard from "@/components/listings/ListingCard";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import { sortListingsForDisplay } from "@/lib/sortListings";
import type { ListingWithBook } from "@/types";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Distopías Clásicas Usadas en Chile | 1984, Un mundo feliz y más",
  description:
    "Compra distopías clásicas usadas en Chile: 1984 y Rebelión en la granja de Orwell, Un mundo feliz de Huxley, Fahrenheit 451 de Bradbury. Segunda mano, envío a todo Chile.",
  alternates: { canonical: "https://tuslibros.cl/distopias-clasicas" },
  keywords: [
    "distopias clasicas",
    "1984 orwell usado",
    "un mundo feliz huxley",
    "fahrenheit 451 chile",
    "rebelion en la granja",
    "libros distopia usados",
    "novela distopica segunda mano",
  ],
  openGraph: {
    title: "Distopías Clásicas Usadas en Chile",
    description: "1984, Un mundo feliz, Fahrenheit 451 y más, usados en Chile. Envío a todo el país o retiro en mano.",
    url: "https://tuslibros.cl/distopias-clasicas",
    siteName: "tuslibros.cl",
    locale: "es_CL",
    type: "website",
  },
};

// Distopías clásicas: por autor o por título.
const DYSTOPIA_NEEDLES = [
  "orwell", "aldous huxley", "ray bradbury", "bradbury", "zamiatin", "zamyatin",
  "margaret atwood", "1984", "mil novecientos ochenta", "un mundo feliz",
  "fahrenheit 451", "fahrenheit", "rebelión en la granja", "rebelion en la granja",
  "el cuento de la criada", "nosotros",
];

const faqs = [
  {
    q: "¿Qué distopías clásicas se consiguen usadas en Chile?",
    a: "Las más frecuentes son 1984 y Rebelión en la granja de George Orwell, Un mundo feliz de Aldous Huxley y Fahrenheit 451 de Ray Bradbury. También circulan El cuento de la criada de Margaret Atwood y Nosotros de Zamiatin.",
  },
  {
    q: "¿Cuánto cuesta una distopía usada?",
    a: "La mayoría va entre $4.000 y $9.000 en buen estado. Son lecturas habituales de colegio y universidad, así que hay oferta constante de ediciones de bolsillo a buen precio.",
  },
  {
    q: "¿Por dónde empezar con las distopías clásicas?",
    a: "1984 es la puerta de entrada obligada: define el género y el vocabulario (Gran Hermano, doblepensar). Un mundo feliz ofrece la cara opuesta, una distopía del placer y no del miedo. Fahrenheit 451 es la más breve y poética.",
  },
  {
    q: "¿Puedo vender mis distopías en tuslibros.cl?",
    a: "Sí, y hay demanda escolar y universitaria todo el año. Publicar es gratis y la comisión es 8% solo cuando el libro se vende con pago por MercadoPago.",
  },
];

export default async function DistopiasClasicasPage() {
  const supabase = await createClient();

  const { data: raw } = await supabase
    .from("listings")
    .select(`*, book:books(*), seller:users(id, full_name, avatar_url, username, mercadopago_user_id)`)
    .eq("status", "active")
    .limit(1000);

  const matched = ((raw ?? []) as any[]).filter((item) => {
    if (!item.book) return false;
    const hay = `${item.book.title ?? ""} ${item.book.author ?? ""}`.toLowerCase();
    return DYSTOPIA_NEEDLES.some((n) => hay.includes(n));
  }) as unknown as ListingWithBook[];

  const listings = sortListingsForDisplay(matched).slice(0, 8);

  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Distopías Clásicas Usadas en Chile",
    description:
      "Catálogo de distopías clásicas de segunda mano en Chile: 1984, Un mundo feliz, Fahrenheit 451, Rebelión en la granja y más.",
    url: "https://tuslibros.cl/distopias-clasicas",
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: "https://tuslibros.cl" },
      { "@type": "ListItem", position: 2, name: "Distopías Clásicas Usadas", item: "https://tuslibros.cl/distopias-clasicas" },
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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      <div className="min-h-screen bg-cream">
        <main className="max-w-5xl mx-auto px-6 py-10">
          <Breadcrumbs items={[{ label: "Inicio", href: "/" }, { label: "Distopías Clásicas Usadas" }]} />

          <section className="mt-8 mb-12 max-w-3xl">
            <h1 className="font-display text-4xl sm:text-5xl font-bold text-ink leading-[1.05] tracking-tight">
              Distopías clásicas —{" "}
              <span className="italic text-brand-600">usadas, en Chile.</span>
            </h1>
            <p className="mt-5 text-lg text-ink-muted leading-relaxed">
              Los libros que imaginaron el futuro para advertirnos del presente. 1984,
              Un mundo feliz, Fahrenheit 451, Rebelión en la granja y más, en segunda mano
              y con envío a todo el país.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/search?q=distopia" className="inline-flex items-center px-6 py-3 bg-brand-500 text-white text-sm font-semibold rounded-xl hover:bg-brand-600 transition-colors shadow-sm">
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
                <Link href="/search?q=distopia" className="text-sm text-brand-600 font-semibold hover:text-brand-700 transition-colors">
                  Ver todas las distopías →
                </Link>
              </div>
            </section>
          ) : (
            <section className="mb-16 bg-white border border-cream-dark rounded-2xl p-8 text-center">
              <p className="font-display text-xl text-ink mb-2">No hay ejemplares disponibles hoy</p>
              <p className="text-sm text-ink-muted mb-6">Crea una solicitud y te avisamos cuando aparezca una.</p>
              <Link href="/solicitudes" className="inline-flex items-center px-5 py-2.5 bg-brand-500 text-white text-sm font-semibold rounded-lg hover:bg-brand-600 transition-colors">
                Solicitar una distopía
              </Link>
            </section>
          )}

          <section className="mb-16">
            <h2 className="font-display text-2xl font-bold text-ink mb-4">Los títulos imprescindibles</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { title: "1984 — George Orwell (1949)", desc: "La distopía definitiva. El Gran Hermano, la neolengua y el doblepensar nacieron acá. Lectura obligada en colegios y la más buscada del género en Chile." },
                { title: "Un mundo feliz — Aldous Huxley (1932)", desc: "La cara opuesta de Orwell: una distopía del placer y el consumo, no del miedo. Un futuro donde la gente ama su propia esclavitud." },
                { title: "Fahrenheit 451 — Ray Bradbury (1953)", desc: "Un mundo donde los libros están prohibidos y los bomberos los queman. Breve, poética y más vigente que nunca." },
                { title: "Rebelión en la granja — George Orwell (1945)", desc: "La fábula política perfecta. Una revolución de animales que termina replicando la tiranía que derrocó. Corta y demoledora." },
              ].map((b) => (
                <div key={b.title} className="bg-white rounded-xl p-5 border border-cream-dark">
                  <h3 className="font-semibold text-ink mb-1 text-sm">{b.title}</h3>
                  <p className="text-xs text-ink-muted leading-relaxed">{b.desc}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-16 bg-ink text-cream rounded-2xl p-8 md:p-10">
            <h2 className="font-display text-2xl font-bold mb-3">¿Tienes distopías que ya leíste?</h2>
            <p className="text-cream/80 text-sm leading-relaxed max-w-xl mb-6">
              Demanda escolar y universitaria todo el año. Publicar es gratis y solo cobramos 8% cuando se vende.
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
              <Link href="/georges-simenon" className="text-sm text-brand-600 font-medium hover:text-brand-700 underline underline-offset-2 transition-colors">Georges Simenon</Link>
              <span className="text-ink-muted">·</span>
              <Link href="/novelas-romanticas-usadas" className="text-sm text-brand-600 font-medium hover:text-brand-700 underline underline-offset-2 transition-colors">Novelas románticas</Link>
              <span className="text-ink-muted">·</span>
              <Link href="/cien-anos-de-soledad" className="text-sm text-brand-600 font-medium hover:text-brand-700 underline underline-offset-2 transition-colors">Cien años de soledad</Link>
              <span className="text-ink-muted">·</span>
              <Link href="/libros-usados-chile" className="text-sm text-brand-600 font-medium hover:text-brand-700 underline underline-offset-2 transition-colors">Libros usados en Chile</Link>
            </div>
          </section>
        </main>
      </div>
    </>
  );
}
