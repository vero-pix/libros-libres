import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import ListingCard from "@/components/listings/ListingCard";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import { sortListingsForDisplay } from "@/lib/sortListings";
import type { ListingWithBook } from "@/types";

export const metadata: Metadata = {
  title: "Comprar libros usados en Chile — baratos, raros y cerca de ti | tuslibros.cl",
  description:
    "Compra libros usados en Chile: clásicos, rarezas y primeras ediciones desde $3.000, hasta 60% bajo el precio nuevo. Pago protegido con MercadoPago, retiro en mano o despacho por courier a todo Chile.",
  alternates: { canonical: "https://tuslibros.cl/comprar-libros-usados" },
  keywords: [
    "comprar libros usados",
    "comprar libros usados Chile",
    "libros usados baratos",
    "libros de segunda mano Chile",
    "libros usados online Chile",
    "donde comprar libros usados",
    "libros raros Chile",
    "primeras ediciones Chile",
  ],
  openGraph: {
    title: "Comprar libros usados en Chile — tuslibros.cl",
    description:
      "El libro que buscas probablemente ya lo leyó alguien cerca de ti. Cómpralo usado: más barato, muchas veces agotado en librerías nuevas, y con pago protegido.",
    url: "https://tuslibros.cl/comprar-libros-usados",
    siteName: "tuslibros.cl",
    locale: "es_CL",
    type: "website",
  },
};

const faqs = [
  {
    q: "¿Dónde puedo comprar libros usados en Chile por internet?",
    a: "En tuslibros.cl. Es un marketplace chileno donde personas y librerías de viejo publican sus libros usados. Buscas por título, autor o género, pagas protegido con MercadoPago y eliges retiro en mano o despacho por courier a todo Chile.",
  },
  {
    q: "¿Cuánto más barato sale comprar usado?",
    a: "Depende del libro, pero lo normal es entre 30% y 60% bajo el precio nuevo. En clásicos, libros agotados y ediciones que ya no se imprimen, la diferencia es todavía mayor: a veces el libro nuevo simplemente no existe. En cada ficha te mostramos el precio de referencia en Buscalibre y MercadoLibre para que compares sin salir del sitio.",
  },
  {
    q: "¿Cómo sé en qué estado está el libro?",
    a: "Cada publicación tiene fotos reales del ejemplar, la condición declarada por el vendedor (como nuevo, muy bueno, bueno, aceptable) y sus notas. No son fotos de catálogo: es el libro que vas a recibir.",
  },
  {
    q: "¿El pago es seguro?",
    a: "Sí. Pagas con MercadoPago y tu plata queda protegida: el vendedor recibe su pago recién cuando confirmas que recibiste el libro como esperabas. Si algo sale mal, MercadoPago media la devolución.",
  },
  {
    q: "¿Puedo retirar el libro en persona en vez de pagar despacho?",
    a: "Sí, y es gratis. El mapa te muestra los libros más cercanos a ti. Si el vendedor ofrece retiro en mano, coordinan la entrega directa por WhatsApp y te ahorras el courier.",
  },
  {
    q: "¿Llega a regiones?",
    a: "A todo Chile, vía Starken, Chilexpress, Blue Express y 99 Minutos. El costo se calcula automáticamente en el checkout según peso y distancia. Para un libro estándar a regiones suele ir entre $3.000 y $5.500.",
  },
  {
    q: "¿Encuentro libros raros o agotados?",
    a: "Es lo que mejor hacemos. Primeras ediciones, autores chilenos descatalogados, ediciones cubanas históricas, libros que Buscalibre ya no tiene. Lo que circula entre lectores chilenos no está en las cadenas — está acá.",
  },
  {
    q: "¿Y si no encuentro el libro que busco?",
    a: "Puedes dejar tu pedido en la sección Se busca: publicas el título que andas buscando y, cuando alguien lo sube, te avisamos por correo. Es la economía al revés — tú pides, los vendedores responden.",
  },
];

