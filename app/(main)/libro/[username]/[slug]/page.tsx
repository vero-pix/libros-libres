import { createClient } from "@/lib/supabase/server";
import { permanentRedirect } from "next/navigation";
import ListingDetail from "@/components/listings/ListingDetail";
import ListingCard from "@/components/listings/ListingCard";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import CategoriesSidebar from "@/components/ui/CategoriesSidebar";
import { buildCategoryTree } from "@/lib/categoryTree";
import type { Metadata } from "next";
import type { ListingWithBook } from "@/types";

export const revalidate = 60;

interface Props {
  params: { username: string; slug: string };
}

async function getListing(username: string, slug: string) {
  const supabase = await createClient();

  // Find seller by username
  const { data: seller } = await supabase
    .from("users")
    .select("id")
    .eq("username", username)
    .single();

  if (!seller) return null;

  const { data } = await supabase
    .from("listings")
    .select(`*, book:books(*), seller:users(id, full_name, avatar_url, phone, public_email, instagram, username)`)
    .eq("slug", slug)
    .eq("seller_id", seller.id)
    .single();

  return data;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const listing = await getListing(params.username, params.slug);

  if (!listing) {
    return { title: "Libro no encontrado — tuslibros.cl" };
  }

  const priceStr = listing.price ? `$${listing.price.toLocaleString("es-CL")}` : "";
  const bookTitle = listing.book.title || "";
  const author = listing.book.author || "";
  // Truncamiento inteligente para mantener title ≤60 chars (recomendación Google).
  // Prioridad: título > autor > precio. Si el título es muy largo, se trunca con … y se mantiene el autor.
  const buildTitle = () => {
    const full = priceStr
      ? `${bookTitle} — ${author} (${priceStr}, usado)`
      : `${bookTitle} — ${author}`;
    if (full.length <= 60) return full;
    // Sin precio
    const noPrice = `${bookTitle} — ${author}`;
    if (noPrice.length <= 60) return noPrice;
    // Trunca el título pero preserva el autor
    const maxBookLen = 60 - author.length - 3 - 1; // " — " + "…"
    if (maxBookLen >= 15) {
      return `${bookTitle.slice(0, maxBookLen).trimEnd()}… — ${author}`;
    }
    // Autor y título largos: corte duro
    return full.slice(0, 59).trimEnd() + "…";
  };
  const title = buildTitle();
  const rawDesc = listing.book.description;
  const sellerName = listing.seller?.full_name || "un vendedor de tuslibros.cl";
  const description = rawDesc
    ? (rawDesc.length <= 160 ? rawDesc : rawDesc.slice(0, rawDesc.lastIndexOf(" ", 157)) + "…")
    : `${listing.book.title} de ${listing.book.author} — libro usado${priceStr ? ` desde ${priceStr}` : ""}. Publicado por ${sellerName} en tuslibros.cl. Envío por courier o retiro en mano en Chile.`;
  const image = listing.cover_image_url || listing.book.cover_url || "/og-image.png";
  const url = `https://tuslibros.cl/libro/${params.username}/${params.slug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: "tuslibros.cl",
      type: "article",
      locale: "es_CL",
      images: [{ url: image, width: 600, height: 900, alt: listing.book.title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export default async function LibroPage({ params }: Props) {
  const supabase = await createClient();
  const listing = await getListing(params.username, params.slug);

  // Ver comentario en listings/[id]: listings eliminados → home con 308
  // en vez de 404 seco. Mejor UX y mejor señal a Google.
  if (!listing) {
    permanentRedirect("/");
  }

  const { data: images } = await supabase
    .from("listing_images")
    .select("id, image_url")
    .eq("listing_id", listing.id)
    .order("sort_order", { ascending: true });

  const [relatedResult, allActiveResult] = await Promise.all([
    listing.book?.genre
      ? supabase
          .from("listings")
          .select(`*, book:books(*), seller:users(id, full_name, avatar_url, username)`)
          .eq("status", "active")
          .neq("id", listing.id)
          .limit(20)
      : Promise.resolve({ data: null }),
    supabase
      .from("listings")
      .select("book:books(genre, category, subcategory)")
      .eq("status", "active"),
  ]);

  const relatedListings: ListingWithBook[] = listing.book?.genre
    ? ((relatedResult.data as unknown as ListingWithBook[]) ?? [])
        .filter((l) => l.book.genre?.toLowerCase() === listing.book.genre.toLowerCase())
        .slice(0, 5)
    : [];

  const categoryTree = await buildCategoryTree(supabase, (allActiveResult.data ?? []) as any);

  const canonicalUrl = `https://tuslibros.cl/libro/${params.username}/${params.slug}`;

  const bookCondition = listing.condition === "new"
    ? "https://schema.org/NewCondition"
    : "https://schema.org/UsedCondition";
  const bookFormat = (listing.book as any).binding === "hardcover"
    ? "https://schema.org/Hardcover"
    : "https://schema.org/Paperback";
  const bookLanguage = (listing.book as any).language || "es";
  const bookImage = listing.cover_image_url || listing.book.cover_url || undefined;
  const bookDescription = listing.book.description || `${listing.book.title} de ${listing.book.author}. Libro usado publicado en tuslibros.cl.`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${listing.book.title} — ${listing.book.author}`,
    description: bookDescription,
    image: bookImage,
    brand: { "@type": "Brand", name: "tuslibros.cl" },
    itemCondition: bookCondition,
    author: { "@type": "Person", name: listing.book.author },
    isbn: listing.book.isbn || undefined,
    inLanguage: bookLanguage,
    bookFormat,
    offers: {
      "@type": "Offer",
      price: listing.price,
      priceCurrency: "CLP",
      availability: listing.status === "active" ? "https://schema.org/InStock" : "https://schema.org/SoldOut",
      seller: { "@type": "Person", name: listing.seller?.full_name },
      url: canonicalUrl,
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingRate: {
          "@type": "MonetaryAmount",
          value: "3500",
          currency: "CLP",
        },
        shippingDestination: {
          "@type": "DefinedRegion",
          addressCountry: "CL",
        },
        deliveryTime: {
          "@type": "ShippingDeliveryTime",
          handlingTime: {
            "@type": "QuantitativeValue",
            minValue: 1,
            maxValue: 2,
            unitCode: "DAY",
          },
          transitTime: {
            "@type": "QuantitativeValue",
            minValue: 1,
            maxValue: 5,
            unitCode: "DAY",
          },
        },
      },
      hasMerchantReturnPolicy: {
        "@type": "MerchantReturnPolicy",
        applicableCountry: "CL",
        returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
        merchantReturnDays: 7,
        returnMethod: "https://schema.org/ReturnByMail",
        returnFees: "https://schema.org/FreeReturn",
        returnPolicySeasonalOverride: undefined,
      },
    },
  };

  const bookJsonLd = {
    "@context": "https://schema.org",
    "@type": "Book",
    name: listing.book.title,
    author: { "@type": "Person", name: listing.book.author },
    isbn: listing.book.isbn || undefined,
    bookFormat,
    inLanguage: bookLanguage,
    image: bookImage,
    description: bookDescription,
    publisher: (listing.book as any).publisher || undefined,
    datePublished: listing.book.published_year ? String(listing.book.published_year) : undefined,
    numberOfPages: (listing.book as any).pages || undefined,
    offers: {
      "@type": "Offer",
      price: listing.price,
      priceCurrency: "CLP",
      availability: listing.status === "active" ? "https://schema.org/InStock" : "https://schema.org/SoldOut",
      itemCondition: bookCondition,
      seller: { "@type": "Person", name: listing.seller?.full_name },
      url: canonicalUrl,
    },
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: "https://tuslibros.cl" },
      { "@type": "ListItem", position: 2, name: listing.seller?.full_name || "Vendedor", item: `https://tuslibros.cl/vendedor/${listing.seller_id}` },
      { "@type": "ListItem", position: 3, name: listing.book.title, item: canonicalUrl },
    ],
  };

  return (
    <div className="min-h-screen bg-cream">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(bookJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <main className="max-w-7xl mx-auto px-6 py-10">
        <Breadcrumbs
          items={[
            { label: "Inicio", href: "/" },
            { label: listing.seller?.full_name || "Vendedor", href: `/vendedor/${listing.seller_id}` },
            { label: listing.book.title },
          ]}
        />
        <div className="flex gap-10">
          <CategoriesSidebar categoryTree={categoryTree} activeCategory={(listing.book as any).category} activeSubcategory={(listing.book as any).subcategory} />

          <div className="flex-1 min-w-0">
            <ListingDetail listing={listing} images={(images ?? []) as any} />

            {relatedListings.length > 0 && (
              <section className="mt-10">
                <h2 className="font-display text-xl font-bold text-ink mb-4">Libros similares</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {relatedListings.map((l) => (
                    <ListingCard key={l.id} listing={l} />
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
