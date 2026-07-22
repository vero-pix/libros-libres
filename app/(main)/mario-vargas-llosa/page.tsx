import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import ListingCard from "@/components/listings/ListingCard";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import { sortListingsForDisplay } from "@/lib/sortListings";
import type { ListingWithBook } from "@/types";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Libros de Vargas Llosa Usados en Chile",
  description:
    "Compra libros de Mario Vargas Llosa usados en Chile. La ciudad y los perros, La fiesta del Chivo, Conversación en La Catedral y más. Envío a todo Chile. Pago seguro.",
  alternates: { canonical: "https://tuslibros.cl/mario-vargas-llosa" },
  keywords: [
    "vargas llosa",
    "mario vargas llosa",
    "libros vargas llosa chile",
    "vargas llosa libros usados",
    "la ciudad y los perros",
    "la fiesta del chivo",
    "conversacion en la catedral",
  ],
  openGraph: {
    title: "Libros de Vargas Llosa Usados en Chile",
    description: "Libros de Mario Vargas Llosa usados en Chile. Envío a todo el país o retiro en mano.",
    url: "https://tuslibros.cl/mario-vargas-llosa",
    siteName: "tuslibros.cl",
    locale: "es_CL",
    type: "website",
  },
};

const faqs = [
  {
    q: "¿Qué libros de Vargas Llosa se consiguen usados en Chile?",
    a: "Los más frecuentes son La ciudad y los perros, La fiesta del Chivo, Conversación en La Catedral, El sueño del celta, La guerra del fin del mundo y El hablador. También circulan sus ensayos: La civilización del espectáculo y La llamada de la tribu.",
  },
  {
    q: "¿Cuánto cuesta un libro de Vargas Llosa usado?",
    a: "En tuslibros.cl los precios van de $4.000 para ediciones de bolsillo hasta $25.000 para ediciones especiales o con dedicatoria. La mayoría de sus novelas se encuentra entre $5.000 y $14.000 en buen estado.",
  },
  {
    q: "¿Cuál es la mejor novela de Vargas Llosa para empezar?",
    a: "Depende del lector. Para quien no lo conoce, La fiesta del Chivo es una entrada accesible y apasionante. La ciudad y los perros es su obra más celebrada en Chile, especialmente en liceos. Conversación en La Catedral es considerada su obra cumbre pero requiere más dedicación.",
  },
  {
    q: "¿Hay libros de Vargas Llosa en Chile con frecuencia?",
    a: "Sí. Vargas Llosa tiene alta circulación en el mercado de segunda mano chileno. Sus novelas son lectura obligatoria en muchos liceos y universidades, por lo que hay oferta constante de estudiantes que venden sus ejemplares.",
  },
  {
    q: "¿Puedo vender mis libros de Vargas Llosa en tuslibros.cl?",
    a: "Sí, y hay demanda activa. Publicar es gratis. Fotografías la portada, ingresas los datos y quedas visible para compradores en todo Chile. La comisión es 8% solo cuando el libro se vende con pago por MercadoPago.",
  },
];

