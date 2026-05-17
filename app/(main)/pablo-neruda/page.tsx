import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import ListingCard from "@/components/listings/ListingCard";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import { sortListingsForDisplay } from "@/lib/sortListings";
import type { ListingWithBook } from "@/types";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Libros de Pablo Neruda Usados en Chile | tuslibros.cl",
  description:
    "Compra libros de Pablo Neruda usados en Chile. Veinte poemas, Canto General, Odas Elementales y más. Envío a todo el país o retiro en mano. Pago seguro con MercadoPago.",
  alternates: { canonical: "https://tuslibros.cl/pablo-neruda" },
  keywords: [
    "pablo neruda",
    "libros pablo neruda",
    "neruda libros usados",
    "comprar neruda chile",
    "poemas neruda",
    "veinte poemas de amor neruda",
    "canto general neruda",
  ],
  openGraph: {
    title: "Libros de Pablo Neruda Usados en Chile | tuslibros.cl",
    description:
      "Libros de Pablo Neruda usados en Chile. Envío a todo el país o retiro en mano.",
    url: "https://tuslibros.cl/pablo-neruda",
    siteName: "tuslibros.cl",
    locale: "es_CL",
    type: "website",
  },
};

const faqs = [
  {
    q: "¿Qué libros de Pablo Neruda se consiguen usados en Chile?",
    a: "Los más frecuentes en el mercado de segunda mano son Veinte poemas de amor y una canción desesperada, Canto General, Odas Elementales, Residencia en la Tierra, Memorial de Isla Negra y Confieso que he vivido. Las primeras ediciones chilenas son las más buscadas por coleccionistas.",
  },
  {
    q: "¿Cuánto cuesta un libro de Neruda usado?",
    a: "En tuslibros.cl los precios van desde $3.000 para ediciones de bolsillo modernas hasta $80.000 o más para primeras ediciones o ejemplares firmados. La mayoría de los títulos corrientes se encuentra entre $4.000 y $15.000.",
  },
  {
    q: "¿Hay primeras ediciones de Neruda disponibles?",
    a: "Ocasionalmente sí. Chile tiene una tradición editorial nerudiana muy rica — Editorial Nascimento y Editorial Losada publicaron sus obras más importantes. Cuando aparecen primeras ediciones en el mercado chileno tienen alta demanda y precios acorde. Puedes crear una solicitud para que te avisemos cuando aparezca una.",
  },
  {
    q: "¿Cuál es el libro de Neruda más buscado?",
    a: "Veinte poemas de amor y una canción desesperada es consistentemente el más buscado, seguido de Canto General y Confieso que he vivido. Para coleccionistas, las ediciones de Residencia en la Tierra y Los versos del Capitán tienen alta cotización.",
  },
  {
    q: "¿Se pueden vender libros de Neruda en tuslibros.cl?",
    a: "Sí. Los libros de Neruda tienen demanda activa y constante. Publicar es gratis — subes una foto, ingresas los datos del libro y quedas visible para compradores en todo Chile. La comisión es 8% solo cuando el libro se vende.",
  },
];

