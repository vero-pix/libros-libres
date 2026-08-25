import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import ListingCard from "@/components/listings/ListingCard";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import { sortListingsForDisplay } from "@/lib/sortListings";
import { authorItemListJsonLd, AUTHOR_LANDING_LIMIT } from "@/lib/authorLandings";
import AuthorProfile from "@/components/landings/AuthorProfile";
import type { ListingWithBook } from "@/types";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Libros de Megan Maxwell Usados en Chile",
  description:
    "Compra libros de Megan Maxwell usados en Chile: la saga Pídeme lo que quieras, Las ranas también se enamoran, Adivina quién soy y más romántica. Segunda mano, envío a todo Chile o retiro en mano.",
  alternates: { canonical: "https://tuslibros.cl/megan-maxwell-libros" },
  keywords: [
    "megan maxwell",
    "libros megan maxwell",
    "megan maxwell usados",
    "comprar megan maxwell chile",
    "pideme lo que quieras",
    "novela romantica megan maxwell",
    "megan maxwell segunda mano",
  ],
  openGraph: {
    title: "Libros de Megan Maxwell Usados en Chile",
    description:
      "Toda la romántica de Megan Maxwell usada y a buen precio. Pídeme lo que quieras, Adivina quién soy y más. Envío a todo Chile.",
    url: "https://tuslibros.cl/megan-maxwell-libros",
    siteName: "tuslibros.cl",
    locale: "es_CL",
    type: "website",
  },
};

const faqs = [
  {
    q: "¿Qué libros de Megan Maxwell encuentro acá?",
    a: "Lo que más circula de segunda mano: la saga Pídeme lo que quieras, Adivina quién soy, Las ranas también se enamoran, Sorpréndeme, Yo te esperaré y muchos más. El catálogo cambia a medida que lectoras suben los suyos.",
  },
  {
    q: "¿Por qué comprar a Megan Maxwell usada?",
    a: "Porque sus novelas se leen rápido y muchas lectoras las van soltando una vez terminadas. Eso significa ejemplares en muy buen estado a una fracción del precio nuevo. Ideal para ponerte al día con sus sagas sin gastar de más.",
  },
  {
    q: "¿Cómo compro y recibo el libro?",
    a: "Pagas con tu tarjeta a través de MercadoPago, así queda registro de la compra y tienes 7 días para reclamar si algo sale mal. Eliges retiro en mano gratis con la vendedora o despacho por courier a todo Chile.",
  },
  {
    q: "¿No está el título que busco?",
    a: "Déjalo en la sección Se busca: publicas el libro de Megan Maxwell que andas persiguiendo y te avisamos por correo cuando alguien lo suba.",
  },
];

const BIO = [
  "Megan Maxwell es el seudónimo de Ana Rosa Bustos, nacida en Nuremberg de padre español y madre irlandesa, y radicada en Madrid. Empezó publicando en internet y por su cuenta, construyendo lectoras antes que editoriales, hasta que Esencia la fichó y se convirtió en una de las autoras de romántica más vendidas en español.",
  "Su serie más conocida es Pídeme lo que quieras, que arrancó en 2012 y se estiró a varios volúmenes. Romance erótico, protagonistas con dinero y con carácter, y un tono que se ríe de sí mismo: sus lectoras dicen que lo que la distingue del resto del género es el humor.",
  "Ha publicado más de cuarenta títulos entre romántica contemporánea, histórica y navideña. Escribe rápido y publica seguido, lo que arma colecciones largas.",
  "En el mercado de segunda mano chileno es de lo que más se mueve: son libros que se leen de corrido, se prestan entre amigas y se sueltan después, así que aparecen en muy buen estado y a precios bajos.",
];

const FOR_WHOM = [
  "Lectoras de romántica que quieren serie larga y no un libro suelto.",
  "Quien busca romance erótico con humor, no solemne.",
  "Las que quieren completar Pídeme lo que quieras sin pagar precio de librería — la serie completa nueva sale carísima.",
  "Lectoras de Colleen Hoover o E. L. James buscando algo en español y del mismo pulso.",
  "Quien lee rápido y necesita volumen: acá hay cuarenta y tantos títulos.",
  "Clubes de lectura de romántica, que en Chile son más y más activos.",
  "Quien recién entra al género y quiere partir por algo liviano.",
];

