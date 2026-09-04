import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import ListingCard from "@/components/listings/ListingCard";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import { sortListingsForDisplay } from "@/lib/sortListings";
import type { ListingWithBook } from "@/types";

export const revalidate = 300;

const URL = "https://tuslibros.cl/espiritualidad";

export const metadata: Metadata = {
  title: "Libros de espiritualidad y esoterismo usados en Chile",
  description:
    "Libros de espiritualidad usados en Chile: budismo, meditación, Krishnamurti, Ken Wilber, Steiner, Schuré, teosofía, tarot, astrología, tradición hermética. Ediciones agotadas. Envío a todo Chile.",
  alternates: { canonical: URL },
  keywords: [
    "libros de espiritualidad",
    "libros espirituales usados",
    "libros esotericos",
    "libros esotericos usados chile",
    "libros de budismo",
    "libros de meditacion",
    "krishnamurti libros",
    "los grandes iniciados schure",
    "teosofia libros",
    "libros de tarot usados",
    "libros de astrologia usados",
    "psicologia transpersonal",
    "libros ocultismo chile",
  ],
  openGraph: {
    title: "Libros de espiritualidad y esoterismo usados en Chile",
    description:
      "Budismo, meditación, Krishnamurti, Wilber, Steiner, Schuré, tarot, tradición hermética. Ediciones agotadas, usadas y con envío a todo Chile.",
    url: URL,
    siteName: "tuslibros.cl",
    locale: "es_CL",
    type: "website",
  },
};

// Espiritualidad y esoterismo: por autor, título o tag. Regex con borde de
// palabra: "oculta" solo cuenta como "ciencia oculta", "zen" no matchea "Zentner".
const NEEDLES: RegExp[] = [
  /espiritu/, /esoter/, /budis/, /\bbuda\b/, /\bzen\b/, /meditaci/, /\byoga\b/, /tarot/, /astrolog/, /ciencia oculta/, /ciencias ocultas/, /ocultismo/, /iniciad/, /teosof/, /gnóstic/, /gnostic/, /místic/, /mistic/, /kabal/, /cábala/, /cabala/, /sufi/, /chamán/, /chaman/, /alquim/, /hermétic/, /hermetic/, /rosacruz/, /masónic/, /masonic/, /masoner/, /bhagavad/, /upanishad/, /\btao\b/, /taoís/, /lao tse/, /lao-tse/, /i ching/, /vedanta/, /\breiki\b/, /transpersonal/, /conciencia/, /\bkarma\b/, /kárm/, /reencarnaci/, /chakra/, /mindfulness/,
  /ken wilber/, /rudolf steiner/, /antropos/, /krishnamurti/, /\bosho\b/, /dalai lama/, /thich nhat/, /eckhart tolle/, /carl jung/, /c\. g\. jung/, /gurdjieff/, /ouspensky/, /blavatsky/, /schuré/, /schure/, /dion fortune/, /alan watts/, /ramana/, /vivekananda/, /yogananda/, /aurobindo/, /paramahansa/, /pema chödrön/, /jorge adoum/, /mago jefa/, /eliphas/, /papus/, /guénon/, /guenon/, /castaneda/, /wayne dyer/, /deepak chopra/, /louise hay/, /gibran/, /siddhartha/,
];

const faqs = [
  {
    q: "¿Qué libros de espiritualidad se consiguen usados en Chile?",
    a: "Budismo y meditación (Thich Nhat Hanh, Dalai Lama, Pema Chödrön), Krishnamurti, Ken Wilber y la psicología transpersonal, Rudolf Steiner, la tradición esotérica europea (Schuré, Dion Fortune, Blavatsky, Papus) y bastante tarot y astrología. Casi todo sale de bibliotecas personales, así que aparece de a uno.",
  },
  {
    q: "¿Por qué estos libros son difíciles de encontrar?",
    a: "Porque son ediciones de tiradas chicas, de editoriales como Kairós, Kier, Antroposófica o Sirio, que se agotan y no siempre vuelven. En librerías de cadena en Chile hay poco; el mercado usado es donde de verdad circulan.",
  },
  {
    q: "¿Por dónde empezar?",
    a: "Depende de la puerta. Si es budismo, Thich Nhat Hanh o las Meditaciones de Marco Aurelio, que no es budista pero se lee igual. Si es la tradición occidental, Los grandes iniciados de Schuré. Si quieres el mapa que junta todo, Breve historia de todas las cosas de Ken Wilber.",
  },
  {
    q: "¿Y si el libro que busco no está?",
    a: "Crea una solicitud en tuslibros.cl con el título y te aviso cuando alguien lo publique. Es gratis y funciona: la gente publica lo que sabe que alguien está buscando.",
  },
];

