import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import ListingCard from "@/components/listings/ListingCard";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import { sortListingsForDisplay } from "@/lib/sortListings";
import type { ListingWithBook } from "@/types";

export const revalidate = 300;

const URL = "https://tuslibros.cl/antroposofia";

export const metadata: Metadata = {
  title: "Antroposofía: libros de Rudolf Steiner usados en Chile",
  description:
    "Libros de antroposofía usados en Chile: Rudolf Steiner (La ciencia oculta, La filosofía de la libertad, Relaciones kármicas), pedagogía Waldorf, biodinámica. Ediciones Antroposófica. Envío a todo Chile.",
  alternates: { canonical: URL },
  keywords: [
    "antroposofia libros",
    "antroposofia chile",
    "rudolf steiner libros",
    "libros de rudolf steiner usados",
    "la ciencia oculta steiner",
    "la filosofia de la libertad",
    "pedagogia waldorf libros",
    "agricultura biodinamica libros",
    "editorial antroposofica",
    "libros esotericos usados chile",
  ],
  openGraph: {
    title: "Antroposofía: libros de Rudolf Steiner usados en Chile",
    description:
      "Steiner, pedagogía Waldorf, biodinámica. Ediciones que ya no se reimprimen, usadas y con envío a todo Chile.",
    url: URL,
    siteName: "tuslibros.cl",
    locale: "es_CL",
    type: "website",
  },
};

// Antroposofía: por autor o por título/tema. Steiner es el grueso; el resto
// son los autores y temas que orbitan (Waldorf, biodinámica, euritmia, Goethe
// leído desde Steiner).
const NEEDLES = [
  "rudolf steiner",
  "antropos",
  "waldorf",
  "euritm",
  "biodin",
  "goetheanum",
  "ita wegman",
  "karl könig",
  "karl konig",
  "sergei prokofieff",
  "bernard lievegoed",
  "teosof",
];

const faqs = [
  {
    q: "¿Qué es la antroposofía?",
    a: "Es la corriente que fundó Rudolf Steiner a comienzos del siglo XX: una forma de conocimiento que junta ciencia, filosofía y espiritualidad. De ahí salieron las escuelas Waldorf, la agricultura biodinámica, la medicina antroposófica y la euritmia. Los libros de base son los de Steiner; el resto de la literatura antroposófica los comenta o los aplica.",
  },
  {
    q: "¿Por dónde empezar a leer antroposofía?",
    a: "Si vienes de la filosofía, La filosofía de la libertad. Si quieres la cosmovisión completa, La ciencia oculta o Teosofía. Si llegaste por la pedagogía Waldorf, los ciclos de conferencias sobre educación son más directos que los libros de base.",
  },
  {
    q: "¿Por qué cuesta encontrar estos libros en Chile?",
    a: "Porque las ediciones en español son casi todas de Editorial Antroposófica (Buenos Aires), en tiradas chicas que se agotan y no siempre vuelven. En Chile no hay distribución estable, así que los ejemplares usados son la forma más realista de conseguirlos.",
  },
  {
    q: "¿Y si el título que busco no está?",
    a: "Crea una solicitud en tuslibros.cl con el título y te aviso cuando alguien lo publique. Es gratis y funciona: la gente publica lo que sabe que alguien está buscando.",
  },
];

const OBRAS = [
  { title: "La filosofía de la libertad (1894)", desc: "El libro que Steiner consideraba la base de todo lo que escribió después: una teoría del conocimiento y de la acción libre, anterior a la antroposofía como tal." },
  { title: "Teosofía (1904)", desc: "La primera exposición ordenada de su visión del ser humano: cuerpo, alma y espíritu, reencarnación y karma. Breve y sistemático." },
  { title: "La ciencia oculta (1910)", desc: "La cosmovisión completa: la evolución de la Tierra y del ser humano, los mundos superiores, el camino de conocimiento. El libro de referencia." },
  { title: "Ciclos de conferencias", desc: "Relaciones kármicas, el Curso de astronomía, las conferencias sobre educación y agricultura. Steiner habló mucho más de lo que escribió; estos volúmenes son sus charlas transcritas." },
];

