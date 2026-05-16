import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import ListingCard from "@/components/listings/ListingCard";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import { sortListingsForDisplay } from "@/lib/sortListings";
import type { ListingWithBook } from "@/types";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Cien Años de Soledad — Libro Usado en Chile | tuslibros.cl",
  description:
    "Compra Cien años de soledad de García Márquez usado en Chile. Envío a todo el país o retiro en mano. Pago seguro con MercadoPago desde $4.000.",
  alternates: { canonical: "https://tuslibros.cl/cien-anos-de-soledad" },
  keywords: [
    "cien años de soledad",
    "garcia marquez",
    "cien años de soledad libro usado",
    "garcia marquez chile",
    "comprar cien años de soledad",
    "gabriel garcia marquez libros",
  ],
  openGraph: {
    title: "Cien Años de Soledad — Libro Usado en Chile | tuslibros.cl",
    description: "Cien años de soledad de García Márquez, usado en Chile. Envío a todo el país.",
    url: "https://tuslibros.cl/cien-anos-de-soledad",
    siteName: "tuslibros.cl",
    locale: "es_CL",
    type: "website",
  },
};

const faqs = [
  {
    q: "¿Qué edición de Cien años de soledad se consigue usada en Chile?",
    a: "Las más comunes son las ediciones de Editorial Sudamericana, Debolsillo y la edición conmemorativa de la RAE. El contenido del texto es idéntico. Para coleccionistas, las primeras ediciones de Sudamericana (Buenos Aires, 1967) tienen alto valor, aunque raramente aparecen en el mercado de segunda mano.",
  },
  {
    q: "¿Cuánto cuesta Cien años de soledad usado en Chile?",
    a: "En tuslibros.cl los ejemplares usados se encuentran entre $4.000 y $18.000 según el estado y la edición. La edición conmemorativa de la RAE (tapa dura, gran formato) puede costar más. El libro nuevo en librerías chilenas ronda los $20.000–$30.000.",
  },
  {
    q: "¿Es difícil leer Cien años de soledad?",
    a: "No es técnicamente difícil, pero requiere seguir el árbol genealógico de los Buendía. Muchas ediciones incluyen el árbol al inicio — úsalo. El realismo mágico de García Márquez es fluido y apasionante. La mayoría de lectores que la empiezan con dudas la terminan encantados.",
  },
  {
    q: "¿Qué otros libros de García Márquez se consiguen usados?",
    a: "El amor en los tiempos del cólera, El coronel no tiene quien le escriba, La hojarasca, Crónica de una muerte anunciada y El otoño del patriarca circulan con frecuencia en el mercado de segunda mano chileno.",
  },
  {
    q: "¿Puedo vender mi ejemplar en tuslibros.cl?",
    a: "Sí. García Márquez tiene demanda constante. Publicar es gratis — fotografías la portada, ingresas los datos y quedas visible para compradores en todo Chile. La comisión es 8% solo cuando el libro se vende.",
  },
];

