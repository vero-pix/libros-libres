import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import ListingCard from "@/components/listings/ListingCard";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import { sortListingsForDisplay } from "@/lib/sortListings";
import type { ListingWithBook } from "@/types";

export const metadata: Metadata = {
  title: "Libros usados en Providencia | Retiro en Manuel Montt y Baquedano",
  description:
    "El mayor catálogo hiperlocal de libros usados en Providencia. Retira en persona cerca de Pedro de Valdivia, Manuel Montt, Baquedano o Tobalaba. Sin costo de despacho.",
  alternates: { canonical: "https://tuslibros.cl/libros-usados-providencia" },
  keywords: [
    "libros usados Providencia",
    "comprar libros Providencia",
    "librería Providencia",
    "libros usados Manuel Montt",
    "libros usados Baquedano",
    "libros usados Pedro de Valdivia",
  ],
  openGraph: {
    title: "Libros usados en Providencia — tuslibros.cl",
    description:
      "Gran parte de nuestro catálogo vive en Providencia. Compra a vecinos y retira en tu estación de metro favorita sin pagar envío.",
    url: "https://tuslibros.cl/libros-usados-providencia",
    siteName: "tuslibros.cl",
    locale: "es_CL",
    type: "website",
  },
};

const faqs = [
  {
    q: "¿Dónde se coordinan los retiros en Providencia?",
    a: "La mayoría de nuestros vendedores en la comuna prefieren coordinar en estaciones de la Línea 1 (Baquedano, Manuel Montt, Pedro de Valdivia, Los Leones, Tobalaba) o en cafés de Barrio Italia y Pocuro. Al comprar, te pondrás de acuerdo directamente con el vendedor.",
  },
  {
    q: "¿Cómo encuentro libros que estén en Providencia?",
    a: "Estás en el lugar correcto. Los libros que ves en esta página pertenecen a vendedores registrados en la comuna. También puedes usar el Mapa en la página principal para buscar títulos a pocas cuadras de tu ubicación actual.",
  },
  {
    q: "¿Por qué hay tantos libros concentrados aquí?",
    a: "Providencia es el epicentro de tuslibros.cl. Las oficinas centrales (y la fundadora) están en esta comuna, lo que hizo que la primera red de vendedores activos se construyera fuertemente en este sector.",
  },
  {
    q: "¿Tengo que pagar en efectivo al momento de juntarnos?",
    a: "No. Para proteger tu dinero y evitar problemas, todas las transacciones se realizan previamente a través de MercadoPago en nuestra plataforma. El dinero queda retenido y solo se le transfiere al vendedor cuando tú confirmas que recibiste el libro en tus manos y está impecable.",
  },
  {
    q: "Vivo en Providencia pero no tengo tiempo para juntarme, ¿qué hago?",
    a: "Puedes seleccionar la opción de envío por courier al momento de pagar. El vendedor dejará el paquete en Starken o Chilexpress y llegará a tu casa o trabajo al día hábil siguiente por un costo reducido.",
  },
];

