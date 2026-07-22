import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Script from "next/script";
import { createPublicClient } from "@/lib/supabase/public";
import ListingCard from "@/components/listings/ListingCard";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import { sortListingsForDisplay } from "@/lib/sortListings";
import { AUTHORS } from "./authors.config";
import type { ListingWithBook } from "@/types";

export const revalidate = 3600;

type Props = { params: { slug: string } };

export function generateStaticParams() {
  return Object.keys(AUTHORS).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const author = AUTHORS[params.slug];
  if (!author) return {};
  const url = `https://tuslibros.cl/autor/${params.slug}`;
  return {
    title: author.seoTitle,
    description: author.seoDescription,
    keywords: author.keywords,
    alternates: { canonical: url },
    openGraph: {
      title: author.seoTitle,
      description: author.seoDescription,
      url,
      siteName: "tuslibros.cl",
      locale: "es_CL",
      type: "website",
    },
  };
}

export default async function AutorPage({ params }: Props) {
  const author = AUTHORS[params.slug];
  if (!author) notFound();

  const supabase = createPublicClient();

  const { data: listings, error } = await supabase
    .from("listings")
    .select(
      `*, book:books!inner(*), seller:users(id, username, full_name, avatar_url, on_vacation, vacation_message)`
    )
    .eq("status", "active")
    .neq("deprioritized", true)
    .in("book.author", author.dbAuthors)
    .order("featured_rank", { ascending: true, nullsFirst: false })
    .limit(48);

  if (error) console.error("[autor] Error fetching listings:", error);

  const books = sortListingsForDisplay(
    ((listings ?? []).filter((l: any) => l.book) as unknown) as ListingWithBook[]
  );

  const pageUrl = `https://tuslibros.cl/autor/${params.slug}`;

  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${author.displayName} — Libros usados`,
    description: author.seoDescription,
    url: pageUrl,
    about: { "@type": "Person", name: author.displayName },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: books.length,
      itemListElement: books.slice(0, 10).map((listing, i) => ({
        "@type": "ListItem",
        position: i + 1,
        item: {
          "@type": "Book",
          name: listing.book?.title,
          author: { "@type": "Person", name: author.displayName },
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

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: author.faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <>
      <Script
        id="autor-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />
      <Script
        id="autor-faq-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <Breadcrumbs
          items={[
            { label: "Inicio", href: "/" },
            { label: "Autores", href: "/autor" },
            { label: author.displayName },
          ]}
        />

        {/* Header editorial */}
        <div className="mb-10 max-w-2xl">
          <p className="text-[11px] font-mono text-ink-muted uppercase tracking-wider mb-2">
            {author.subtitle}
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-ink mb-4 leading-tight">
            {author.displayName}
          </h1>
          <p className="text-ink-muted text-base leading-relaxed">{author.bio}</p>
          <p className="text-xs text-ink-muted/60 mt-3 font-mono">
            {books.length} libro{books.length !== 1 ? "s" : ""} disponible
            {books.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Grid de libros */}
        {books.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {books.map((listing) => (
              <ListingCard key={listing.id} listing={listing} showDistance={false} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-ink-muted border border-cream-dark rounded-xl bg-cream">
            <p className="font-display text-lg text-ink mb-2">
              Ahora mismo no hay libros de {author.displayName} en el catálogo.
            </p>
            <p className="text-sm mb-5">
              Es un autor muy buscado y sus ejemplares se mueven rápido. Pídelo y te
              avisamos apenas ingrese uno.
            </p>
            <Link
              href={`/solicitudes`}
              className="inline-block bg-brand-600 text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-brand-700 transition-colors"
            >
              Pedir un libro de {author.displayName}
            </Link>
          </div>
        )}

        {/* FAQ */}
        <section className="mt-14 max-w-2xl">
          <h2 className="font-display text-2xl font-bold text-ink mb-6">
            Preguntas frecuentes
          </h2>
          <div className="space-y-5">
            {author.faqs.map((f, i) => (
              <div key={i} className="border-b border-cream-dark pb-4">
                <h3 className="font-semibold text-ink mb-1.5">{f.q}</h3>
                <p className="text-ink-muted text-sm leading-relaxed">{f.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA editorial */}
        <div className="text-center mt-14">
          <p className="text-ink-muted mb-2">¿Tienes libros de {author.displayName}?</p>
          <Link
            href="/publish"
            className="text-brand-600 font-semibold hover:underline text-lg"
          >
            Publícalos gratis y encuentra a su próximo lector &rarr;
          </Link>
        </div>
      </main>
    </>
  );
}
