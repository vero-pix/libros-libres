import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import ListingCard from "@/components/listings/ListingCard";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import { sortListingsForDisplay } from "@/lib/sortListings";
import type { ListingWithBook } from "@/types";

export const revalidate = 300;

const URL = "https://tuslibros.cl/filosofia";

export const metadata: Metadata = {
  title: "Libros de filosofía usados en Chile",
  description:
    "Libros de filosofía usados en Chile: Nietzsche, Séneca y los estoicos, Platón, Kant, Foucault, Savater, Ortega y Gasset. Ediciones Alianza, Gredos, Tecnos y más. Envío a todo Chile o retiro en mano.",
  alternates: { canonical: URL },
  keywords: [
    "libros de filosofia",
    "libros de filosofia usados",
    "filosofia libros usados chile",
    "nietzsche libros",
    "seneca libros",
    "estoicismo libros",
    "platon libros usados",
    "kant critica de la razon pura",
    "foucault libros",
    "savater etica para amador",
    "ortega y gasset libros",
    "biblioteca clasica gredos",
    "comprar libros de filosofia chile",
  ],
  openGraph: {
    title: "Libros de filosofía usados en Chile",
    description:
      "Nietzsche, los estoicos, Platón, Kant, Foucault, Savater. Ediciones que ya no se reimprimen, usadas y con envío a todo Chile.",
    url: URL,
    siteName: "tuslibros.cl",
    locale: "es_CL",
    type: "website",
  },
};

// Filosofía: por autor, título o tag. Regex con borde de palabra para no
// arrastrar cosas como "kantiano" en una novela.
const NEEDLES: RegExp[] = [
  /filosof/, /\bética\b/, /\betica\b/, /estoic/, /metafísic/, /metafisic/, /epistemolog/, /fenomenolog/, /existencialis/,
  /nietzsche/, /\bkant\b/, /platón/, /platon\b/, /aristót/, /aristot/, /sócrates/, /socrates/, /heidegger/, /sartre/, /foucault/, /deleuze/, /spinoza/, /hegel/, /séneca/, /seneca/, /epicteto/, /marco aurelio/, /epicuro/, /lucrecio/, /schopenhauer/, /kierkegaard/, /wittgenstein/, /žižek/, /zizek/, /byung-chul/, /descartes/, /montaigne/, /blaise pascal/, /camus/, /hannah arendt/, /derrida/, /habermas/, /bertrand russell/, /popper/, /cioran/, /savater/, /unamuno/, /ortega y gasset/, /maquiavelo/, /hobbes/, /rousseau/, /voltaire/, /diderot/, /\bhume\b/, /\blocke\b/, /san agustín/, /tomás de aquino/, /averroes/, /plotino/, /diógenes/, /diogenes/, /bachelard/, /gadamer/, /levinas/, /ricoeur/, /nussbaum/, /chomsky/, /umberto eco/, /simone weil/, /simone de beauvoir/, /adorno/, /horkheimer/, /walter benjamin/, /marcuse/, /bauman/, /lipovetsky/, /sloterdijk/, /agamben/, /badiou/, /rancière/, /ranciere/, /mariátegui/, /mariategui/, /dussel/, /jorge millas/, /giannini/,
];

const faqs = [
  {
    q: "¿Qué libros de filosofía se consiguen usados en Chile?",
    a: "Lo que más circula son los clásicos de lectura universitaria: Nietzsche (Así habló Zaratustra, Más allá del bien y del mal), Platón (La República, los Diálogos), los estoicos (Séneca, Marco Aurelio, Epicteto), Kant, Descartes y Sartre. También Savater, Ortega y Gasset, Foucault y Byung-Chul Han, que salen mucho de bibliotecas personales.",
  },
  {
    q: "¿Por dónde empezar a leer filosofía?",
    a: "Si nunca leíste filosofía, Ética para Amador de Savater o las Meditaciones de Marco Aurelio se leen sin preparación. Si vienes de la literatura, Nietzsche y Camus. Si quieres el mapa completo, una historia de la filosofía (Russell, Copleston, Reale y Antiseri) antes de meterte con los originales.",
  },
  {
    q: "¿Qué ediciones valen la pena?",
    a: "Alianza, Gredos (la Biblioteca Clásica, para griegos y latinos), Tecnos, Trotta, Anagrama y el Fondo de Cultura Económica. Las traducciones importan más que en cualquier otro género: un Kant mal traducido no se entiende. Fíjate en el traductor en la ficha.",
  },
  {
    q: "¿Y si el libro que busco no está?",
    a: "Crea una solicitud en tuslibros.cl con el título y te aviso cuando alguien lo publique. Los libros de filosofía se mueven rápido porque hay poca oferta usada en Chile.",
  },
];

