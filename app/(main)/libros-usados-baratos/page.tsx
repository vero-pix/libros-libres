import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import ListingCard from "@/components/listings/ListingCard";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import type { ListingWithBook } from "@/types";

export const metadata: Metadata = {
  title: "Comprar libros usados baratos en Chile — desde $1.000",
  description:
    "Compra libros usados baratos en Chile desde $1.000. Cientos de ofertas y libros de segunda mano hasta 60% bajo el precio nuevo. Pago protegido con MercadoPago, retiro en mano gratis o despacho a todo Chile.",
  alternates: { canonical: "https://tuslibros.cl/libros-usados-baratos" },
  keywords: [
    "comprar libros usados baratos",
    "comprar libros baratos Chile",
    "libros usados baratos",
    "libros baratos Chile",
    "ofertas de libros",
    "libros de segunda mano baratos",
    "libros economicos Chile",
    "comprar libros baratos online",
  ],
  openGraph: {
    title: "Comprar libros usados baratos en Chile — desde $1.000",
    description:
      "Cientos de libros usados baratos y en oferta, hasta 60% bajo el precio nuevo. Pago protegido y despacho a todo Chile.",
    url: "https://tuslibros.cl/libros-usados-baratos",
    siteName: "tuslibros.cl",
    locale: "es_CL",
    type: "website",
  },
};

const faqs = [
  {
    q: "¿Dónde comprar libros usados baratos en Chile?",
    a: "En tuslibros.cl. Es un marketplace chileno donde personas y librerías de viejo publican libros usados desde $1.000. Filtras por precio de menor a mayor, pagas protegido con MercadoPago y eliges retiro en mano gratis o despacho por courier a todo Chile.",
  },
  {
    q: "¿Cuán baratos pueden ser los libros usados?",
    a: "Tenemos libros desde $1.000 y cientos bajo los $5.000. Lo normal es pagar entre 30% y 60% menos que el libro nuevo, y en títulos agotados la diferencia es aún mayor. En cada ficha mostramos el precio de referencia en Buscalibre y MercadoLibre para que compares.",
  },
  {
    q: "¿Cómo encuentro los libros más baratos?",
    a: "En el buscador ordenas por precio de menor a mayor y aparecen primero los más económicos. También puedes filtrar por rango de precio y por cercanía en el mapa, para ahorrarte además el despacho retirando en mano.",
  },
  {
    q: "¿Un libro barato significa que está en mal estado?",
    a: "No necesariamente. Muchos libros baratos están en muy buen estado: simplemente su dueño quiere que circulen. Cada publicación tiene fotos reales del ejemplar y la condición declarada (como nuevo, muy bueno, bueno, aceptable), así sabes exactamente qué vas a recibir.",
  },
  {
    q: "¿El envío encarece mucho la compra?",
    a: "Puedes evitarlo retirando en mano gratis: el mapa te muestra los libros más cercanos. Si necesitas despacho, va por Starken, Chilexpress, Blue Express o 99 Minutos, y para un libro estándar a regiones suele costar entre $3.000 y $5.500.",
  },
  {
    q: "¿El pago es seguro aunque sea barato?",
    a: "Sí. Pagas con MercadoPago y tu plata queda protegida: el vendedor recibe su pago recién cuando confirmas que recibiste el libro como esperabas. Si algo sale mal, MercadoPago media la devolución.",
  },
];

