import { foldAccents } from "./accentSearch";

// Autores con landing dedicada. La ficha de un libro de estos autores enlaza a
// su landing (concentra autoridad SEO en el hub del autor y evita que la ficha
// individual le canibalice el ranking a la landing). El match es sobre el nombre
// del autor, insensible a tildes/mayúsculas.
const AUTHOR_LANDINGS: { match: string; slug: string; label: string }[] = [
  { match: "neruda", slug: "/pablo-neruda", label: "Pablo Neruda" },
  { match: "vargas llosa", slug: "/mario-vargas-llosa", label: "Mario Vargas Llosa" },
  { match: "marcela paz", slug: "/marcela-paz-libros", label: "Marcela Paz" },
  { match: "megan maxwell", slug: "/megan-maxwell-libros", label: "Megan Maxwell" },
  { match: "simenon", slug: "/georges-simenon", label: "Georges Simenon" },
  { match: "baldor", slug: "/algebra-de-baldor", label: "Baldor" },
  // Config-driven (/autor/[slug]). Van acá y no vía authorLink para no meter
  // authors.config entero al bundle cliente de ListingDetail.
  { match: "wilber", slug: "/autor/ken-wilber", label: "Ken Wilber" },
  { match: "rudolf steiner", slug: "/autor/rudolf-steiner", label: "Rudolf Steiner" },
];

export function authorLanding(author?: string | null): { slug: string; label: string } | null {
  if (!author) return null;
  const a = foldAccents(author);
  const hit = AUTHOR_LANDINGS.find((x) => a.includes(x.match));
  return hit ? { slug: hit.slug, label: hit.label } : null;
}

/**
 * Tope de fichas por landing de autor. Antes cada página cortaba en 8 a mano,
 * y con 27 Simenon activos eso escondía 19 libros que sí están a la venta —
 * justo el catálogo que hace competitiva a la página. 48 deja ver todo lo que
 * hay hoy sin que la página se vuelva infinita si un autor crece mucho.
 */
export const AUTHOR_LANDING_LIMIT = 48;

type LandingListing = {
  slug?: string | null;
  price?: number | null;
  seller?: { username?: string | null } | null;
  book?: { title?: string | null; author?: string | null } | null;
};

/**
 * ItemList de las fichas visibles en una landing de autor. Le dice al buscador
 * qué libros concretos ofrece la página, con precio y disponibilidad, en vez de
 * dejarlo inferir desde el HTML.
 */
export function authorItemListJsonLd(
  listings: LandingListing[],
  pageUrl: string,
  authorLabel: string
) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Libros de ${authorLabel} usados en Chile`,
    url: pageUrl,
    numberOfItems: listings.length,
    itemListElement: listings.map((l, i) => {
      // Sin username o sin slug la ficha vive en /listings/[uuid]; en ese caso
      // se apunta a la landing para no publicar una URL que no resuelve.
      const username = l.seller?.username;
      const url = username && l.slug
        ? `https://tuslibros.cl/libro/${username}/${l.slug}`
        : pageUrl;
      return {
        "@type": "ListItem",
        position: i + 1,
        item: {
          "@type": "Book",
          name: l.book?.title ?? "",
          author: { "@type": "Person", name: l.book?.author ?? authorLabel },
          url,
          offers: {
            "@type": "Offer",
            price: l.price ?? 0,
            priceCurrency: "CLP",
            availability: "https://schema.org/InStock",
            itemCondition: "https://schema.org/UsedCondition",
          },
        },
      };
    }),
  };
}