export default async function AntroposofiaPage() {
  const supabase = await createClient();

  const { data: raw } = await supabase
    .from("listings")
    .select(`*, book:books(*), seller:users(id, full_name, avatar_url, username, mercadopago_user_id)`)
    .eq("status", "active")
    .limit(1000);

  const matched = ((raw ?? []) as any[]).filter((item) => {
    if (!item.book) return false;
    const hay = `${item.book.title ?? ""} ${item.book.author ?? ""} ${(item.book.tags ?? []).join(" ")}`.toLowerCase();
    return NEEDLES.some((n) => hay.includes(n));
  }) as unknown as ListingWithBook[];

  const listings = sortListingsForDisplay(matched).slice(0, 24);

  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Antroposofía: libros de Rudolf Steiner usados en Chile",
    description:
      "Libros de antroposofía de segunda mano en Chile: Rudolf Steiner, pedagogía Waldorf, agricultura biodinámica y autores afines.",
    url: URL,
    about: { "@type": "Thing", name: "Antroposofía", sameAs: "https://es.wikipedia.org/wiki/Antroposof%C3%ADa" },
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: "https://tuslibros.cl" },
      { "@type": "ListItem", position: 2, name: "Antroposofía", item: URL },
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
          <Breadcrumbs items={[{ label: "Inicio", href: "/" }, { label: "Antroposofía" }]} />

          <section className="mt-8 mb-12 max-w-3xl">
            <h1 className="font-display text-4xl sm:text-5xl font-bold text-ink leading-[1.05] tracking-tight">
              Antroposofía —{" "}
              <span className="italic text-brand-600">Steiner y los que vinieron después.</span>
            </h1>
            <p className="mt-5 text-lg text-ink-muted leading-relaxed">
              Los libros de Rudolf Steiner casi no se consiguen en Chile: las ediciones en español
              son de tiradas chicas y se agotan. Acá están los que yo tengo y los que otros lectores
              van publicando. Usados, con envío a todo el país o retiro en mano.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/autor/rudolf-steiner" className="inline-flex items-center px-6 py-3 bg-brand-500 text-white text-sm font-semibold rounded-xl hover:bg-brand-600 transition-colors shadow-sm">
                Ver los libros de Steiner
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
            </section>
          ) : (
            <section className="mb-16 bg-white border border-cream-dark rounded-2xl p-8 text-center">
              <p className="font-display text-xl text-ink mb-2">No hay ejemplares disponibles hoy</p>
              <p className="text-sm text-ink-muted mb-6">Crea una solicitud y te aviso cuando aparezca uno.</p>
              <Link href="/solicitudes" className="inline-flex items-center px-5 py-2.5 bg-brand-500 text-white text-sm font-semibold rounded-lg hover:bg-brand-600 transition-colors">
                Solicitar un libro de antroposofía
              </Link>
            </section>
          )}

          <section className="mb-16">
            <h2 className="font-display text-2xl font-bold text-ink mb-4">Los libros de base de Steiner</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {OBRAS.map((b) => (
                <div key={b.title} className="bg-white rounded-xl p-5 border border-cream-dark">
                  <h3 className="font-semibold text-ink mb-1 text-sm">{b.title}</h3>
                  <p className="text-xs text-ink-muted leading-relaxed">{b.desc}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-16 bg-ink text-cream rounded-2xl p-8 md:p-10">
            <h2 className="font-display text-2xl font-bold mb-3">¿Tienes libros de antroposofía que ya no lees?</h2>
            <p className="text-cream/80 text-sm leading-relaxed max-w-xl mb-6">
              Hay gente buscándolos y casi nadie los vende. Publicar es gratis y solo cobro 8% cuando se vende por la plataforma.
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
              <Link href="/autor/rudolf-steiner" className="text-sm text-brand-600 font-medium hover:text-brand-700 underline underline-offset-2 transition-colors">Rudolf Steiner</Link>
              <span className="text-ink-muted">·</span>
              <Link href="/autor/ken-wilber" className="text-sm text-brand-600 font-medium hover:text-brand-700 underline underline-offset-2 transition-colors">Ken Wilber</Link>
              <span className="text-ink-muted">·</span>
              <Link href="/libros-antiguos" className="text-sm text-brand-600 font-medium hover:text-brand-700 underline underline-offset-2 transition-colors">Libros antiguos y de colección</Link>
              <span className="text-ink-muted">·</span>
              <Link href="/categoria/no-ficcion-ensayo" className="text-sm text-brand-600 font-medium hover:text-brand-700 underline underline-offset-2 transition-colors">Ensayo</Link>
            </div>
          </section>
        </main>
      </div>
    </>
  );
}
