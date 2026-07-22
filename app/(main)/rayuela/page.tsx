import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import ListingCard from "@/components/listings/ListingCard";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import { sortListingsForDisplay } from "@/lib/sortListings";
import type { ListingWithBook } from "@/types";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Rayuela de Cortázar — Libro Usado en Chile",
  description:
    "Compra Rayuela de Julio Cortázar usado en Chile. Ejemplares disponibles con envío a todo el país o retiro en mano. Pago seguro con MercadoPago.",
  alternates: { canonical: "https://tuslibros.cl/rayuela" },
  keywords: [
    "rayuela",
    "rayuela libro",
    "rayuela cortazar",
    "julio cortazar rayuela",
    "comprar rayuela usado chile",
    "rayuela libro usado",
  ],
  openGraph: {
    title: "Rayuela de Cortázar — Libro Usado en Chile",
    description: "Compra Rayuela de Julio Cortázar usado en Chile. Envío a todo el país.",
    url: "https://tuslibros.cl/rayuela",
    siteName: "tuslibros.cl",
    locale: "es_CL",
    type: "website",
  },
};

const faqs = [
  {
    q: "¿Qué edición de Rayuela se consigue usada en Chile?",
    a: "Las más comunes son las ediciones de Alfaguara, Editorial Sudamericana y Punto de Lectura. Todas contienen el texto completo de los 155 capítulos. Para coleccionistas, las ediciones de Sudamericana de los años 60 y 70 son las más buscadas.",
  },
  {
    q: "¿Se puede leer Rayuela en orden o hay que saltarse capítulos?",
    a: "Cortázar propone dos formas de lectura: en orden convencional (capítulos 1 al 56) o siguiendo el tablero de dirección que aparece al inicio del libro, que incluye los capítulos prescindibles. Ambas lecturas son válidas — la segunda es la propuesta experimental del autor.",
  },
  {
    q: "¿Cuánto cuesta Rayuela usado en Chile?",
    a: "En tuslibros.cl los ejemplares usados de Rayuela se encuentran típicamente entre $5.000 y $16.000 según el estado y la edición. El libro nuevo en librerías chilenas ronda los $22.000–$28.000.",
  },
  {
    q: "¿Es difícil de leer Rayuela?",
    a: "Requiere atención, pero no es un libro técnico. La escritura de Cortázar es lúdica y apasionante. Muchos lectores que dudaban en empezarla la terminan con entusiasmo. La edición de Alfaguara tiene un prólogo útil para orientarse antes de empezar.",
  },
  {
    q: "¿Puedo vender mi ejemplar de Rayuela en tuslibros.cl?",
    a: "Sí. Rayuela tiene demanda constante. Publicar es gratis — subes una foto de la portada, ingresas los datos y quedas visible para compradores en todo Chile. Comisión de 8% solo cuando se vende.",
  },
];

