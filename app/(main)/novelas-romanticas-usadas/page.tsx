import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import ListingCard from "@/components/listings/ListingCard";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import { sortListingsForDisplay } from "@/lib/sortListings";
import type { ListingWithBook } from "@/types";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Novelas Románticas Usadas en Chile",
  description:
    "Compra novelas románticas usadas en Chile: Danielle Steel, Megan Maxwell, Nicholas Sparks, Alice Kellen y más. Romance contemporáneo y clásico de segunda mano. Envío a todo Chile, pago seguro.",
  alternates: { canonical: "https://tuslibros.cl/novelas-romanticas-usadas" },
  keywords: [
    "novelas romanticas usadas",
    "libros de romance chile",
    "danielle steel usado",
    "megan maxwell libros",
    "nicholas sparks chile",
    "alice kellen",
    "novela romantica segunda mano",
  ],
  openGraph: {
    title: "Novelas Románticas Usadas en Chile",
    description: "Romance usado en Chile: Steel, Maxwell, Sparks, Kellen y más. Envío a todo el país o retiro en mano.",
    url: "https://tuslibros.cl/novelas-romanticas-usadas",
    siteName: "tuslibros.cl",
    locale: "es_CL",
    type: "website",
  },
};

// Autores típicos del género romántico para filtrar el catálogo.
const ROMANCE_NEEDLES = [
  "danielle steel", "megan maxwell", "nicholas sparks", "alice kellen",
  "federico moccia", "jojo moyes", "colleen hoover", "noah gordon",
  "corín tellado", "corin tellado", "nora roberts", "elísabet benavent",
  "elisabet benavent", "blue jeans",
];

const faqs = [
  {
    q: "¿Qué novelas románticas usadas se consiguen en Chile?",
    a: "En tuslibros.cl circulan mucho Danielle Steel, Megan Maxwell, Nicholas Sparks y Alice Kellen, además de sagas como Pídeme lo que quieras. Hay tanto romance contemporáneo como títulos clásicos del género, casi siempre en buen estado.",
  },
  {
    q: "¿Cuánto cuesta una novela romántica usada?",
    a: "La mayoría va entre $5.000 y $10.000 en buen estado. Las ediciones de bolsillo parten desde $4.000 y las tapas duras o sagas completas pueden llegar a $12.000.",
  },
  {
    q: "¿Por qué comprar romance usado en vez de nuevo?",
    a: "El romance es un género que se lee rápido y se relee poco, así que el mercado de segunda mano está lleno de ejemplares casi nuevos a mitad de precio. Es la forma más económica de mantener el ritmo de lectura.",
  },
  {
    q: "¿Puedo vender mis novelas románticas en tuslibros.cl?",
    a: "Sí, y hay demanda constante. Publicar es gratis: fotografías la portada, ingresas los datos y quedas visible para compradores en todo Chile. La comisión es 8% solo cuando el libro se vende con pago por MercadoPago.",
  },
];

