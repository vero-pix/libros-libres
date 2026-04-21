import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import ListingCard from "@/components/listings/ListingCard";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import { sortListingsForDisplay } from "@/lib/sortListings";
import type { ListingWithBook } from "@/types";

export const metadata: Metadata = {
  title: "Libros usados en Chile — comprar, vender y arrendar | tuslibros.cl",
  description:
    "Marketplace chileno de libros usados con mapa, pago seguro y envío por courier o retiro en mano. Primeras ediciones, rarezas y clásicos desde $3.000. Publicar es gratis.",
  alternates: { canonical: "https://tuslibros.cl/libros-usados-chile" },
  keywords: [
    "libros usados Chile",
    "libros usados Santiago",
    "comprar libros usados",
    "vender libros usados",
    "marketplace libros Chile",
    "primeras ediciones Chile",
    "libros agotados Chile",
    "librería de viejo online",
  ],
  openGraph: {
    title: "Libros usados en Chile — tuslibros.cl",
    description:
      "En Chile hay más libros usados de los que crees. Están en estantes de librerías de viejo, en bodegas de universitarios, en cajas guardadas en Providencia. Acá viven juntos.",
    url: "https://tuslibros.cl/libros-usados-chile",
    siteName: "tuslibros.cl",
    locale: "es_CL",
    type: "website",
  },
};

const faqs = [
  {
    q: "¿Puedo retirar el libro en persona?",
    a: "Sí. Cada vendedor elige si ofrece retiro en mano, despacho por courier, o ambos. El mapa te muestra los libros más cercanos a ti para que coordinen la entrega directa.",
  },
  {
    q: "¿A qué ciudades llega el despacho?",
    a: "A todo Chile vía Starken, Chilexpress, Blue Express y 99 Minutos. Santiago, Valparaíso, Concepción y todas las regiones. El vendedor imprime la etiqueta automáticamente cuando recibe el pago.",
  },
  {
    q: "¿Cómo sé que el libro está en buen estado?",
    a: "Cada publicación tiene fotos reales, descripción del vendedor y condición declarada (como nuevo, muy bueno, bueno, aceptable). El pago por MercadoPago queda protegido hasta que confirmas que recibiste el libro como esperabas.",
  },
  {
    q: "¿Hay primeras ediciones o libros raros?",
    a: "Sí, es parte de lo que mejor hacemos. Tenemos primeras ediciones, libros agotados, ediciones cubanas históricas, autores chilenos descatalogados. Mira la sección de coleccionables en el home.",
  },
  {
    q: "¿Cuánto cuesta el despacho?",
    a: "Depende del courier, peso y distancia. Se calcula automáticamente en el checkout. Para un libro estándar a Santiago capital suele estar entre $2.500 y $4.500. A regiones un poco más.",
  },
  {
    q: "¿Es gratis publicar mis libros?",
    a: "Sí, publicar es 100% gratis. Solo cobramos una comisión pequeña cuando se vende (8%) o se arrienda (10%). Sin mensualidades ni cargos fijos. Conéctate con MercadoPago y listo.",
  },
];