export default async function RayuelaPage() {
  const supabase = await createClient();

  const { data: raw } = await supabase
    .from("listings")
    .select(`*, book:books(*), seller:users(id, full_name, avatar_url, username, mercadopago_user_id)`)
    .eq("status", "active")
    .ilike("book.title", "%rayuela%")
    .order("created_at", { ascending: false })
    .limit(20);

  const listings = sortListingsForDisplay(
    ((raw ?? []).filter((item: any) => item.book !== null) as unknown as ListingWithBook[])
  ).slice(0, 8);

  const bookJsonLd = {
    "@context": "https://schema.org",
    "@type": "Book",
    name: "Rayuela",
    author: { "@type": "Person", name: "Julio Cortázar" },
    datePublished: "1963",
    inLanguage: "es",
    bookFormat: "https://schema.org/Paperback",
    description: "Rayuela es la novela experimental de Julio Cortázar publicada en 1963. Considerada una de las obras fundamentales de la literatura latinoamericana, propone al lector dos formas distintas de lectura a través de sus 155 capítulos.",
    genre: "Novela experimental",
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: "https://tuslibros.cl" },
      { "@type": "ListItem", position: 2, name: "Rayuela — Cortázar", item: "https://tuslibros.cl/rayuela" },
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
          <Breadcrumbs items={[{ label: "Inicio", href: "/" }, { label: "Rayuela" }]} />

          <section className="mt-8 mb-12 max-w-3xl">
            <h1 className="font-display text-4xl sm:text-5xl font-bold text-ink leading-[1.05] tracking-tight">
              Rayuela de Cortázar —{" "}
              <span className="italic text-brand-600">usado, en Chile.</span>
            </h1>
            <p className="mt-5 text-lg text-ink-muted leading-relaxed">
              La novela que cambió la literatura latinoamericana. Publicada en 1963,
              Rayuela sigue siendo una de las obras más buscadas en librerías de viejo
              y mercados de segunda mano. Con envío a todo Chile o retiro en mano.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/search?q=rayuela" className="inline-flex items-center px-6 py-3 bg-brand-500 text-white text-sm font-semibold rounded-xl hover:bg-brand-600 transition-colors shadow-sm">
                Ver ejemplares disponibles
              </Link>
              <Link href="/solicitudes" className="inline-flex items-center px-6 py-3 bg-white border border-ink/20 text-ink text-sm font-semibold rounded-xl hover:border-brand-500 hover:text-brand-600 transition-colors">
                Avisar cuando llegue una →
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
                <Link href="/search?q=rayuela" className="text-sm text-brand-600 font-semibold hover:text-brand-700 transition-colors">
                  Ver todos los resultados →
                </Link>
              </div>
            </section>
          ) : (
            <section className="mb-16 bg-white border border-cream-dark rounded-2xl p-8 text-center">
              <p className="font-display text-xl text-ink mb-2">No hay ejemplares disponibles hoy</p>
              <p className="text-sm text-ink-muted mb-6">Crea una solicitud y te avisamos cuando aparezca una.</p>
              <Link href="/solicitudes" className="inline-flex items-center px-5 py-2.5 bg-brand-500 text-white text-sm font-semibold rounded-lg hover:bg-brand-600 transition-colors">
                Solicitar Rayuela
              </Link>
            </section>
          )}

          <section className="mb-16">
            <h2 className="font-display text-2xl font-bold text-ink mb-4">Sobre Rayuela</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl p-6 border border-cream-dark">
                <h3 className="font-semibold text-ink mb-2">El libro</h3>
                <p className="text-sm text-ink-muted leading-relaxed">
                  Publicada en Buenos Aires en 1963 por Editorial Sudamericana, Rayuela de Julio Cortázar
                  es considerada la novela fundacional del boom latinoamericano. La historia de Horacio
                  Oliveira en París y Buenos Aires es también un experimento sobre la lectura misma:
                  el libro puede leerse en dos órdenes distintos, cada uno con sentido propio.
                </p>
              </div>
              <div className="bg-white rounded-xl p-6 border border-cream-dark">
                <h3 className="font-semibold text-ink mb-2">¿Qué edición buscar?</h3>
                <p className="text-sm text-ink-muted leading-relaxed">
                  Para primera lectura, cualquier edición moderna de Alfaguara o Punto de Lectura funciona perfectamente —
                  son claras, con buena tipografía. Si quieres coleccionar, las ediciones de Sudamericana de los años 70
                  son las más valoradas en el mercado latinoamericano. El contenido del texto es idéntico en todas.
                </p>
              </div>
            </div>
          </section>

          <section className="mb-16 bg-ink text-cream rounded-2xl p-8 md:p-10">
            <h2 className="font-display text-2xl font-bold mb-3">¿Tienes Rayuela y ya no la leerás?</h2>
            <p className="text-cream/80 text-sm leading-relaxed max-w-xl mb-6">
              Hay demanda activa. Publicar es gratis y la comisión es solo 8% cuando se vende.
            </p>
            <Link href="/publish" className="inline-flex items-center px-6 py-3 bg-brand-500 text-white text-sm font-semibold rounded-xl hover:bg-brand-600 transition-colors">
              Publicar mi Rayuela →
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
