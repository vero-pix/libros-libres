import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import ListingCard from "@/components/listings/ListingCard";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import { sortListingsForDisplay } from "@/lib/sortListings";
import type { ListingWithBook } from "@/types";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Álgebra de Baldor — Libro Usado en Chile | tuslibros.cl",
  description:
    "Compra Álgebra de Baldor usado en Chile. Ejemplares disponibles desde $3.000 con envío a todo el país o retiro en mano. Ediciones Patria, CECSA y más. Pago seguro con MercadoPago.",
  alternates: { canonical: "https://tuslibros.cl/algebra-de-baldor" },
  keywords: [
    "algebra de baldor",
    "libro baldor",
    "baldor matematicas chile",
    "comprar algebra de baldor usado",
    "baldor libro usado",
    "algebra de baldor precio chile",
    "libro de matematicas baldor",
  ],
  openGraph: {
    title: "Álgebra de Baldor — Libro Usado en Chile | tuslibros.cl",
    description:
      "Compra Álgebra de Baldor usado en Chile. Envío a todo el país o retiro en mano. Pago seguro.",
    url: "https://tuslibros.cl/algebra-de-baldor",
    siteName: "tuslibros.cl",
    locale: "es_CL",
    type: "website",
  },
};

const faqs = [
  {
    q: "¿Hay ejemplares del Álgebra de Baldor disponibles en tuslibros.cl?",
    a: "Sí. Periódicamente hay ejemplares usados del Álgebra de Baldor publicados por vendedores en todo Chile. El inventario varía; si no encuentras uno disponible hoy, puedes crear una solicitud y te avisamos cuando aparezca.",
  },
  {
    q: "¿Qué edición del Álgebra de Baldor se consigue usada?",
    a: "Las ediciones más comunes en el mercado de segunda mano son la de Editorial Patria y la edición CECSA (Compañía Editorial Continental). Ambas contienen los mismos 6,000 ejercicios del texto original de Aurelio Baldor. El contenido matemático es idéntico entre ediciones; la diferencia es la maquetación y el color de la portada.",
  },
  {
    q: "¿Está completo el libro? ¿Tiene respuestas?",
    a: "Depende de cada ejemplar. El libro original de Baldor no incluye solucionario — los ejercicios no tienen respuestas impresas. Lo que verás en las publicaciones es el estado de conservación declarado por el vendedor (como nuevo, muy bueno, bueno, aceptable) y fotos reales del ejemplar.",
  },
  {
    q: "¿Puedo comprar el Álgebra de Baldor y que me llegue a regiones?",
    a: "Sí. El despacho funciona a todo Chile vía Starken, Chilexpress, Blue Express y 99 Minutos. El vendedor imprime la etiqueta automáticamente cuando recibes el pago. Para un libro del tamaño del Baldor, el costo de envío a Santiago suele estar entre $2.500 y $4.500; a regiones un poco más.",
  },
  {
    q: "¿Cuánto cuesta el Álgebra de Baldor usado en Chile?",
    a: "En tuslibros.cl, los ejemplares usados del Álgebra de Baldor se publican típicamente entre $5.000 y $18.000 dependiendo del estado de conservación y la edición. El libro nuevo en librerías chilenas ronda los $25.000–$35.000, por lo que el ahorro es considerable.",
  },
  {
    q: "¿Cómo sé que el libro llegará en buen estado?",
    a: "Cada publicación tiene fotos reales, descripción del vendedor y condición declarada. El pago con MercadoPago queda retenido hasta que confirmas que recibiste el libro como esperabas. Si hay un problema, tienes 7 días para reclamar.",
  },
  {
    q: "Tengo un Álgebra de Baldor en buen estado. ¿Puedo venderlo aquí?",
    a: "Sí, y hay demanda activa. Publicar es gratis — subes una foto de la portada o escaneas el ISBN, fijas el precio y quedas visible para compradores en todo Chile. La comisión es 8% solo cuando el libro se vende con pago por MercadoPago.",
  },
];