export default async function PabloNerudaPage() {
  const supabase = await createClient();

  const { data: raw } = await supabase
    .from("listings")
    .select(`*, book:books(*), seller:users(id, full_name, avatar_url, username, mercadopago_user_id)`)
    .eq("status", "active")
    .ilike("book.author", "%neruda%")
    .order("created_at", { ascending: false })
    .limit(20);

  const listings = sortListingsForDisplay(
    ((raw ?? []).filter((item: any) => item.book !== null) as unknown as ListingWithBook[])
  ).slice(0, 8);

  const personJsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: "Pablo Neruda",
    alternateName: "Ricardo Eliécer Neftalí Reyes Basoalto",
    birthDate: "1904-07-12",
    birthPlace: { "@type": "Place", name: "Parral, Chile" },
    deathDate: "1973-09-23",
    nationality: "Chilena",
    jobTitle: "Poeta",
    award: "Premio Nobel de Literatura 1971",
    description: "Pablo Neruda fue el poeta chileno más influyente del siglo XX y uno de los grandes poetas de la lengua española. Premio Nobel de Literatura en 1971.",
    sameAs: ["https://es.wikipedia.org/wiki/Pablo_Neruda"],
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: "https://tuslibros.cl" },
      { "@type": "ListItem", position: 2, name: "Libros de Pablo Neruda", item: "https://tuslibros.cl/pablo-neruda" },
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
          <Breadcrumbs items={[{ label: "Inicio", href: "/" }, { label: "Pablo Neruda" }]} />

          <section className="mt-8 mb-12 max-w-3xl">
            <h1 className="font-display text-4xl sm:text-5xl font-bold text-ink leading-[1.05] tracking-tight">
              Libros de Pablo Neruda —{" "}
              <span className="italic text-brand-600">usados, en Chile.</span>
            </h1>
            <p className="mt-5 text-lg text-ink-muted leading-relaxed">
              El mayor poeta chileno del siglo XX. Premio Nobel 1971. Sus libros circulan
              en Chile desde hace décadas — en librerías de viejo, en estantes universitarios,
              en cajas de mudanza. Acá los encuentras con envío a todo el país.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/search?q=neruda" className="inline-flex items-center px-6 py-3 bg-brand-500 text-white text-sm font-semibold rounded-xl hover:bg-brand-600 transition-colors shadow-sm">
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
                <Link href="/search?q=neruda" className="text-sm text-brand-600 font-semibold hover:text-brand-700 transition-colors">
                  Ver todos los libros de Neruda →
                </Link>
              </div>
            </section>
          ) : (
            <section className="mb-16 bg-white border border-cream-dark rounded-2xl p-8 text-center">
              <p className="font-display text-xl text-ink mb-2">No hay ejemplares disponibles hoy</p>
              <p className="text-sm text-ink-muted mb-6">Crea una solicitud y te avisamos cuando aparezca uno.</p>
              <Link href="/solicitudes" className="inline-flex items-center px-5 py-2.5 bg-brand-500 text-white text-sm font-semibold rounded-lg hover:bg-brand-600 transition-colors">
                Solicitar libro de Neruda
              </Link>
            </section>
          )}

          <section className="mb-16">
            <h2 className="font-display text-2xl font-bold text-ink mb-4">Sus libros más buscados</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { title: "Veinte poemas de amor y una canción desesperada", desc: "Publicado en 1924 cuando Neruda tenía 19 años. El libro de poesía en español más vendido de todos los tiempos. Disponible en decenas de ediciones." },
                { title: "Canto General", desc: "Poema épico de 340 poemas sobre América Latina. Publicado en 1950. Una de las obras más ambiciosas de la poesía hispanoamericana del siglo XX." },
                { title: "Confieso que he vivido", desc: "Sus memorias, publicadas póstumamente en 1974. Relata su vida desde la infancia en Parral hasta los días previos a su muerte. Lectura esencial." },
                { title: "Odas Elementales", desc: "Tres volúmenes de poemas dedicados a objetos cotidianos: el tomate, el calcetín, la cebolla. Su obra más accesible y popular para nuevos lectores." },
              ].map((b) => (
                <div key={b.title} className="bg-white rounded-xl p-5 border border-cream-dark">
                  <h3 className="font-semibold text-ink mb-1 text-sm">{b.title}</h3>
                  <p className="text-xs text-ink-muted leading-relaxed">{b.desc}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-16 bg-ink text-cream rounded-2xl p-8 md:p-10">
            <h2 className="font-display text-2xl font-bold mb-3">¿Tienes libros de Neruda que ya no leerás?</h2>
            <p className="text-cream/80 text-sm leading-relaxed max-w-xl mb-6">
              Hay compradores buscando activamente. Los libros de Neruda en buen estado se venden rápido.
              Publicar es gratis y la comisión es solo 8% cuando se vende.
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
              <Link href="/rayuela" className="text-sm text-brand-600 font-medium hover:text-brand-700 underline underline-offset-2 transition-colors">Rayuela — Julio Cortázar</Link>
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