const OBRAS = [
  { title: "Budismo y meditación", desc: "De los sutras a Thich Nhat Hanh. Lo más pedido del género y lo que más rápido se vende cuando aparece usado." },
  { title: "Ken Wilber y la psicología transpersonal", desc: "El intento de juntar ciencia, psicología y tradiciones contemplativas en un solo mapa. Ediciones Kairós, varias descatalogadas." },
  { title: "La tradición esotérica europea", desc: "Schuré, Blavatsky, Papus, Dion Fortune, Guénon, Steiner. Teosofía, hermetismo y antroposofía en ediciones antiguas que se buscan por el texto y por el objeto." },
  { title: "Tarot, astrología y oráculos", desc: "Manuales y barajas comentadas. Salen seguido de bibliotecas personales y se van igual de rápido." },
];

export default async function EspiritualidadPage() {
  const supabase = await createClient();

  const { data: raw } = await supabase
    .from("listings")
    .select(`*, book:books(*), seller:users(id, full_name, avatar_url, username, mercadopago_user_id)`)
    .eq("status", "active")
    .limit(1000);

  const matched = ((raw ?? []) as any[]).filter((item) => {
    if (!item.book) return false;
    const hay = `${item.book.title ?? ""} ${item.book.author ?? ""} ${(item.book.tags ?? []).join(" ")}`.toLowerCase();
    return NEEDLES.some((n) => n.test(hay));
  }) as unknown as ListingWithBook[];

  const listings = sortListingsForDisplay(matched).slice(0, 24);

  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Libros de espiritualidad y esoterismo usados en Chile",
    description:
      "Catálogo de libros de espiritualidad de segunda mano en Chile: budismo, meditación, psicología transpersonal, teosofía, tarot y tradición hermética.",
    url: URL,
    about: { "@type": "Thing", name: "Espiritualidad", sameAs: "https://es.wikipedia.org/wiki/Espiritualidad" },
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: "https://tuslibros.cl" },
      { "@type": "ListItem", position: 2, name: "Espiritualidad", item: URL },
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
          <Breadcrumbs items={[{ label: "Inicio", href: "/" }, { label: "Espiritualidad" }]} />

          <section className="mt-8 mb-12 max-w-3xl">
            <h1 className="font-display text-4xl sm:text-5xl font-bold text-ink leading-[1.05] tracking-tight">
              Espiritualidad y esoterismo —{" "}
              <span className="italic text-brand-600">libros usados en Chile.</span>
            </h1>
            <p className="mt-5 text-lg text-ink-muted leading-relaxed">
              Budismo, meditación, Krishnamurti, Wilber, Steiner, Schuré, tarot, hermetismo. Ediciones de tiradas chicas que se
              agotan y no vuelven. Usados, con envío a todo Chile o retiro en mano.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/search?q=espiritualidad" className="inline-flex items-center px-6 py-3 bg-brand-500 text-white text-sm font-semibold rounded-xl hover:bg-brand-600 transition-colors shadow-sm">
                Buscar en todo el catálogo
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
                Solicitar un libro de espiritualidad
              </Link>
            </section>
          )}

          <section className="mb-16">
            <h2 className="font-display text-2xl font-bold text-ink mb-4">Las puertas de entrada</h2>
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
            <h2 className="font-display text-2xl font-bold mb-3">¿Tienes libros de espiritualidad que ya cumplieron su ciclo contigo?</h2>
            <p className="text-cream/80 text-sm leading-relaxed max-w-xl mb-6">
              Se buscan más de lo que se ofrecen: este mes hubo decenas de búsquedas sin resultado. Publicar es gratis y solo cobro 8% cuando se vende por la plataforma.
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
              <Link href="/antroposofia" className="text-sm text-brand-600 font-medium hover:text-brand-700 underline underline-offset-2 transition-colors">Antroposofía</Link>
              <span className="text-ink-muted">·</span>
              <Link href="/autor/ken-wilber" className="text-sm text-brand-600 font-medium hover:text-brand-700 underline underline-offset-2 transition-colors">Ken Wilber</Link>
              <span className="text-ink-muted">·</span>
              <Link href="/autor/rudolf-steiner" className="text-sm text-brand-600 font-medium hover:text-brand-700 underline underline-offset-2 transition-colors">Rudolf Steiner</Link>
              <span className="text-ink-muted">·</span>
              <Link href="/filosofia" className="text-sm text-brand-600 font-medium hover:text-brand-700 underline underline-offset-2 transition-colors">Filosofía</Link>
              <span className="text-ink-muted">·</span>
              <Link href="/libros-antiguos" className="text-sm text-brand-600 font-medium hover:text-brand-700 underline underline-offset-2 transition-colors">Libros antiguos y de colección</Link>
            </div>
          </section>
        </main>
      </div>
    </>
  );
}