export default async function AlgebraDeBaldorPage() {
  const supabase = await createClient();

  // Buscar listings de Álgebra de Baldor por título
  const { data: baldorRaw } = await supabase
    .from("listings")
    .select(`*, book:books(*), seller:users(id, full_name, avatar_url, username, mercadopago_user_id)`)
    .eq("status", "active")
    .ilike("book.title", "%baldor%")
    .order("created_at", { ascending: false })
    .limit(20);

  const baldorListings = sortListingsForDisplay(
    (baldorRaw as unknown as ListingWithBook[]) ?? []
  ).slice(0, 8);

  // Schema del libro (Book + Offer agregado)
  const bookJsonLd = {
    "@context": "https://schema.org",
    "@type": "Book",
    name: "Álgebra de Baldor",
    alternateName: ["Baldor", "El Baldor", "Libro de Baldor"],
    author: {
      "@type": "Person",
      name: "Aurelio Baldor",
    },
    description:
      "Álgebra de Baldor es el texto de matemáticas más utilizado en América Latina para la enseñanza del álgebra. Contiene más de 6.000 ejercicios organizados por nivel de dificultad. Publicado originalmente en 1941 por el matemático cubano Aurelio Baldor.",
    inLanguage: "es",
    bookFormat: "https://schema.org/Paperback",
    genre: "Matemáticas",
    audience: {
      "@type": "Audience",
      audienceType: "Estudiantes de secundaria y universidad",
    },
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: "https://tuslibros.cl" },
      { "@type": "ListItem", position: 2, name: "Álgebra de Baldor usado", item: "https://tuslibros.cl/algebra-de-baldor" },
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
          <Breadcrumbs
            items={[
              { label: "Inicio", href: "/" },
              { label: "Álgebra de Baldor" },
            ]}
          />

          {/* Hero */}
          <section className="mt-8 mb-12 max-w-3xl">
            <h1 className="font-display text-4xl sm:text-5xl font-bold text-ink leading-[1.05] tracking-tight">
              Álgebra de Baldor —{" "}
              <span className="italic text-brand-600">usado, en Chile.</span>
            </h1>
            <p className="mt-5 text-lg text-ink-muted leading-relaxed">
              El texto de matemáticas más buscado de América Latina, en segunda mano.
              Más de 6.000 ejercicios. Ideal para la PSU/PAES, Liceo, CFT o Universidad.
              Envío a todo Chile o retiro en mano con el vendedor.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/search?q=baldor"
                className="inline-flex items-center px-6 py-3 bg-brand-500 text-white text-sm font-semibold rounded-xl hover:bg-brand-600 transition-colors shadow-sm"
              >
                Ver ejemplares disponibles
              </Link>
              <Link
                href="/solicitudes"
                className="inline-flex items-center px-6 py-3 bg-white border border-ink/20 text-ink text-sm font-semibold rounded-xl hover:border-brand-500 hover:text-brand-600 transition-colors"
              >
                Avisar cuando haya uno →
              </Link>
            </div>
          </section>

          {/* Grid de listings */}
          {baldorListings.length > 0 ? (
            <section className="mb-16">
              <h2 className="font-display text-2xl font-bold text-ink mb-5">
                Ejemplares disponibles ahora
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {baldorListings.map((l) => (
                  <ListingCard key={l.id} listing={l} />
                ))}
              </div>
              <div className="mt-6">
                <Link
                  href="/search?q=baldor"
                  className="text-sm text-brand-600 font-semibold hover:text-brand-700 transition-colors"
                >
                  Ver todos los resultados para &quot;baldor&quot; →
                </Link>
              </div>
            </section>
          ) : (
            <section className="mb-16 bg-white border border-cream-dark rounded-2xl p-8 text-center">
              <p className="font-display text-xl text-ink mb-2">No hay ejemplares disponibles hoy</p>
              <p className="text-sm text-ink-muted mb-6">
                Crea una solicitud y te avisamos cuando un vendedor publique uno.
              </p>
              <Link
                href="/solicitudes"
                className="inline-flex items-center px-5 py-2.5 bg-brand-500 text-white text-sm font-semibold rounded-lg hover:bg-brand-600 transition-colors"
              >
                Solicitar Álgebra de Baldor
              </Link>
            </section>
          )}

          {/* Sobre el libro */}
          <section className="mb-16">
            <h2 className="font-display text-2xl font-bold text-ink mb-4">
              Sobre el Álgebra de Baldor
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl p-6 border border-cream-dark">
                <h3 className="font-semibold text-ink mb-2">El libro</h3>
                <p className="text-sm text-ink-muted leading-relaxed">
                  Escrito por el matemático cubano Aurelio Baldor y publicado por primera vez en 1941,
                  el <em>Álgebra</em> es el texto de matemáticas con mayor penetración en América Latina.
                  Contiene más de 6.000 ejercicios organizados desde lo básico hasta álgebra avanzada,
                  con una famosa portada del matemático árabe Al-Juarismí que lo hace inmediatamente
                  reconocible en cualquier estantería.
                </p>
              </div>
              <div className="bg-white rounded-xl p-6 border border-cream-dark">
                <h3 className="font-semibold text-ink mb-2">¿Qué edición comprar?</h3>
                <p className="text-sm text-ink-muted leading-relaxed">
                  Las ediciones más comunes en el mercado usado chileno son la de <strong>Editorial Patria</strong> y
                  la de <strong>CECSA</strong> (Compañía Editorial Continental). El contenido matemático es
                  idéntico en ambas. La diferencia es menor: maquetación, tipografía y color. Si el precio
                  es similar, elige el ejemplar en mejor estado de conservación.
                </p>
              </div>
              <div className="bg-white rounded-xl p-6 border border-cream-dark">
                <h3 className="font-semibold text-ink mb-2">¿Para qué nivel?</h3>
                <p className="text-sm text-ink-muted leading-relaxed">
                  El Álgebra de Baldor es útil desde enseñanza media hasta los primeros años de carrera
                  en ingeniería, ciencias y carreras técnicas. En Chile es especialmente popular para preparar
                  la <strong>PAES (ex-PSU)</strong> y como texto de apoyo en primero y segundo de ingeniería.
                </p>
              </div>
              <div className="bg-white rounded-xl p-6 border border-cream-dark">
                <h3 className="font-semibold text-ink mb-2">¿Vale la pena comprarlo usado?</h3>
                <p className="text-sm text-ink-muted leading-relaxed">
                  Sí. El texto de Baldor no ha cambiado sustancialmente entre ediciones — los ejercicios
                  son los mismos. Un ejemplar en estado &quot;bueno&quot; o &quot;muy bueno&quot; a $6.000–$12.000 cumple
                  exactamente la misma función que uno nuevo a $30.000. El ahorro es real.
                </p>
              </div>
            </div>
          </section>

          {/* CTA vender */}
          <section className="mb-16 bg-ink text-cream rounded-2xl p-8 md:p-10">
            <h2 className="font-display text-2xl font-bold mb-3">
              ¿Tienes un Álgebra de Baldor que ya no usas?
            </h2>
            <p className="text-cream/80 text-sm leading-relaxed max-w-xl mb-6">
              Hay demanda activa. Publicar es gratis — subes una foto, escaneas el ISBN y quedas
              visible para compradores en todo Chile. El pago llega directo a tu cuenta cuando se vende.
            </p>
            <Link
              href="/publish"
              className="inline-flex items-center px-6 py-3 bg-brand-500 text-white text-sm font-semibold rounded-xl hover:bg-brand-600 transition-colors"
            >
              Publicar mi Baldor →
            </Link>
          </section>

          {/* FAQ */}
          <section className="mb-12">
            <h2 className="font-display text-2xl font-bold text-ink mb-6">
              Preguntas frecuentes
            </h2>
            <div className="space-y-3">
              {faqs.map((f, i) => (
                <details
                  key={i}
                  className="group bg-white border border-cream-dark/50 rounded-xl p-5 cursor-pointer"
                >
                  <summary className="font-semibold text-ink text-sm list-none flex items-center justify-between gap-4">
                    {f.q}
                    <span className="text-brand-500 text-lg group-open:rotate-45 transition-transform duration-200 shrink-0">
                      +
                    </span>
                  </summary>
                  <p className="mt-3 text-sm text-ink-muted leading-relaxed">{f.a}</p>
                </details>
              ))}
            </div>
          </section>

          {/* Internal links */}
          <section className="mb-12 border-t border-cream-dark pt-10">
            <p className="text-xs text-ink-muted uppercase tracking-widest font-semibold mb-4">
              También puede interesarte
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/libros-usados-chile"
                className="text-sm text-brand-600 font-medium hover:text-brand-700 underline underline-offset-2 transition-colors"
              >
                Libros usados en Chile
              </Link>
              <span className="text-ink-muted">·</span>
              <Link
                href="/search?q=matematicas"
                className="text-sm text-brand-600 font-medium hover:text-brand-700 underline underline-offset-2 transition-colors"
              >
                Libros de matemáticas usados
              </Link>
              <span className="text-ink-muted">·</span>
              <Link
                href="/search?category=universitario"
                className="text-sm text-brand-600 font-medium hover:text-brand-700 underline underline-offset-2 transition-colors"
              >
                Libros universitarios
              </Link>
              <span className="text-ink-muted">·</span>
              <Link
                href="/vender-libros-usados"
                className="text-sm text-brand-600 font-medium hover:text-brand-700 underline underline-offset-2 transition-colors"
              >
                Vender libros usados
              </Link>
            </div>
          </section>
        </main>
      </div>
    </>
  );
}
