import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import ListingCard from "@/components/listings/ListingCard";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import { ordenarParaGrilla } from "@/lib/sortListings";
import type { ListingWithBook } from "@/types";

export const revalidate = 300;

const URL = "https://tuslibros.cl/lotes-de-libros";

/*
 * Lotes, packs, sagas y colecciones completas (27-09-2026).
 *
 * Google mandaba búsquedas de lotes a una dirección de la web vieja
 * (/product-category/lotes-de-libros: 247 impresiones y 16 clics en 28 días,
 * posición 7,9) que caía en el home sin ningún lote a la vista. Ese día había
 * 51 lotes, packs y colecciones publicados sin una página que los juntara.
 * next.config.mjs redirige la dirección vieja acá.
 */
export const metadata: Metadata = {
  title: "Lotes de libros usados: packs, sagas y colecciones completas",
  description:
    "Lotes de libros usados en Chile: packs, sagas completas, trilogías y colecciones en varios tomos, en una sola compra. Precio del lote entero, publicado por cada vendedor.",
  alternates: { canonical: URL },
  keywords: [
    "lotes de libros",
    "lote de libros usados",
    "lotes de libros usados chile",
    "pack de libros",
    "sagas completas libros",
    "trilogia completa libro usado",
    "coleccion completa libros usados",
  ],
  openGraph: {
    title: "Lotes de libros usados: packs, sagas y colecciones completas",
    description: "Sagas completas, trilogías, packs y colecciones en varios tomos. Usados, en una sola compra.",
    url: URL,
    siteName: "tuslibros.cl",
    locale: "es_CL",
    type: "website",
  },
};

/** Lo que cuenta como lote. */
// "saga" sola no: *30 Sunsets (Saga Bali)* o *Outlander 9* son un tomo suelto de una saga.
const ES_LOTE = /\blotes?\b|\bpacks?\b|colecci[oó]n completa|saga completa|trilog[ií]a|tomos? (1|i) (y|al|a) /i;
/** Primer filtro, en la base: amplio a propósito; ES_LOTE afina después. */
const PATRONES = ["%lote%", "%pack%", "%saga%", "%trilog%", "%colecci%n completa%", "%tomo%"];

const faqs = [
  {
    q: "¿Qué es un lote de libros?",
    a: "Varios libros que se venden juntos, por un solo precio: una saga completa, una trilogía, una obra en varios tomos o un pack armado por el vendedor alrededor de un tema o una editorial. Compras todo de una vez y te llega en un solo paquete.",
  },
  {
    q: "¿Conviene comprar en lote?",
    a: "Si quieres la serie entera, casi siempre: el vendedor suele cobrar menos por el lote que por cada tomo suelto, y el despacho se paga una sola vez. Para obras en varios tomos es además la única forma de tenerla completa, porque los tomos sueltos rara vez aparecen juntos.",
  },
  {
    q: "¿Cómo vendo un lote?",
    a: "Publícalo como un solo libro: en el título pon qué incluye («Trilogía completa, 3 tomos», «Pack 5 libros de Quimantú») y en el precio, el valor del lote entero. Si tienes una biblioteca grande para vender de una vez, escríbeme y te ayudo a subirla.",
  },
  {
    q: "¿Y si la saga que busco no está?",
    a: "Crea una solicitud en tuslibros.cl con el nombre de la saga y te aviso cuando alguien la publique.",
  },
];

