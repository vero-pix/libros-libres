import Link from "next/link";
import type { Metadata } from "next";
import { createPublicClient } from "@/lib/supabase/public";
import ListingCard from "@/components/listings/ListingCard";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import { sortListingsForDisplay } from "@/lib/sortListings";
import type { ListingWithBook } from "@/types";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Libros de Marcela Paz Usados en Chile — Papelucho | tuslibros.cl",
  description:
    "Compra libros de Marcela Paz usados en Chile: Papelucho Misionero, Papelucho Perdido, ¿Soy Dix-leso? y más. Segunda mano, envío a todo Chile o retiro en persona.",
  alternates: { canonical: "https://tuslibros.cl/marcela-paz-libros" },
  keywords: [
    "marcela paz libros",
    "papelucho usado",
    "papelucho segunda mano",
    "libros marcela paz chile",
    "papelucho barato",
    "coleccion papelucho",
    "marcela paz usados",
  ],
  openGraph: {
    title: "Libros de Marcela Paz Usados en Chile — Papelucho | tuslibros.cl",
    description:
      "Papelucho y toda la obra de Marcela Paz de segunda mano. Buen estado, a buen precio, con envío a todo Chile.",
    url: "https://tuslibros.cl/marcela-paz-libros",
    siteName: "tuslibros.cl",
    locale: "es_CL",
    type: "website",
  },
};

const faqs = [
  {
    q: "¿Qué libros de Marcela Paz encuentro acá?",
    a: "Lo que más circula de segunda mano: Papelucho Misionero, Papelucho Perdido, ¿Soy Dix-leso?, Mi hermano hippie y otros títulos de la saga. El catálogo cambia a medida que vendedores suben los suyos.",
  },
  {
    q: "¿Por qué comprar Papelucho usado?",
    a: "Porque son libros que se leen rápido y se van pasando de mano en mano — ideal para armar la colección completa sin gastar de más. Los ejemplares de segunda mano suelen estar en muy buen estado porque son libros infantiles que se cuidan.",
  },
  {
    q: "¿Cómo compro y recibo el libro?",
    a: "Pagas con MercadoPago — seguro, trazable, no en efectivo a un desconocido. Eliges retiro en persona gratis con el vendedor o despacho por courier a todo Chile.",
  },
  {
    q: "¿No está el Papelucho que busco?",
    a: "Déjalo en la sección Se busca: publicas el título que andas persiguiendo y te avisamos por correo cuando alguien lo suba.",
  },
  {
    q: "¿Puedo vender mis Papelucho acá?",
    a: "Sí. Publicar es gratis y cobramos una comisión pequeña solo cuando el libro se vende. Los Papelucho tienen buena salida, especialmente en época escolar.",
  },
];

export default async function MarcelaPazPage() {
  const supabase = createPublicClient();

  const { data: raw } = await supabase
    .from("listings")
    .select(`*, book:books(*), seller:users(id, full_name, avatar_url, username, on_vacation, vacation_message, mercadopago_user_id)`)
    .eq("status", "active")
    .ilike("book.author", "%marcela paz%")
    .limit(48);

  const listings = sortListingsForDisplay(
    ((raw ?? []).filter((l: any) => l.book) as unknown) as ListingWithBook[]
  ).slice(0, 12);

  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Libros de Marcela Paz Usados en Chile",
    description: "Papelucho y la obra de Marcela Paz de segunda mano en Chile.",
    url: "https://tuslibros.cl/marcela-paz-libros",
  };
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: "https://tuslibros.cl" },
      { "@type": "ListItem", position: 2, name: "Marcela Paz", item: "https://tuslibros.cl/marcela-paz-libros" },
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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      <div className="min-h-screen bg-cream">
        <main className="max-w-6xl mx-auto px-6 py-10">
          <Breadcrumbs items={[{ label: "Inicio", href: "/" }, { label: "Marcela Paz" }]} />

          <section className="mt-8 mb-12 max-w-3xl">
            <h1 className="font-display text-4xl sm:text-5xl font-bold text-ink leading-[1.05] tracking-tight">
              Libros de Marcela Paz,{" "}
              <span className="italic text-brand-600">usados y a buen precio.</span>
            </h1>
            <p className="mt-6 text-lg text-ink-muted leading-relaxed">
              Papelucho Misionero, Papelucho Perdido, ¿Soy Dix-leso? y toda la saga de la autora chilena más querida de la literatura infantil. Acá los consigues de segunda mano — en buen estado y a una fracción del precio nuevo — porque los libros de Marcela Paz se van pasando de mano en mano. Pago con MercadoPago y envío a todo Chile.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/search?author=Marcela%20Paz"
                className="inline-flex items-center px-6 py-3 bg-brand-500 text-white text-sm font-semibold rounded-xl hover:bg-brand-600 transition-colors shadow-sm"
              >
                Ver disponibles
              </Link>
              <Link
                href="/solicitudes"
                className="inline-flex items-center px-6 py-3 bg-white border border-ink/20 text-ink text-sm font-semibold rounded-xl hover:border-brand-500 hover:text-brand-600 transition-colors"
              >
                Pedir uno que no está
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
                <Link
                  href="/search?author=Marcela%20Paz"
                  className="text-sm text-brand-600 font-semibold hover:text-brand-700 transition-colors"
                >
                  Ver todos →
                </Link>
              </div>
            </section>
          ) : (
            <section className="mb-16 bg-white border border-cream-dark rounded-2xl p-8 text-center">
              <p className="text-ink-muted mb-4">Por ahora no hay títulos cargados. Pide el que buscas y te avisamos cuando llegue.</p>
              <Link
                href="/solicitudes"
                className="inline-flex items-center px-5 py-2.5 bg-brand-500 text-white text-sm font-semibold rounded-lg hover:bg-brand-600 transition-colors"
              >
                Dejar mi pedido
              </Link>
            </section>
          )}

          <section className="mb-16 bg-ink text-cream rounded-2xl p-8 md:p-10">
            <h2 className="font-display text-2xl font-bold mb-3">¿Tienes Papelucho que ya leyeron en casa?</h2>
            <p className="text-white/80 max-w-2xl leading-relaxed mb-5">
              La saga de Marcela Paz tiene buena salida, especialmente en época escolar. Publicar es gratis y cobramos una comisión pequeña solo cuando el libro se vende.
            </p>
            <Link
              href="/publish"
              className="inline-flex items-center px-6 py-3 bg-brand-500 text-white text-sm font-semibold rounded-xl hover:bg-brand-600 transition-colors"
            >
              Publicar un libro →
            </Link>
          </section>

          <section className="mb-12">
            <h2 className="font-display text-2xl font-bold text-ink mb-6">Preguntas frecuentes</h2>
            <div className="space-y-4">
              {faqs.map((f, i) => (
                <details key={i} className="group bg-white border border-cream-dark/50 rounded-xl p-5 cursor-pointer">
                  <summary className="font-semibold text-ink list-none flex justify-between items-center">
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
    </>
  );
}