export default async function NovelasRomanticasPage() {
  const supabase = await createClient();

  const { data: raw } = await supabase
    .from("listings")
    .select(`*, book:books(*), seller:users(id, full_name, avatar_url, username, mercadopago_user_id)`)
    .eq("status", "active")
    .limit(1000);

  const matched = ((raw ?? []) as any[]).filter((item) => {
    if (!item.book) return false;
    const hay = `${item.book.author ?? ""}`.toLowerCase();
    return ROMANCE_NEEDLES.some((n) => hay.includes(n));
  }) as unknown as ListingWithBook[];

  const listings = sortListingsForDisplay(matched).slice(0, 8);

  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Novelas Románticas Usadas en Chile",
    description:
      "Catálogo de novelas románticas de segunda mano en Chile: Danielle Steel, Megan Maxwell, Nicholas Sparks, Alice Kellen y más.",
    url: "https://tuslibros.cl/novelas-romanticas-usadas",
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: "https://tuslibros.cl" },
      { "@type": "ListItem", position: 2, name: "Novelas Románticas Usadas", item: "https://tuslibros.cl/novelas-romanticas-usadas" },
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
          <Breadcrumbs items={[{ label: "Inicio", href: "/" }, { label: "Novelas Románticas Usadas" }]} />

          <section className="mt-8 mb-12 max-w-3xl">
            <h1 className="font-display text-4xl sm:text-5xl font-bold text-ink leading-[1.05] tracking-tight">
              Novelas románticas —{" "}
              <span className="italic text-brand-600">usadas, en Chile.</span>
            </h1>
            <p className="mt-5 text-lg text-ink-muted leading-relaxed">
              El género que se lee rápido y se devora completo. Danielle Steel, Megan Maxwell,
              Nicholas Sparks, Alice Kellen y más, en segunda mano y a mitad de precio,
              con envío a todo el país o retiro en mano.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/search?q=romance" className="inline-flex items-center px-6 py-3 bg-brand-500 text-white text-sm font-semibold rounded-xl hover:bg-brand-600 transition-colors shadow-sm">
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
                <Link href="/search?q=romance" className="text-sm text-brand-600 font-semibold hover:text-brand-700 transition-colors">
                  Ver todas las novelas románticas →
                </Link>
              </div>
            </section>
          ) : (
            <section className="mb-16 bg-white border border-cream-dark rounded-2xl p-8 text-center">
              <p className="font-display text-xl text-ink mb-2">No hay ejemplares disponibles hoy</p>
              <p className="text-sm text-ink-muted mb-6">Crea una solicitud y te avisamos cuando aparezca uno.</p>
              <Link href="/solicitudes" className="inline-flex items-center px-5 py-2.5 bg-brand-500 text-white text-sm font-semibold rounded-lg hover:bg-brand-600 transition-colors">
                Solicitar novela romántica
              </Link>
            </section>
          )}

          <section className="mb-16">
            <h2 className="font-display text-2xl font-bold text-ink mb-4">Las autoras y autores más buscados</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { title: "Danielle Steel", desc: "La reina del romance contemporáneo. Sus novelas familiares y de superación tienen lectoras fieles que coleccionan títulos. Altísima circulación en el mercado usado chileno." },
                { title: "Megan Maxwell", desc: "Autora española de romance erótico y contemporáneo. La saga Pídeme lo que quieras es de las más pedidas. Ediciones recientes, casi siempre en muy buen estado." },
                { title: "Nicholas Sparks", desc: "El maestro del romance dramático estadounidense: Diario de una pasión, Un paseo para recordar. Muchos llegan al mercado usado tras la moda de sus adaptaciones al cine." },
                { title: "Alice Kellen", desc: "Fenómeno del New Adult en español. Sagas como Deja que ocurra y Tú y otros desastres naturales son favoritas de lectoras jóvenes." },
              ].map((b) => (
                <div key={b.title} className="bg-white rounded-xl p-5 border border-cream-dark">
                  <h3 className="font-semibold text-ink mb-1 text-sm">{b.title}</h3>
                  <p className="text-xs text-ink-muted leading-relaxed">{b.desc}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-16 bg-ink text-cream rounded-2xl p-8 md:p-10">
            <h2 className="font-display text-2xl font-bold mb-3">¿Tienes novelas románticas que ya leíste?</h2>
            <p className="text-cream/80 text-sm leading-relaxed max-w-xl mb-6">
              El romance se relee poco y se vende rápido. Publicar es gratis y solo cobramos 8% cuando se vende.
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
              <Link href="/cien-anos-de-soledad" className="text-sm text-brand-600 font-medium hover:text-brand-700 underline underline-offset-2 transition-colors">Cien años de soledad</Link>
              <span className="text-ink-muted">·</span>
              <Link href="/rayuela" className="text-sm text-brand-600 font-medium hover:text-brand-700 underline underline-offset-2 transition-colors">Rayuela — Cortázar</Link>
              <span className="text-ink-muted">·</span>
              <Link href="/distopias-clasicas" className="text-sm text-brand-600 font-medium hover:text-brand-700 underline underline-offset-2 transition-colors">Distopías clásicas</Link>
              <span className="text-ink-muted">·</span>
              <Link href="/libros-usados-chile" className="text-sm text-brand-600 font-medium hover:text-brand-700 underline underline-offset-2 transition-colors">Libros usados en Chile</Link>
            </div>
          </section>
        </main>
      </div>
    </>
  );
}
