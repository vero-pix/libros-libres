import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { createPublicClient } from "@/lib/supabase/public";
import ListingCard from "@/components/listings/ListingCard";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import { sortListingsForDisplay } from "@/lib/sortListings";
import { CURATED_MIN_PRICE } from "@/lib/listingIntegrity";
import { CATEGORIAS } from "./categorias.config";
import type { ListingWithBook } from "@/types";

export const revalidate = 3600;

type Props = { params: { slug: string } };

export function generateStaticParams() {
  return Object.keys(CATEGORIAS).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const cat = CATEGORIAS[params.slug];
  if (!cat) return {};
  const url = `https://tuslibros.cl/categoria/${params.slug}`;
  return {
    title: cat.seoTitle,
    description: cat.seoDescription,
    keywords: cat.keywords,
    alternates: { canonical: url },
    openGraph: {
      title: cat.seoTitle,
      description: cat.seoDescription,
      url,
      siteName: "tuslibros.cl",
      locale: "es_CL",
      type: "website",
    },
  };
}

export default async function CategoriaPage({ params }: Props) {
  const cat = CATEGORIAS[params.slug];
  if (!cat) notFound();

  const supabase = createPublicClient();

  let query = supabase
    .from("listings")
    .select(
      `*, book:books!inner(*), seller:users(id, username, full_name, avatar_url, on_vacation, vacation_message)`
    )
    .eq("status", "active")
    .neq("deprioritized", true)
    // Mismo criterio que los carruseles curados: un dedazo de precio no entra
    // a una página indexable.
    .gte("price", CURATED_MIN_PRICE)
    .eq("book.category", cat.dbCategory);

  // Sin subcategoría la landing cubre la categoría gruesa completa.
  if (cat.dbSubcategory) query = query.eq("book.subcategory", cat.dbSubcategory);

  const { data: listings, error } = await query
    .order("featured_rank", { ascending: true, nullsFirst: false })
    .limit(48);

  if (error) console.error("[categoria] Error fetching listings:", error);

  const books = sortListingsForDisplay(
    ((listings ?? []).filter((l: any) => l.book) as unknown) as ListingWithBook[]
  );

  const pageUrl = `https://tuslibros.cl/categoria/${params.slug}`;

  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${cat.displayName} — Libros usados`,
    description: cat.seoDescription,
    url: pageUrl,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: books.length,
      itemListElement: books.slice(0, 10).map((listing, i) => ({
        "@type": "ListItem",
        position: i + 1,
        item: {
          "@type": "Book",
          name: listing.book?.title,
          author: listing.book?.author
            ? { "@type": "Person", name: listing.book.author }
            : undefined,
          offers:
            listing.price != null
              ? {
                  "@type": "Offer",
                  price: listing.price,
                  priceCurrency: "CLP",
                  availability: "https://schema.org/InStock",
                }
              : undefined,
        },
      })),
    },
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: "https://tuslibros.cl" },
      { "@type": "ListItem", position: 2, name: "Categorías", item: "https://tuslibros.cl/categoria" },
      { "@type": "ListItem", position: 3, name: cat.displayName, item: pageUrl },
    ],
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: cat.faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  const hermanas = cat.relacionadas
    .map((s) => CATEGORIAS[s])
    .filter((c): c is NonNullable<typeof c> => !!c);

  // Vista filtrada equivalente en el home, para quien quiera afinar con el resto
  // de los filtros (ciudad, precio, orden).
  const filtroUrl = cat.dbSubcategory
    ? `/?category=${cat.dbCategory}&subcategory=${cat.dbSubcategory}`
    : `/?category=${cat.dbCategory}`;

  return (
    <>
      <script
        id="categoria-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />
      <script
        id="categoria-breadcrumb-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        id="categoria-faq-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <Breadcrumbs
          items={[
            { label: "Inicio", href: "/" },
            { label: "Categorías", href: "/categoria" },
            { label: cat.displayName },
          ]}
        />

        {/* Header editorial */}
        <div className="mb-10 max-w-2xl">
          <p className="text-[11px] font-mono text-ink-muted uppercase tracking-wider mb-2">
            {cat.subtitle}
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-ink mb-4 leading-tight">
            {cat.displayName}
          </h1>
          <p className="text-ink-muted text-base leading-relaxed">{cat.intro}</p>
          <p className="text-xs text-ink-muted/60 mt-3 font-mono">
            {books.length} libro{books.length !== 1 ? "s" : ""} disponible
            {books.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Grid de libros */}
        {books.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {books.map((listing) => (
                <ListingCard key={listing.id} listing={listing} showDistance={false} />
              ))}
            </div>
            <p className="mt-6 text-sm text-ink-muted">
              <Link href={filtroUrl} className="text-brand-600 font-medium hover:underline">
                Ver todo {cat.displayName.toLowerCase()} con filtros de ciudad y precio &rarr;
              </Link>
            </p>
          </>
        ) : (
          <div className="text-center py-16 text-ink-muted border border-cream-dark rounded-xl bg-cream">
            <p className="font-display text-lg text-ink mb-2">
              Ahora mismo no hay libros de {cat.displayName.toLowerCase()} en el catálogo.
            </p>
            <p className="text-sm mb-5">
              Pídelo y te avisamos apenas alguien publique uno.
            </p>
            <Link
              href="/solicitudes"
              className="inline-block bg-brand-600 text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-brand-700 transition-colors"
            >
              Pedir un libro de {cat.displayName.toLowerCase()}
            </Link>
          </div>
        )}

        {/* FAQ */}
        <section className="mt-14 max-w-2xl">
          <h2 className="font-display text-2xl font-bold text-ink mb-6">
            Preguntas frecuentes
          </h2>
          <div className="space-y-5">
            {cat.faqs.map((f, i) => (
              <div key={i} className="border-b border-cream-dark pb-4">
                <h3 className="font-semibold text-ink mb-1.5">{f.q}</h3>
                <p className="text-ink-muted text-sm leading-relaxed">{f.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Enlazado interno */}
        <section className="mt-14">
          <h2 className="font-display text-xl font-bold text-ink mb-4">Seguir explorando</h2>
          <div className="flex flex-wrap gap-2">
            {hermanas.map((h) => (
              <Link
                key={h.slug}
                href={`/categoria/${h.slug}`}
                className="px-3 py-1.5 rounded-lg border border-cream-dark text-sm text-ink-muted hover:bg-cream-warm hover:text-ink transition-colors"
              >
                {h.displayName}
              </Link>
            ))}
            {(cat.enlaces ?? []).map((e) => (
              <Link
                key={e.href}
                href={e.href}
                className="px-3 py-1.5 rounded-lg border border-cream-dark text-sm text-ink-muted hover:bg-cream-warm hover:text-ink transition-colors"
              >
                {e.label}
              </Link>
            ))}
          </div>
        </section>

        {/* CTA */}
        <div className="text-center mt-14">
          <p className="text-ink-muted mb-2">
            ¿Tienes libros de {cat.displayName.toLowerCase()} que ya leíste?
          </p>
          <Link href="/publish" className="text-brand-600 font-semibold hover:underline text-lg">
            Publícalos gratis y encuentra a su próximo lector &rarr;
          </Link>
        </div>
      </main>
    </>
  );
}