export default async function MeganMaxwellPage() {
  const supabase = await createClient();

  // Filtro por autor en la BD, no en JS: traer 1.000 listings y filtrar acá
  // dejaba fuera parte del catálogo por el techo de filas de Supabase.
  const { data: raw } = await supabase
    .from("listings")
    .select(`*, book:books!inner(*), seller:users(id, full_name, avatar_url, username, mercadopago_user_id)`)
    .eq("status", "active")
    .ilike("book.author", "%maxwell%")
    .limit(AUTHOR_LANDING_LIMIT);

  const matched = ((raw ?? []) as any[]).filter((item) => item.book) as unknown as ListingWithBook[];

  const listings = sortListingsForDisplay(matched).slice(0, AUTHOR_LANDING_LIMIT);

  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Libros de Megan Maxwell Usados en Chile",
    description: "Catálogo de novelas de Megan Maxwell de segunda mano en Chile.",
    url: "https://tuslibros.cl/megan-maxwell-libros",
  };
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: "https://tuslibros.cl" },
      { "@type": "ListItem", position: 2, name: "Megan Maxwell", item: "https://tuslibros.cl/megan-maxwell-libros" },
    ],
  };
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };

  const itemListJsonLd = authorItemListJsonLd(
    listings,
    "https://tuslibros.cl/megan-maxwell-libros",
    "Megan Maxwell"
  );

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      <div className="min-h-screen bg-cream">
        <main className="max-w-6xl mx-auto px-6 py-10">
          <Breadcrumbs items={[{ label: "Inicio", href: "/" }, { label: "Megan Maxwell" }]} />

          <section className="mt-8 mb-12 max-w-3xl">
            <h1 className="font-display text-4xl sm:text-5xl font-bold text-ink leading-[1.05] tracking-tight">
              Libros de Megan Maxwell,{" "}
              <span className="italic text-brand-600">usados y a buen precio.</span>
            </h1>
            <p className="mt-6 text-lg text-ink-muted leading-relaxed">
              La saga Pídeme lo que quieras, Adivina quién soy, Las ranas también se
              enamoran y toda su romántica. Acá las consigues de segunda mano —en muy buen
              estado y a una fracción del precio nuevo— porque las lectoras las van
              soltando apenas las terminan. Pago protegido con MercadoPago y envío a todo
              Chile.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/search?author=Megan%20Maxwell" className="inline-flex items-center px-6 py-3 bg-brand-500 text-white text-sm font-semibold rounded-xl hover:bg-brand-600 transition-colors shadow-sm">
                Ver disponibles
              </Link>
              <Link href="/solicitudes" className="inline-flex items-center px-6 py-3 bg-white border border-ink/20 text-ink text-sm font-semibold rounded-xl hover:border-brand-500 hover:text-brand-600 transition-colors">
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
                <Link href="/search?author=Megan%20Maxwell" className="text-sm text-brand-600 font-semibold hover:text-brand-700 transition-colors">
                  Ver todos →
                </Link>
              </div>
            </section>
          ) : (
            <section className="mb-16 bg-white border border-cream-dark rounded-2xl p-8 text-center">
              <p className="text-ink-muted mb-4">Por ahora no hay títulos cargados. Pide el que buscas y te avisamos.</p>
              <Link href="/solicitudes" className="inline-flex items-center px-5 py-2.5 bg-brand-500 text-white text-sm font-semibold rounded-lg hover:bg-brand-600 transition-colors">
                Dejar mi pedido
              </Link>
            </section>
          )}

          <AuthorProfile
            name="Megan Maxwell"
            bio={BIO}
            forWhom={FOR_WHOM}
            note="Es de lo que llega más nuevo al catálogo: son libros que se leen una vez y circulan, así que es fácil encontrarlos casi impecables por una fracción del precio. Si vas por la serie completa, revisa que los tomos sean de la misma edición para que calcen en la repisa."
          />

          <section className="mb-16 bg-ink text-cream rounded-2xl p-8 md:p-10">
            <h2 className="font-display text-2xl font-bold mb-3">¿Tienes Megan Maxwell que ya leíste?</h2>
            <p className="text-white/80 max-w-2xl leading-relaxed mb-5">
              Sus novelas se buscan harto. Publicar es gratis y cobramos una comisión
              pequeña solo cuando el libro se vende.
            </p>
            <Link href="/publish" className="inline-flex items-center px-6 py-3 bg-brand-500 text-white text-sm font-semibold rounded-xl hover:bg-brand-600 transition-colors">
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