export default async function ComprarLibrosUsadosPage() {
  const supabase = await createClient();

  // Libros destacados reales para el grid
  const { data: featuredRaw } = await supabase
    .from("listings")
    .select(`*, book:books(*), seller:users(id, full_name, avatar_url, username)`)
    .eq("status", "active")
    .order("featured_rank", { ascending: true, nullsFirst: false })
    .order("deprioritized", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(12);

  const featured = sortListingsForDisplay((featuredRaw as unknown as ListingWithBook[]) ?? []).slice(0, 8);

  const { count: totalActive } = await supabase
    .from("listings")
    .select("id", { count: "exact", head: true })
    .eq("status", "active");

  return (
    <>
      <div className="min-h-screen bg-cream">
        <main className="max-w-6xl mx-auto px-6 py-10">
          <Breadcrumbs
            items={[
              { label: "Inicio", href: "/" },
              { label: "Comprar libros usados" },
            ]}
          />

          {/* Hero */}
          <section className="mt-8 mb-16 max-w-3xl">
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-ink leading-[1.05] tracking-tight">
              Comprar libros usados en Chile —<br />
              <span className="italic text-brand-600">baratos, raros y cerca de ti.</span>
            </h1>
            <p className="mt-6 text-lg text-ink-muted leading-relaxed">
              El libro que andas buscando probablemente ya lo leyó alguien cerca de ti.
              En <strong className="text-ink">tuslibros.cl</strong> lo compras usado: entre
              30% y 60% más barato que nuevo, muchas veces agotado en las librerías de
              siempre, y con el pago protegido por MercadoPago. Retiras en mano o pides
              despacho a todo Chile. Sin registrarte para mirar.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/search"
                className="inline-flex items-center px-6 py-3 bg-brand-500 text-white text-sm font-semibold rounded-md hover:bg-brand-600 transition-colors shadow"
              >
                Ver {totalActive ? `${totalActive} libros disponibles` : "catálogo"}
              </Link>
              <Link
                href="/mapa"
                className="inline-flex items-center px-6 py-3 bg-white border border-ink/20 text-ink text-sm font-semibold rounded-md hover:border-brand-500 hover:text-brand-600 transition-colors"
              >
                Ver libros en el mapa
              </Link>
            </div>
          </section>

          {/* Por qué comprar usado acá */}
          <section className="mb-16">
            <h2 className="font-display text-3xl font-bold text-ink mb-6">
              Por qué comprar el usado y no el nuevo.
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl p-6 border border-cream-dark">
                <h3 className="font-display text-lg font-bold text-ink mb-2">
                  Mucho más barato
                </h3>
                <p className="text-sm text-ink-muted leading-relaxed">
                  Desde $3.000. En cada ficha te mostramos el precio en Buscalibre y
                  MercadoLibre para que veas la diferencia con tus propios ojos. Sin
                  trucos: comparas y decides.
                </p>
              </div>
              <div className="bg-white rounded-xl p-6 border border-cream-dark">
                <h3 className="font-display text-lg font-bold text-ink mb-2">
                  Encuentras lo agotado
                </h3>
                <p className="text-sm text-ink-muted leading-relaxed">
                  Primeras ediciones, autores chilenos descatalogados, rarezas que las
                  cadenas ya no tienen. Lo que circula entre lectores chilenos vive acá,
                  no en una bodega de Buscalibre.
                </p>
              </div>
              <div className="bg-white rounded-xl p-6 border border-cream-dark">
                <h3 className="font-display text-lg font-bold text-ink mb-2">
                  Cerca y seguro
                </h3>
                <p className="text-sm text-ink-muted leading-relaxed">
                  El mapa te muestra el libro más cercano. Retiras en mano gratis o pides
                  courier. Pagas con MercadoPago y tu plata queda protegida hasta que el
                  libro llega a tus manos.
                </p>
              </div>
            </div>
          </section>

          {/* Libros destacados */}
          {featured.length > 0 && (
            <section className="mb-16">
              <h2 className="font-display text-3xl font-bold text-ink mb-6">
                Libros usados disponibles hoy
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {featured.map((l) => (
                  <ListingCard key={l.id} listing={l} />
                ))}
              </div>
              <div className="mt-6 text-center">
                <Link
                  href="/search"
                  className="inline-flex items-center text-brand-600 font-semibold hover:text-brand-700 transition-colors"
                >
                  Ver todos los libros →
                </Link>
              </div>
            </section>
          )}

          {/* Cómo comprar */}
          <section className="mb-16">
            <h2 className="font-display text-3xl font-bold text-ink mb-8">
              Cómo comprar un libro usado, paso a paso
            </h2>
            <div className="grid md:grid-cols-4 gap-6">
              {[
                { n: "1", title: "Búscalo", desc: "Por título, autor, género o cercanía en el mapa. Mirar no requiere cuenta." },
                { n: "2", title: "Compara el precio", desc: "Cada ficha muestra el precio nuevo en Buscalibre y MercadoLibre. Decides con datos." },
                { n: "3", title: "Paga protegido", desc: "Con MercadoPago. Tu plata queda retenida hasta que confirmes que recibiste el libro." },
                { n: "4", title: "Retira o recibe", desc: "Retiro en mano gratis, o despacho por courier a todo Chile. Tú eliges." },
              ].map((s) => (
                <div key={s.n}>
                  <div className="text-3xl font-display font-bold text-brand-500 mb-2">{s.n}</div>
                  <h3 className="font-display font-bold text-ink mb-1">{s.title}</h3>
                  <p className="text-sm text-ink-muted">{s.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Se busca */}
          <section className="mb-16 bg-ink text-cream rounded-2xl p-8 md:p-12">
            <h2 className="font-display text-3xl font-bold mb-4">
              ¿No está el que buscas? Pídelo.
            </h2>
            <p className="text-cream/80 max-w-2xl leading-relaxed mb-6">
              No todo está publicado todavía. En la sección <strong className="text-cream">Se busca</strong> dejas
              el título que andas persiguiendo y, cuando alguien lo sube, te avisamos por
              correo. Es la economía al revés: tú pides, los vendedores responden. Así
              hemos juntado lectores con libros que llevaban años buscando.
            </p>
            <Link
              href="/solicitudes"
              className="inline-flex items-center px-6 py-3 bg-brand-500 text-white text-sm font-semibold rounded-md hover:bg-brand-600 transition-colors shadow"
            >
              Dejar mi pedido →
            </Link>
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
              { "@type": "ListItem", position: 2, name: "Comprar libros usados", item: "https://tuslibros.cl/comprar-libros-usados" },
            ],
          }),
        }}
      />
    </>
  );
}