export default async function LotesPage() {
  const supabase = await createClient();

  const { data: raw } = await supabase
    .from("listings")
    .select(`*, book:books!inner(*), seller:users(id, full_name, avatar_url, username, mercadopago_user_id)`)
    .eq("status", "active")
    .or(PATRONES.map((p) => `title.ilike.${p}`).join(","), { foreignTable: "book" })
    .limit(500);

  const lotes = ((raw ?? []) as any[]).filter((item) => item.book && ES_LOTE.test(item.book.title ?? "")) as unknown as ListingWithBook[];
  const listings = ordenarParaGrilla(lotes);

  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Lotes de libros usados: packs, sagas y colecciones completas",
    description: "Lotes de libros de segunda mano en Chile: sagas completas, trilogías, packs y obras en varios tomos.",
    url: URL,
  };
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: "https://tuslibros.cl" },
      { "@type": "ListItem", position: 2, name: "Lotes de libros", item: URL },
    ],
  };
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      <div className="min-h-screen bg-cream">
        <main className="max-w-5xl mx-auto px-6 py-10">
          <Breadcrumbs items={[{ label: "Inicio", href: "/" }, { label: "Lotes de libros" }]} />

          <section className="mt-8 mb-12 max-w-3xl animate-fade-in-up">
            <h1 className="font-display text-4xl sm:text-5xl font-bold text-ink leading-[1.05] tracking-tight">
              Lotes de libros —{" "}
              <span className="italic text-brand-600">sagas, packs y colecciones completas.</span>
            </h1>
            <p className="mt-5 text-lg text-ink-muted leading-relaxed">
              ¿Para qué comprar el tomo 2 si puedes llevarte la trilogía? Acá junto los lotes que
              publican los vendedores: sagas enteras, obras en varios tomos y packs armados por tema o
              por editorial. Un solo precio y un solo paquete.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/publish" className="shadow-sm">
                Vender un lote
              </ButtonLink>
              <ButtonLink href="/solicitudes" variant="outline">
                Pedir una saga que no está →
              </ButtonLink>
            </div>
          </section>

          {listings.length > 0 ? (
            <section className="mb-16">
              <div className="flex items-baseline justify-between mb-5">
                <h2 className="font-display text-2xl font-bold text-ink">Disponibles ahora</h2>
                <span className="text-sm text-ink-muted">{listings.length} lotes</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {listings.map((l) => <ListingCard key={l.id} listing={l} />)}
              </div>
            </section>
          ) : (
            <section className="mb-16 bg-white border border-cream-dark rounded-2xl p-8 text-center">
              <p className="font-display text-xl text-ink mb-2">No hay lotes disponibles hoy</p>
              <p className="text-sm text-ink-muted mb-6">Crea una solicitud y te aviso cuando aparezca el que buscas.</p>
              <Link href="/solicitudes" className="inline-flex items-center px-5 py-2.5 bg-brand-500 text-white text-sm font-semibold rounded-lg hover:bg-brand-600 transition-colors">
                Pedir un lote
              </Link>
            </section>
          )}

          <section className="mb-16 bg-ink text-cream rounded-2xl p-8 md:p-10">
            <h2 className="font-display text-2xl font-bold mb-3">¿Tienes una saga completa o una biblioteca entera?</h2>
            <p className="text-cream/80 text-sm leading-relaxed max-w-xl mb-6">
              Publícala como un solo lote, con el precio del conjunto. Publicar es gratis y solo cobro 8% cuando se vende por la plataforma.
            </p>
            <ButtonLink href="/publish">Publicar mi lote →</ButtonLink>
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
              <Link href="/libros-usados-baratos" className="text-sm text-brand-600 font-medium hover:text-brand-700 underline underline-offset-2 transition-colors">Libros usados baratos</Link>
              <span className="text-ink-muted">·</span>
              <Link href="/libros-antiguos" className="text-sm text-brand-600 font-medium hover:text-brand-700 underline underline-offset-2 transition-colors">Libros antiguos y de colección</Link>
              <span className="text-ink-muted">·</span>
              <Link href="/libros-infantiles" className="text-sm text-brand-600 font-medium hover:text-brand-700 underline underline-offset-2 transition-colors">Libros infantiles</Link>
              <span className="text-ink-muted">·</span>
              <Link href="/vender" className="text-sm text-brand-600 font-medium hover:text-brand-700 underline underline-offset-2 transition-colors">Vender libros usados</Link>
            </div>
          </section>
        </main>
      </div>
    </>
  );
}
