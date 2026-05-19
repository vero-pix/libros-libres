import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import ListingCard from "@/components/listings/ListingCard";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import { sortListingsForDisplay } from "@/lib/sortListings";
import type { ListingWithBook } from "@/types";

export const metadata: Metadata = {
  title: "Libros usados en Santiago | Retiro en mano | tuslibros.cl",
  description:
    "Encuentra miles de libros usados en Santiago. Retira en Providencia, Ñuñoa, Santiago Centro y otras comunas. Sin costos de despacho. Compra segura.",
  alternates: { canonical: "https://tuslibros.cl/libros-usados-santiago" },
  keywords: [
    "libros usados Santiago",
    "comprar libros usados RM",
    "libros usados Providencia",
    "libros usados Ñuñoa",
    "librería de viejo santiago",
    "libros usados retiro en mano",
  ],
  openGraph: {
    title: "Libros usados en Santiago — tuslibros.cl",
    description:
      "Explora el catálogo de libros usados más grande de Santiago. Retira en mano y ahórrate el envío.",
    url: "https://tuslibros.cl/libros-usados-santiago",
    siteName: "tuslibros.cl",
    locale: "es_CL",
    type: "website",
  },
};

const faqs = [
  {
    q: "¿Puedo retirar el libro el mismo día en Santiago?",
    a: "Sí. Gran parte de nuestros vendedores en la Región Metropolitana ofrecen la opción de 'Retiro en persona'. Si el vendedor acepta, pueden coordinar la entrega directa en alguna estación de Metro (como Baquedano, Los Leones o Plaza Egaña) o en el domicilio del vendedor el mismo día de la compra.",
  },
  {
    q: "¿Cómo encuentro libros que estén cerca de mí?",
    a: "En nuestra página principal tienes la vista de Mapa. Si le das permiso de ubicación, te mostrará inmediatamente los libros que están en tu misma comuna, listos para ser retirados sin pagar envío.",
  },
  {
    q: "¿El pago se le hace al vendedor al momento de la entrega?",
    a: "No. Para proteger tu dinero, todas las transacciones se realizan previamente a través de MercadoPago en nuestra plataforma. El dinero queda retenido y solo se libera al vendedor cuando tú confirmas que recibiste el libro en tus manos y está en buen estado.",
  },
  {
    q: "Vivo en otra comuna de la RM pero no puedo ir a buscarlo, ¿qué hago?",
    a: "No te preocupes. Si prefieres no moverte de tu casa, al momento de pagar puedes seleccionar la opción de envío. Trabajamos con courier (Starken, Blue Express, 99 Minutos) que entregan dentro de Santiago usualmente al día hábil siguiente.",
  },
  {
    q: "¿En qué comunas de Santiago hay más libros disponibles?",
    a: "Nuestro catálogo se concentra fuertemente en Providencia, Ñuñoa, Santiago Centro, Las Condes y La Florida, pero tenemos vendedores registrados en casi toda la Región Metropolitana.",
  },
];

export default async function LibrosUsadosSantiagoPage() {
  const supabase = await createClient();

  // Fetch listings where the seller is in Santiago (using ilike)
  const { data: featuredRaw } = await supabase
    .from("listings")
    .select(`*, book:books(*), seller:users!inner(id, full_name, avatar_url, username, city)`)
    .eq("status", "active")
    .ilike("seller.city", "%Santiago%")
    .order("created_at", { ascending: false })
    .limit(16);

  const featured = sortListingsForDisplay((featuredRaw as unknown as ListingWithBook[]) ?? []).slice(0, 12);

  // We could get an exact count, but count with ilike on joined tables might be slow.
  // So we'll use a fast estimate or omit the exact number if too complex.
  const { count: totalActive } = await supabase
    .from("listings")
    .select("id, seller:users!inner(id, city)", { count: "exact", head: true })
    .eq("status", "active")
    .ilike("seller.city", "%Santiago%");

  return (
    <>
      <div className="min-h-screen bg-cream">
        <main className="max-w-6xl mx-auto px-6 py-10">
          <Breadcrumbs
            items={[
              { label: "Inicio", href: "/" },
              { label: "Libros usados en Santiago" },
            ]}
          />

          {/* Hero */}
          <section className="mt-8 mb-16 max-w-3xl">
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-ink leading-[1.05] tracking-tight">
              Libros usados en Santiago.<br />
              <span className="italic text-brand-600">Retira hoy, lee esta noche.</span>
            </h1>
            <p className="mt-6 text-lg text-ink-muted leading-relaxed">
              Sabemos que a veces no quieres esperar el despacho. Santiago está lleno de
              libreros independientes, universitarios y lectores que están vendiendo libros a pocas
              cuadras de tu casa o trabajo. En <strong className="text-ink">tuslibros.cl</strong> puedes buscar libros en tu comuna, coordinar retiro en estaciones de metro (Providencia, Ñuñoa, Santiago Centro) y ahorrarte el costo de envío.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/?view=map"
                className="inline-flex items-center px-6 py-3 bg-brand-500 text-white text-sm font-semibold rounded-md hover:bg-brand-600 transition-colors shadow"
              >
                Buscar en el mapa de Santiago
              </Link>
            </div>
          </section>

          {/* Featured in Santiago */}
          {featured.length > 0 && (
            <section className="mb-16">
              <div className="flex justify-between items-end mb-6">
                <h2 className="font-display text-3xl font-bold text-ink">
                  Algunos libros disponibles ahora en RM
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

          {/* Beneficios Locales */}
          <section className="mb-16">
            <div className="bg-white rounded-2xl p-8 md:p-12 border border-cream-dark">
              <h2 className="font-display text-3xl font-bold text-ink mb-8">
                Las ventajas de comprar libros localmente
              </h2>
              <div className="grid md:grid-cols-3 gap-8">
                <div>
                  <div className="w-10 h-10 bg-brand-100 text-brand-600 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="font-display text-lg font-bold text-ink mb-2">
                    Inmediatez
                  </h3>
                  <p className="text-sm text-ink-muted leading-relaxed">
                    Si compras un libro en Providencia y trabajas cerca, puedes tenerlo en tus manos esa misma tarde. Sin tiempos de tránsito de couriers.
                  </p>
                </div>
                <div>
                  <div className="w-10 h-10 bg-brand-100 text-brand-600 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="font-display text-lg font-bold text-ink mb-2">
                    Cero costo de envío
                  </h3>
                  <p className="text-sm text-ink-muted leading-relaxed">
                    Un envío dentro de Santiago cuesta entre $3.000 y $4.500. Al retirar en persona, te ahorras ese monto por completo.
                  </p>
                </div>
                <div>
                  <div className="w-10 h-10 bg-brand-100 text-brand-600 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <h3 className="font-display text-lg font-bold text-ink mb-2">
                    Seguridad total
                  </h3>
                  <p className="text-sm text-ink-muted leading-relaxed">
                    Pagos electrónicos a través de MercadoPago. El vendedor no recibe el dinero hasta que tú tienes el libro y confirmas que está correcto.
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

      {/* Schema.org FAQPage para rich snippets en Google */}
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
              { "@type": "ListItem", position: 2, name: "Libros usados en Santiago", item: "https://tuslibros.cl/libros-usados-santiago" },
            ],
          }),
        }}
      />
    </>
  );
}