export default async function MarioVargasLlosaPage() {
  const supabase = await createClient();

  const { data: raw } = await supabase
    .from("listings")
    .select(`*, book:books(*), seller:users(id, full_name, avatar_url, username, mercadopago_user_id)`)
    .eq("status", "active")
    .ilike("book.author", "%vargas llosa%")
    .order("created_at", { ascending: false })
    .limit(20);

  const listings = sortListingsForDisplay(
    ((raw ?? []).filter((item: any) => item.book !== null) as unknown as ListingWithBook[])
  ).slice(0, 8);

  const personJsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: "Mario Vargas Llosa",
    birthDate: "1936-03-28",
    birthPlace: { "@type": "Place", name: "Arequipa, Perú" },
    nationality: "Peruana",
    jobTitle: "Escritor",
    award: "Premio Nobel de Literatura 2010",
    description: "Mario Vargas Llosa es uno de los grandes escritores latinoamericanos del siglo XX. Premio Nobel de Literatura 2010. Autor de La ciudad y los perros, Conversación en La Catedral y La fiesta del Chivo.",
    sameAs: ["https://es.wikipedia.org/wiki/Mario_Vargas_Llosa"],
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: "https://tuslibros.cl" },
      { "@type": "ListItem", position: 2, name: "Libros de Vargas Llosa", item: "https://tuslibros.cl/mario-vargas-llosa" },
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
          <Breadcrumbs items={[{ label: "Inicio", href: "/" }, { label: "Mario Vargas Llosa" }]} />

          <section className="mt-8 mb-12 max-w-3xl">
            <h1 className="font-display text-4xl sm:text-5xl font-bold text-ink leading-[1.05] tracking-tight">
              Libros de Vargas Llosa —{" "}
              <span className="italic text-brand-600">usados, en Chile.</span>
            </h1>
            <p className="mt-5 text-lg text-ink-muted leading-relaxed">
              Premio Nobel de Literatura 2010. Uno de los autores más leídos
              en Chile — en liceos, universidades y bibliotecas personales.
              Encuentra sus novelas y ensayos en segunda mano, con envío a todo el país.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/search?q=vargas+llosa" className="inline-flex items-center px-6 py-3 bg-brand-500 text-white text-sm font-semibold rounded-xl hover:bg-brand-600 transition-colors shadow-sm">
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
                <Link href="/search?q=vargas+llosa" className="text-sm text-brand-600 font-semibold hover:text-brand-700 transition-colors">
                  Ver todos los libros de Vargas Llosa →
                </Link>
              </div>
            </section>
          ) : (
            <section className="mb-16 bg-white border border-cream-dark rounded-2xl p-8 text-center">
              <p className="font-display text-xl text-ink mb-2">No hay ejemplares disponibles hoy</p>
              <p className="text-sm text-ink-muted mb-6">Crea una solicitud y te avisamos cuando aparezca uno.</p>
              <Link href="/solicitudes" className="inline-flex items-center px-5 py-2.5 bg-brand-500 text-white text-sm font-semibold rounded-lg hover:bg-brand-600 transition-colors">
                Solicitar libro de Vargas Llosa
              </Link>
            </section>
          )}

          <section className="mb-16">
            <h2 className="font-display text-2xl font-bold text-ink mb-4">Sus novelas más buscadas</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { title: "La ciudad y los perros (1963)", desc: "Su primera novela y una de las más influyentes del boom latinoamericano. Ambientada en el Colegio Militar Leoncio Prado de Lima. Lectura habitual en liceos chilenos." },
                { title: "Conversación en La Catedral (1969)", desc: "Considerada su obra maestra. La historia de un país y una época a través de una conversación de cuatro horas en un bar de Lima. Novela total del boom." },
                { title: "La fiesta del Chivo (2000)", desc: "El asesinato de Trujillo en República Dominicana. Thriller político e histórico que mezcla tres líneas narrativas. Uno de sus libros más accesibles y vendidos." },
                { title: "El sueño del celta (2010)", desc: "La historia de Roger Casement, diplomático irlandés que denunció los crímenes del colonialismo en el Congo y el Amazonas. Publicada el año de su Nobel." },
              ].map((b) => (
                <div key={b.title} className="bg-white rounded-xl p-5 border border-cream-dark">
                  <h3 className="font-semibold text-ink mb-1 text-sm">{b.title}</h3>
                  <p className="text-xs text-ink-muted leading-relaxed">{b.desc}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-16 bg-ink text-cream rounded-2xl p-8 md:p-10">
            <h2 className="font-display text-2xl font-bold mb-3">¿Tienes libros de Vargas Llosa que ya no leerás?</h2>
            <p className="text-cream/80 text-sm leading-relaxed max-w-xl mb-6">
              Alta demanda, especialmente en temporada escolar. Publicar es gratis y solo cobramos 8% cuando se vende.
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
              <Link href="/pablo-neruda" className="text-sm text-brand-600 font-medium hover:text-brand-700 underline underline-offset-2 transition-colors">Libros de Neruda</Link>
              <span className="text-ink-muted">·</span>
              <Link href="/cien-anos-de-soledad" className="text-sm text-brand-600 font-medium hover:text-brand-700 underline underline-offset-2 transition-colors">Cien años de soledad</Link>
              <span className="text-ink-muted">·</span>
              <Link href="/rayuela" className="text-sm text-brand-600 font-medium hover:text-brand-700 underline underline-offset-2 transition-colors">Rayuela — Cortázar</Link>
              <span className="text-ink-muted">·</span>
              <Link href="/libros-usados-chile" className="text-sm text-brand-600 font-medium hover:text-brand-700 underline underline-offset-2 transition-colors">Libros usados en Chile</Link>
            </div>
          </section>
        </main>
      </div>
    </>
  );
}