export default async function LibrosUsadosBaratosPage() {
  const supabase = await createClient();

  // Los libros más baratos disponibles hoy (precio ascendente)
  const { data: baratosRaw } = await supabase
    .from("listings")
    .select(`*, book:books(*), seller:users(id, full_name, avatar_url, username)`)
    .eq("status", "active")
    .neq("deprioritized", true)
    .order("price", { ascending: true })
    .limit(12);

  const baratos = (baratosRaw as unknown as ListingWithBook[]) ?? [];

  const { count: bajo5k } = await supabase
    .from("listings")
    .select("id", { count: "exact", head: true })
    .eq("status", "active")
    .lte("price", 5000);

  const { count: enOferta } = await supabase
    .from("listings")
    .select("id", { count: "exact", head: true })
    .eq("status", "active")
    .not("original_price", "is", null);

  return (
    <>
      <div className="min-h-screen bg-cream">
        <main className="max-w-6xl mx-auto px-6 py-10">
          <Breadcrumbs
            items={[
              { label: "Inicio", href: "/" },
              { label: "Libros usados baratos" },
            ]}
          />

          {/* Hero */}
          <section className="mt-8 mb-16 max-w-3xl">
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-ink leading-[1.05] tracking-tight">
              Compra libros usados baratos en Chile —<br />
              <span className="italic text-brand-600">desde $1.000.</span>
            </h1>
            <p className="mt-6 text-lg text-ink-muted leading-relaxed">
              No tienes que gastar una fortuna para leer. En{" "}
              <strong className="text-ink">tuslibros.cl</strong> hay cientos de libros
              usados baratos —entre 30% y 60% bajo el precio nuevo— publicados por
              personas y librerías de viejo de todo Chile. Pagas protegido con
              MercadoPago, retiras en mano gratis o pides despacho. Sin registrarte para
              mirar.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/search?sort=price_asc"
                className="inline-flex items-center px-6 py-3 bg-brand-500 text-white text-sm font-semibold rounded-md hover:bg-brand-600 transition-colors shadow"
              >
                Ver los más baratos primero
              </Link>
              <Link
                href="/mapa"
                className="inline-flex items-center px-6 py-3 bg-white border border-ink/20 text-ink text-sm font-semibold rounded-md hover:border-brand-500 hover:text-brand-600 transition-colors"
              >
                Buscar cerca de mí
              </Link>
            </div>
            {(bajo5k || enOferta) && (
              <p className="mt-5 text-sm font-mono text-ink-muted">
                {bajo5k ? `${bajo5k} libros bajo $5.000` : ""}
                {bajo5k && enOferta ? " · " : ""}
                {enOferta ? `${enOferta} en oferta ahora` : ""}
              </p>
            )}
          </section>

          {/* Los más baratos hoy */}
          {baratos.length > 0 && (
            <section className="mb-16">
              <h2 className="font-display text-3xl font-bold text-ink mb-6">
                Los más baratos disponibles hoy
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {baratos.map((l) => (
                  <ListingCard key={l.id} listing={l} />
                ))}
              </div>
              <div className="mt-6 text-center">
                <Link
                  href="/search?sort=price_asc"
                  className="inline-flex items-center text-brand-600 font-semibold hover:text-brand-700 transition-colors"
                >
                  Ver todos los libros baratos →
                </Link>
              </div>
            </section>
          )}

          {/* Por qué tan barato */}
          <section className="mb-16">
            <h2 className="font-display text-3xl font-bold text-ink mb-6">
              ¿Por qué tan barato?
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl p-6 border border-cream-dark">
                <h3 className="font-display text-lg font-bold text-ink mb-2">
                  Lo vende quien lo leyó
                </h3>
                <p className="text-sm text-ink-muted leading-relaxed">
                  No hay bodega ni cadena que infle el precio. Es alguien cerca tuyo que
                  ya leyó el libro y prefiere que circule antes de que junte polvo.
                </p>
              </div>
              <div className="bg-white rounded-xl p-6 border border-cream-dark">
                <h3 className="font-display text-lg font-bold text-ink mb-2">
                  Comparas y decides
                </h3>
                <p className="text-sm text-ink-muted leading-relaxed">
                  Cada ficha te muestra el precio nuevo en Buscalibre y MercadoLibre. Ves
                  con tus propios ojos cuánto te ahorras. Sin trucos.
                </p>
              </div>
              <div className="bg-white rounded-xl p-6 border border-cream-dark">
                <h3 className="font-display text-lg font-bold text-ink mb-2">
                  Ahorras también en envío
                </h3>
                <p className="text-sm text-ink-muted leading-relaxed">
                  Si el vendedor está cerca, retiras en mano gratis y te ahorras el
                  courier. El mapa te muestra los libros baratos más cercanos a ti.
                </p>
              </div>
            </div>
          </section>

          {/* Se busca */}
          <section className="mb-16 bg-ink text-cream rounded-2xl p-8 md:p-12">
            <h2 className="font-display text-3xl font-bold mb-4">
              ¿Buscas un título puntual y barato? Pídelo.
            </h2>
            <p className="text-white/80 max-w-2xl leading-relaxed mb-6">
              En la sección <strong className="text-cream">Se busca</strong> dejas el
              título que andas persiguiendo y, cuando alguien lo sube, te avisamos por
              correo. Es la economía al revés: tú pides, los vendedores responden — muchas
              veces a precio de usado.
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
              acceptedAnswer: { "@type": "Answer", text: f.a },
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
              { "@type": "ListItem", position: 2, name: "Libros usados baratos", item: "https://tuslibros.cl/libros-usados-baratos" },
            ],
          }),
        }}
      />
    </>
  );
}
