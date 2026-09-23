import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/Button";
import { createPublicClient } from "@/lib/supabase/public";
import ListingCard from "@/components/listings/ListingCard";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import type { ListingWithBook } from "@/types";

/**
 * Los destacados tienen casa propia desde el 23-09-2026. La fila salió de la
 * home el 17-09 (empujaba la grilla) y el abanico del hero pasó a la selección
 * de temporada el 20-09: durante tres días un libro destacado no salía en
 * ningún lado. Ahora se llega desde el chip "★ Destacados" del hero.
 *
 * Orden: `featured_rank`, el mismo que se maneja desde /mis-libros y el admin.
 */
export const revalidate = 300;

const URL = "https://tuslibros.cl/destacados";
const SEL = `*, book:books!inner(*), seller:users(id, full_name, avatar_url, username, mercadopago_user_id)`;

export const metadata: Metadata = {
  title: "Libros destacados: lo que elegí del catálogo",
  description:
    "Los libros usados que elegí del catálogo de tuslibros.cl: piezas raras, primeras ediciones y buenos hallazgos de personas reales en todo Chile.",
  alternates: { canonical: URL },
  openGraph: {
    title: "Libros destacados en tuslibros.cl",
    description: "Piezas raras y buenos hallazgos, elegidos uno por uno.",
    url: URL,
    siteName: "tuslibros.cl",
    locale: "es_CL",
    type: "website",
  },
};

export default async function DestacadosPage() {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("listings")
    .select(SEL)
    .eq("status", "active")
    .eq("featured", true)
    .neq("deprioritized", true)
    .order("featured_rank", { ascending: true, nullsFirst: false })
    .limit(60);
  const listings = (data ?? []) as unknown as ListingWithBook[];

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: "https://tuslibros.cl" },
      { "@type": "ListItem", position: 2, name: "Destacados", item: URL },
    ],
  };

  return (
    <div className="min-h-screen bg-cream">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      <section className="relative bg-hero border-b border-hero-line overflow-hidden">
        <div aria-hidden className="hero-glow hero-glow-gold -right-24 -top-32 w-[420px] h-[420px]" />
        <div className="relative max-w-6xl mx-auto px-6 pt-8 pb-12">
          <Breadcrumbs items={[{ label: "Inicio", href: "/" }, { label: "Destacados" }]} />
          <p className="inline-flex items-center gap-3 text-[11px] font-mono uppercase tracking-[0.22em] text-gold-deep mt-6 mb-4 before:content-[''] before:w-6 before:h-px before:bg-current">
            ★ Destacados
          </p>
          <h1 className="font-display text-4xl sm:text-5xl font-normal text-ink leading-[1.05] tracking-[-0.02em] max-w-3xl">
            Si tuviera que llevarme uno,{" "}
            <em className="italic">estaría en esta lista.</em>
          </h1>
          <p className="mt-6 font-display italic text-lg sm:text-xl text-ink-muted/90 leading-snug max-w-2xl">
            Piezas raras, primeras ediciones y hallazgos que no se repiten. Los elijo
            uno por uno, de mi repisa y de las de otros.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="#seleccion">Ver los {listings.length} libros</ButtonLink>
            <ButtonLink href="/" variant="secondary">Volver al catálogo</ButtonLink>
          </div>
        </div>
      </section>

      <section id="seleccion" className="max-w-7xl mx-auto px-6 py-10 scroll-mt-32">
        {listings.length === 0 ? (
          <p className="text-sm text-ink-muted">
            Por ahora no hay destacados.{" "}
            <a className="text-link underline" href="/">Mira el catálogo completo</a>.
          </p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {listings.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