export default async function LibrosUsadosProvidenciaPage() {
  const supabase = await createClient();

  // Fetch listings where the seller is in Providencia
  const { data: featuredRaw } = await supabase
    .from("listings")
    .select(`*, book:books(*), seller:users!inner(id, full_name, avatar_url, username, city)`)
    .eq("status", "active")
    .ilike("seller.city", "%Providencia%")
    .order("created_at", { ascending: false })
    .limit(16);

  const featured = sortListingsForDisplay((featuredRaw as unknown as ListingWithBook[]) ?? []).slice(0, 12);

  return (
    <>
      <div className="min-h-screen bg-cream">
        <main className="max-w-6xl mx-auto px-6 py-10">
          <Breadcrumbs
            items={[
              { label: "Inicio", href: "/" },
              { label: "Libros usados en Providencia" },
            ]}
          />

          {/* Hero */}
          <section className="mt-8 mb-16 max-w-3xl">
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-ink leading-[1.05] tracking-tight">
              Libros usados en Providencia.<br />
              <span className="italic text-brand-600">A pasos de tu casa o trabajo.</span>
            </h1>
            <p className="mt-6 text-lg text-ink-muted leading-relaxed">
              Gran parte del catálogo de <strong className="text-ink">tuslibros.cl</strong> vive y respira
              en esta comuna. Ya no necesitas pagar despacho si vives cerca. Explora libros
              vendidos por tus vecinos y coordina retiros fáciles en Manuel Montt, Baquedano, Pedro de Valdivia o Los Leones.
              Pago protegido y entregas seguras.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/search"
                className="inline-flex items-center px-6 py-3 bg-brand-500 text-white text-sm font-semibold rounded-md hover:bg-brand-600 transition-colors shadow"
              >
                Buscar un libro específico
              </Link>
            </div>
          </section>

          {/* Featured in Providencia */}
          {featured.length > 0 && (
            <section className="mb-16">
              <div className="flex justify-between items-end mb-6">
                <h2 className="font-display text-3xl font-bold text-ink">
                  Recién publicados en Providencia
                </h2>
                <Link
                  href="/search"
                  className="hidden md:inline-flex items-center text-sm font-semibold text-brand-600 hover:text-brand-700 transition-colors"
                >
                  Ver todos los libros →
                </Link>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {featured.map((l) => (
                  <ListingCard key={l.id} listing={l} />
                ))}
              </div>
              <div className="mt-6 text-center md:hidden">
                <Link
                  href="/search"
                  className="inline-flex items-center text-brand-600 font-semibold hover:text-brand-700 transition-colors"
                >
                  Ver todos los libros →
                </Link>
              </div>
            </section>
          )}

          {/* Beneficios Locales - Reutilizado */}
          <section className="mb-16">
            <div className="bg-white rounded-2xl p-8 md:p-12 border border-cream-dark">
              <h2 className="font-display text-3xl font-bold text-ink mb-8">
                Por qué comprarle a tus vecinos
              </h2>
              <div className="grid md:grid-cols-3 gap-8">
                <div>
                  <div className="w-10 h-10 bg-brand-100 text-brand-600 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="font-display text-lg font-bold text-ink mb-2">
                    Inmediatez real
                  </h3>
                  <p className="text-sm text-ink-muted leading-relaxed">
                    Si el libro y tú están en la misma comuna, puedes coordinar la entrega en cuestión de horas a la salida de tu oficina o departamento.
                  </p>
                </div>
                <div>
                  <div className="w-10 h-10 bg-brand-100 text-brand-600 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="font-display text-lg font-bold text-ink mb-2">
                    Ahorro en despacho
                  </h3>
                  <p className="text-sm text-ink-muted leading-relaxed">
                    El despacho tradicional suma dinero al costo total del libro. Aquí, tu trayecto en Metro o a pie es el único transporte.
                  </p>
                </div>
                <div>
                  <div className="w-10 h-10 bg-brand-100 text-brand-600 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <h3 className="font-display text-lg font-bold text-ink mb-2">
                    100% Protegido
                  </h3>
                  <p className="text-sm text-ink-muted leading-relaxed">
                    Transacción vía MercadoPago. Entregas el código de seguridad al vendedor solo cuando tienes el ejemplar y confirmas su estado.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* FAQ */}
          <section className="mb-12">
            <h2 className="font-display text-3xl font-bold text-ink mb-8">
              Preguntas frecuentes
            </h2>
            <div className="space-y-4">
              {faqs.map((f, i) => (
                <details
                  key={i}
                  className="bg-white rounded-xl border border-cream-dark p-5 group"
                >
                  <summary className="font-semibold text-ink cursor-pointer list-none flex justify-between items-center">
                    {f.q}
                    <span className="text-brand-500 group-open:rotate-180 transition-transform">▾</span>
                  </summary>
                  <p className="mt-3 text-sm text-ink-muted leading-relaxed">{f.a}</p>
                </details>
              ))}
            </div>
          </section>
        </main>
      </div>

      {/* Schema.org FAQPage */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqs.map((f) => ({
              "@type": "Question",
              name: f.q,
              acceptedAnswer: {
                "@type": "Answer",
                text: f.a,
              },
            })),
          }),
        }}
      />

      {/* Schema.org BreadcrumbList */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Inicio", item: "https://tuslibros.cl" },
              { "@type": "ListItem", position: 2, name: "Libros usados en Providencia", item: "https://tuslibros.cl/libros-usados-providencia" },
            ],
          }),
        }}
      />
    </>
  );
}