export default async function LibrosUsadosChilePage() {
  const supabase = await createClient();

  // Libros destacados para mostrar en el grid
  const { data: featuredRaw } = await supabase
    .from("listings")
    .select(`*, book:books(*), seller:users(id, full_name, avatar_url, username)`)
    .eq("status", "active")
    .order("featured_rank", { ascending: true, nullsFirst: false })
    .order("deprioritized", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(12);

  const featured = sortListingsForDisplay((featuredRaw as unknown as ListingWithBook[]) ?? []).slice(0, 8);

  // Stats reales del catálogo
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
              { label: "Libros usados en Chile" },
            ]}
          />

          {/* Hero */}
          <section className="mt-8 mb-16 max-w-3xl">
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-ink leading-[1.05] tracking-tight">
              Libros usados en Chile —<br />
              <span className="italic text-brand-600">comprar, vender, arrendar.</span>
            </h1>
            <p className="mt-6 text-lg text-ink-muted leading-relaxed">
              En Chile hay más libros usados de los que crees. Están en estantes de
              librerías de viejo en San Diego, en bodegas de universitarios que se
              mudan, en cajas guardadas en Providencia y Ñuñoa. <strong className="text-ink">tuslibros.cl</strong> es
              el primer lugar donde todos esos libros viven juntos — con mapa
              geolocalizado, pago seguro con MercadoPago y envío por courier o retiro
              en mano. Publicar es gratis.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/search"
                className="inline-flex items-center px-6 py-3 bg-brand-500 text-white text-sm font-semibold rounded-md hover:bg-brand-600 transition-colors shadow"
              >
                Ver {totalActive ? `${totalActive} libros disponibles` : "catálogo"}
              </Link>
              <Link
                href="/publish"
                className="inline-flex items-center px-6 py-3 bg-white border border-ink/20 text-ink text-sm font-semibold rounded-md hover:border-brand-500 hover:text-brand-600 transition-colors"
              >
                Publicar mis libros gratis
              </Link>
            </div>
          </section>

          {/* Por qué distinto */}
          <section className="mb-16">
            <h2 className="font-display text-3xl font-bold text-ink mb-6">
              No somos Buscalibre, ni MercadoLibre.
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl p-6 border border-cream-dark">
                <h3 className="font-display text-lg font-bold text-ink mb-2">
                  Curación, no commodity
                </h3>
                <p className="text-sm text-ink-muted leading-relaxed">
                  Destacamos primeras ediciones, rarezas y clásicos que no están en
                  librerías nuevas. Libros que pasaron por manos chilenas antes de
                  llegar a las tuyas.
                </p>
              </div>
              <div className="bg-white rounded-xl p-6 border border-cream-dark">
                <h3 className="font-display text-lg font-bold text-ink mb-2">
                  Mapa geolocalizado
                </h3>
                <p className="text-sm text-ink-muted leading-relaxed">
                  Ves los libros como puntos en el mapa de tu ciudad. El libro más
                  cercano aparece primero. Experiencia tipo Uber, no un catálogo
                  plano.
                </p>
              </div>
              <div className="bg-white rounded-xl p-6 border border-cream-dark">
                <h3 className="font-display text-lg font-bold text-ink mb-2">
                  Pago seguro + courier
                </h3>
                <p className="text-sm text-ink-muted leading-relaxed">
                  MercadoPago divide el pago automáticamente entre vendedor y
                  plataforma. Shipit genera la etiqueta. Sin conversaciones infinitas
                  de WhatsApp.
                </p>
              </div>
            </div>
          </section>

          {/* Testimonio */}
          <section className="mb-16 bg-white rounded-2xl p-8 md:p-10 border border-cream-dark">
            <p className="text-xs uppercase tracking-widest text-brand-600 font-semibold mb-4">
              Compraron y cuentan
            </p>
            <blockquote className="font-serif italic text-xl md:text-2xl text-ink leading-snug">
              &ldquo;Fácil y sin complicaciones. Muy buena disposición por parte del
              vendedor, volvería a comprar sin ningún problema.&rdquo;
            </blockquote>
            <p className="mt-4 text-sm text-ink-muted">
              — <span className="font-semibold text-ink">Z.</span> · compró <em>La Marina en la Historia de Chile · Tomo I</em> · 7 abril 2026
            </p>
          </section>

          {/* Libros destacados */}
          {featured.length > 0 && (
            <section className="mb-16">
              <h2 className="font-display text-3xl font-bold text-ink mb-6">
                Algunos libros usados disponibles hoy
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
              Cómo comprar un libro usado en tuslibros.cl
            </h2>
            <div className="grid md:grid-cols-4 gap-6">
              {[
                { n: "1", title: "Búscalo en el mapa o catálogo", desc: "Filtra por autor, título, género, precio o cercanía." },
                { n: "2", title: "Paga con MercadoPago", desc: "Tu plata queda protegida hasta que confirmes que recibiste el libro." },
                { n: "3", title: "Retira en mano o pide despacho", desc: "Courier Starken, Chilexpress, Blue Express o 99 Minutos — a todo Chile." },
                { n: "4", title: "Confirma la entrega", desc: "El vendedor recibe automáticamente su pago cuando el libro llega." },
              ].map((s) => (
                <div key={s.n}>
                  <div className="text-3xl font-display font-bold text-brand-500 mb-2">{s.n}</div>
                  <h3 className="font-display font-bold text-ink mb-1">{s.title}</h3>
                  <p className="text-sm text-ink-muted">{s.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Vender */}
          <section className="mb-16 bg-ink text-cream rounded-2xl p-8 md:p-12">
            <h2 className="font-display text-3xl font-bold mb-4">
              ¿Tienes libros que ya leíste? Véndelos.
            </h2>
            <p className="text-cream/80 max-w-2xl leading-relaxed mb-6">
              Publicar es gratis. Toma 2 minutos: subes una foto de la portada, nosotros
              completamos automáticamente la metadata del libro (título, autor, editorial,
              sinopsis). Conectas MercadoPago una vez y listo — cuando se venda, el pago
              llega directo a tu cuenta.
            </p>
            <ul className="space-y-2 text-sm text-cream/90 mb-6">
              <li>→ Comisión 8% por venta, 10% por arriendo. Sin mensualidades.</li>
              <li>→ Tú fijas el precio. Nosotros no intervenimos en tus publicaciones.</li>
              <li>→ Shipit retira el libro en tu casa cuando alguien compra.</li>
            </ul>
            <Link
              href="/publish"
              className="inline-flex items-center px-6 py-3 bg-brand-500 text-white text-sm font-semibold rounded-md hover:bg-brand-600 transition-colors shadow"
            >
              Publicar mi primer libro →
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
              { "@type": "ListItem", position: 2, name: "Libros usados en Chile", item: "https://tuslibros.cl/libros-usados-chile" },
            ],
          }),
        }}
      />
    </>
  );
}