export default async function CienAnosDeSoledadPage() {
  const supabase = await createClient();

  const { data: raw } = await supabase
    .from("listings")
    .select(`*, book:books(*), seller:users(id, full_name, avatar_url, username, mercadopago_user_id)`)
    .eq("status", "active")
    .ilike("book.title", "%cien a%os de soledad%")
    .order("created_at", { ascending: false })
    .limit(20);

  // Fallback: si no encuentra por título exacto, busca por autor
  const { data: rawByAuthor } = await supabase
    .from("listings")
    .select(`*, book:books(*), seller:users(id, full_name, avatar_url, username, mercadopago_user_id)`)
    .eq("status", "active")
    .ilike("book.author", "%garc%a m%rquez%")
    .order("created_at", { ascending: false })
    .limit(20);

  const combined = [...(raw ?? []), ...(rawByAuthor ?? [])];
  const unique = combined.filter((item, idx, arr) => arr.findIndex((i: any) => i.id === (item as any).id) === idx);
  const listings = sortListingsForDisplay((unique as unknown as ListingWithBook[]) ?? []).slice(0, 8);

  const bookJsonLd = {
    "@context": "https://schema.org",
    "@type": "Book",
    name: "Cien años de soledad",
    author: { "@type": "Person", name: "Gabriel García Márquez" },
    datePublished: "1967",
    inLanguage: "es",
    bookFormat: "https://schema.org/Paperback",
    description: "Cien años de soledad es la novela del escritor colombiano Gabriel García Márquez publicada en 1967. Considerada la obra cumbre del realismo mágico y una de las más importantes de la literatura en español del siglo XX. Premio Nobel de Literatura 1982.",
    genre: "Realismo mágico",
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: "https://tuslibros.cl" },
      { "@type": "ListItem", position: 2, name: "Cien años de soledad", item: "https://tuslibros.cl/cien-anos-de-soledad" },
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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(bookJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      <div className="min-h-screen bg-cream">
        <main className="max-w-5xl mx-auto px-6 py-10">
          <Breadcrumbs items={[{ label: "Inicio", href: "/" }, { label: "Cien años de soledad" }]} />

          <section className="mt-8 mb-12 max-w-3xl">
            <h1 className="font-display text-4xl sm:text-5xl font-bold text-ink leading-[1.05] tracking-tight">
              Cien años de soledad —{" "}
              <span className="italic text-brand-600">usado, en Chile.</span>
            </h1>
            <p className="mt-5 text-lg text-ink-muted leading-relaxed">
              La novela de Gabriel García Márquez que cambió la literatura en español.
              Premio Nobel 1982. Un clásico que circula constantemente en librerías de
              viejo y entre lectores en todo Chile. Envío a todo el país o retiro en mano.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/search?q=cien+anos+de+soledad" className="inline-flex items-center px-6 py-3 bg-brand-500 text-white text-sm font-semibold rounded-xl hover:bg-brand-600 transition-colors shadow-sm">
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
                <Link href="/search?q=garcia+marquez" className="text-sm text-brand-600 font-semibold hover:text-brand-700 transition-colors">
                  Ver todos los libros de García Márquez →
                </Link>
              </div>
            </section>
          ) : (
            <section className="mb-16 bg-white border border-cream-dark rounded-2xl p-8 text-center">
              <p className="font-display text-xl text-ink mb-2">No hay ejemplares disponibles hoy</p>
              <p className="text-sm text-ink-muted mb-6">Crea una solicitud y te avisamos cuando aparezca uno.</p>
              <Link href="/solicitudes" className="inline-flex items-center px-5 py-2.5 bg-brand-500 text-white text-sm font-semibold rounded-lg hover:bg-brand-600 transition-colors">
                Solicitar Cien años de soledad
              </Link>
            </section>
          )}

          <section className="mb-16">
            <h2 className="font-display text-2xl font-bold text-ink mb-4">Sobre el libro</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl p-6 border border-cream-dark">
                <h3 className="font-semibold text-ink mb-2">El libro</h3>
                <p className="text-sm text-ink-muted leading-relaxed">
                  Publicada en Buenos Aires en 1967, Cien años de soledad narra la historia
                  de la familia Buendía a lo largo de siete generaciones en el pueblo ficticio de Macondo.
                  Obra fundacional del realismo mágico, ha vendido más de 50 millones de copias
                  y fue traducida a más de 40 idiomas. García Márquez recibió el Nobel en 1982.
                </p>
              </div>
              <div className="bg-white rounded-xl p-6 border border-cream-dark">
                <h3 className="font-semibold text-ink mb-2">Otros libros de García Márquez</h3>
                <p className="text-sm text-ink-muted leading-relaxed">
                  Si ya leíste Cien años de soledad, los siguientes más recomendados son
                  El amor en los tiempos del cólera (más accesible, gran historia de amor),
                  El coronel no tiene quien le escriba (corto y perfecto) y Crónica de una muerte anunciada.
                  Todos circulan con frecuencia en tuslibros.cl.
                </p>
              </div>
            </div>
          </section>

          <section className="mb-16 bg-ink text-cream rounded-2xl p-8 md:p-10">
            <h2 className="font-display text-2xl font-bold mb-3">¿Tienes Cien años de soledad y ya no la leerás?</h2>
            <p className="text-cream/80 text-sm leading-relaxed max-w-xl mb-6">
              Alta demanda. Publicar es gratis y la comisión es solo 8% cuando se vende.
            </p>
            <Link href="/publish" className="inline-flex items-center px-6 py-3 bg-brand-500 text-white text-sm font-semibold rounded-xl hover:bg-brand-600 transition-colors">
              Publicar mi libro →
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
              <Link href="/rayuela" className="text-sm text-brand-600 font-medium hover:text-brand-700 underline underline-offset-2 transition-colors">Rayuela — Cortázar</Link>
              <span className="text-ink-muted">·</span>
              <Link href="/pablo-neruda" className="text-sm text-brand-600 font-medium hover:text-brand-700 underline underline-offset-2 transition-colors">Libros de Neruda</Link>
              <span className="text-ink-muted">·</span>
              <Link href="/mario-vargas-llosa" className="text-sm text-brand-600 font-medium hover:text-brand-700 underline underline-offset-2 transition-colors">Libros de Vargas Llosa</Link>
              <span className="text-ink-muted">·</span>
              <Link href="/libros-usados-chile" className="text-sm text-brand-600 font-medium hover:text-brand-700 underline underline-offset-2 transition-colors">Libros usados en Chile</Link>
            </div>
          </section>
        </main>
      </div>
    </>
  );
}