const OBRAS = [
  { title: "Los estoicos: Séneca, Marco Aurelio, Epicteto", desc: "La filosofía que más se lee hoy fuera de la universidad. Las Meditaciones y las Cartas a Lucilio son de los libros usados más pedidos del sitio." },
  { title: "Nietzsche", desc: "Así habló Zaratustra, La genealogía de la moral, Más allá del bien y del mal. Circulan sobre todo las ediciones de Alianza con traducción de Andrés Sánchez Pascual." },
  { title: "Los griegos", desc: "Platón y Aristóteles en la Biblioteca Clásica Gredos, la edición de referencia en español. Tomos sueltos aparecen seguido; la colección completa, casi nunca." },
  { title: "Filosofía contemporánea", desc: "Foucault, Deleuze, Arendt, Byung-Chul Han, Žižek. Lo que se lee en las carreras de humanidades y lo que sale de las bibliotecas cuando se termina el ramo." },
];

export default async function FilosofiaPage() {
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
    name: "Libros de filosofía usados en Chile",
    description:
      "Catálogo de libros de filosofía de segunda mano en Chile: clásicos griegos, estoicos, filosofía moderna y contemporánea.",
    url: URL,
    about: { "@type": "Thing", name: "Filosofía", sameAs: "https://es.wikipedia.org/wiki/Filosof%C3%ADa" },
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: "https://tuslibros.cl" },
      { "@type": "ListItem", position: 2, name: "Filosofía", item: URL },
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
          <Breadcrumbs items={[{ label: "Inicio", href: "/" }, { label: "Filosofía" }]} />

          <section className="mt-8 mb-12 max-w-3xl">
            <h1 className="font-display text-4xl sm:text-5xl font-bold text-ink leading-[1.05] tracking-tight">
              Libros de filosofía —{" "}
              <span className="italic text-brand-600">usados, en Chile.</span>
            </h1>
            <p className="mt-5 text-lg text-ink-muted leading-relaxed">
              Nietzsche, los estoicos, Platón, Kant, Foucault, Savater. Lo que se lee en la universidad y lo que se lee después,
              en las ediciones que ya no se reimprimen. Usados, con envío a todo Chile o retiro en mano.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/search?q=filosof%C3%ADa" className="inline-flex items-center px-6 py-3 bg-brand-500 text-white text-sm font-semibold rounded-xl hover:bg-brand-600 transition-colors shadow-sm">
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
                Solicitar un libro de filosofía
              </Link>
            </section>
          )}

          <section className="mb-16">
            <h2 className="font-display text-2xl font-bold text-ink mb-4">Por dónde entrar</h2>
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
            <h2 className="font-display text-2xl font-bold mb-3">¿Terminaste el ramo y te quedaron los libros?</h2>
            <p className="text-cream/80 text-sm leading-relaxed max-w-xl mb-6">
              Los libros de filosofía se piden más de lo que se ofrecen. Publicar es gratis y solo cobro 8% cuando se vende por la plataforma.
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
              <Link href="/espiritualidad" className="text-sm text-brand-600 font-medium hover:text-brand-700 underline underline-offset-2 transition-colors">Espiritualidad y esoterismo</Link>
              <span className="text-ink-muted">·</span>
              <Link href="/antroposofia" className="text-sm text-brand-600 font-medium hover:text-brand-700 underline underline-offset-2 transition-colors">Antroposofía</Link>
              <span className="text-ink-muted">·</span>
              <Link href="/autor/ken-wilber" className="text-sm text-brand-600 font-medium hover:text-brand-700 underline underline-offset-2 transition-colors">Ken Wilber</Link>
              <span className="text-ink-muted">·</span>
              <Link href="/libros-antiguos" className="text-sm text-brand-600 font-medium hover:text-brand-700 underline underline-offset-2 transition-colors">Libros antiguos y de colección</Link>
              <span className="text-ink-muted">·</span>
              <Link href="/categoria/no-ficcion-humanidades" className="text-sm text-brand-600 font-medium hover:text-brand-700 underline underline-offset-2 transition-colors">Humanidades</Link>
            </div>
          </section>
        </main>
      </div>
    </>
  );
}
