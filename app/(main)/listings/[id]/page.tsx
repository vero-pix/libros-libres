import { createClient } from "@/lib/supabase/server";
import { redirect, permanentRedirect } from "next/navigation";
import ListingDetail from "@/components/listings/ListingDetail";
import ListingCard from "@/components/listings/ListingCard";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import CategoriesSidebar from "@/components/ui/CategoriesSidebar";
import { buildCategoryTree } from "@/lib/categoryTree";
import type { Metadata } from "next";
import type { ListingWithBook } from "@/types";

interface Props {
  params: { id: string };
}

async function getListing(id: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("listings")
    .select(`*, book:books(*), seller:users(id, full_name, avatar_url, phone, public_email, instagram, username, mercadopago_user_id, on_vacation, vacation_message)`)
    .eq("id", id)
    .single();
  return data;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const listing = await getListing(params.id);
  if (!listing) return { title: "Libro no encontrado — tuslibros.cl" };

  const priceStr = listing.price ? `$${listing.price.toLocaleString("es-CL")}` : "";
  const bookTitle = listing.book.title || "";
  const author = listing.book.author || "";
  const buildTitle = () => {
    const full = priceStr
      ? `${bookTitle} — ${author} (${priceStr}, usado)`
      : `${bookTitle} — ${author}`;
    if (full.length <= 60) return full;
    const noPrice = `${bookTitle} — ${author}`;
    if (noPrice.length <= 60) return noPrice;
    const maxBookLen = 60 - author.length - 3 - 1;
    if (maxBookLen >= 15) return `${bookTitle.slice(0, maxBookLen).trimEnd()}… — ${author}`;
    return full.slice(0, 59).trimEnd() + "…";
  };
  const title = buildTitle();
  const sellerName = listing.seller?.full_name || "un vendedor de tuslibros.cl";
  // Sufijo único por listing: precio + vendedor. Evita meta descriptions
  // duplicadas cuando varios libros comparten la misma descripción editorial.
  const suffix = `${priceStr ? `Disponible por ${priceStr}` : "Disponible"}. Vendido por ${sellerName} en tuslibros.cl. Envío a todo Chile.`;
  const description = (() => {
    const rawDesc = listing.book.description;
    if (!rawDesc) {
      return `${listing.book.title} de ${listing.book.author} — libro usado${priceStr ? ` a ${priceStr}` : ""}. Vendido por ${sellerName} en tuslibros.cl. Envío por courier o retiro en persona.`;
    }
    const maxIntroLen = 160 - suffix.length - 2; // 2 = ". "
    const intro =
      rawDesc.length <= maxIntroLen
        ? rawDesc
        : rawDesc.slice(0, rawDesc.lastIndexOf(" ", maxIntroLen - 1)).trimEnd() + "…";
    return `${intro}. ${suffix}`;
  })();

  const image = listing.cover_image_url || listing.book.cover_url || "/og-image.png";

  // Canonical: apunta a URL amigable si existe, de lo contrario a la UUID
  const canonicalUrl = listing.slug && listing.seller?.username
    ? `https://tuslibros.cl/libro/${listing.seller.username}/${listing.slug}`
    : `https://tuslibros.cl/listings/${params.id}`;

  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title,
      description,
      siteName: "tuslibros.cl",
      type: "book",
      locale: "es_CL",
      url: canonicalUrl,
      images: [{ url: image, width: 600, height: 900, alt: listing.book.title }],
    },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

export default async function ListingByIdPage({ params }: Props) {
  const supabase = await createClient();
  const listing = await getListing(params.id);

  // Si el listing fue eliminado (borradores viejos, limpieza de BD, IDs
  // que quedaron indexados en Google), redirigir al home con 308 para que
  // Google actualice y el usuario aterrice en algo útil en vez de un 404.
  if (!listing) permanentRedirect("/");

  // Si tiene URL amigable, redirigir de forma permanente (308)
  // para que Google consolide PageRank hacia /libro/[username]/[slug]
  if (listing.slug && listing.seller?.username) {
    permanentRedirect(`/libro/${listing.seller.username}/${listing.slug}`);
  }

  // Sin username — mostrar el libro directamente
  const { data: images } = await supabase
    .from("listing_images")
    .select("id, image_url")
    .eq("listing_id", listing.id)
    .order("sort_order", { ascending: true });

  const { data: allActive } = await supabase
    .from("listings")
    .select("book:books(genre, category, subcategory)")
    .eq("status", "active");

  const categoryTree = await buildCategoryTree(supabase, (allActive ?? []) as any);

  const relatedResult = listing.book?.genre
    ? await supabase
        .from("listings")
        .select(`*, book:books(*), seller:users(id, full_name, avatar_url, username)`)
        .eq("status", "active")
        .neq("id", listing.id)
        .limit(20)
    : { data: null };

  const relatedListings: ListingWithBook[] = listing.book?.genre
    ? ((relatedResult.data as unknown as ListingWithBook[]) ?? [])
        .filter((l) => l.book.genre?.toLowerCase() === listing.book.genre.toLowerCase())
        .slice(0, 5)
    : [];

  // JSON-LD para fichas sin URL amigable (mismo schema que /libro/[username]/[slug])
  const fallbackUrl = `https://tuslibros.cl/listings/${listing.id}`;
  const bookCondition = listing.condition === "new"
    ? "https://schema.org/NewCondition"
    : "https://schema.org/UsedCondition";
  const bookFormat = (listing.book as any).binding === "hardcover"
    ? "https://schema.org/Hardcover"
    : "https://schema.org/Paperback";
  const bookDescription = listing.book.description
    || `${listing.book.title} de ${listing.book.author}. Libro usado publicado en tuslibros.cl.`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Book",
    name: listing.book.title,
    description: bookDescription,
    image: listing.cover_image_url || listing.book.cover_url || undefined,
    author: { "@type": "Person", name: listing.book.author },
    isbn: listing.book.isbn || undefined,
    inLanguage: (listing.book as any).language || "es",
    bookFormat,
    publisher: (listing.book as any).publisher || undefined,
    datePublished: listing.book.published_year ? String(listing.book.published_year) : undefined,
    numberOfPages: (listing.book as any).pages || undefined,
    offers: {
      "@type": "Offer",
      price: listing.price,
      priceCurrency: "CLP",
      availability: listing.status === "active"
        ? "https://schema.org/InStock"
        : "https://schema.org/SoldOut",
      itemCondition: bookCondition,
      seller: { "@type": "Person", name: listing.seller?.full_name },
      url: fallbackUrl,
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingRate: { "@type": "MonetaryAmount", value: "3500", currency: "CLP" },
        shippingDestination: { "@type": "DefinedRegion", addressCountry: "CL" },
        deliveryTime: {
          "@type": "ShippingDeliveryTime",
          handlingTime: { "@type": "QuantitativeValue", minValue: 1, maxValue: 2, unitCode: "DAY" },
          transitTime: { "@type": "QuantitativeValue", minValue: 1, maxValue: 5, unitCode: "DAY" },
        },
      },
      hasMerchantReturnPolicy: {
        "@type": "MerchantReturnPolicy",
        applicableCountry: "CL",
        returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
        merchantReturnDays: 7,
        returnMethod: "https://schema.org/ReturnByMail",
        returnFees: "https://schema.org/FreeReturn",
      },
    },
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: "https://tuslibros.cl" },
      { "@type": "ListItem", position: 2, name: listing.seller?.full_name || "Vendedor", item: `https://tuslibros.cl/vendedor/${listing.seller?.username ?? listing.seller_id}` },
      { "@type": "ListItem", position: 3, name: listing.book.title, item: fallbackUrl },
    ],
  };

  return (
    <div className="min-h-screen bg-cream">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <main className="max-w-7xl mx-auto px-6 py-10">
        <Breadcrumbs
          items={[
            { label: "Inicio", href: "/" },
            { label: listing.seller?.full_name || "Vendedor", href: `/vendedor/${listing.seller?.username ?? listing.seller_id}` },
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
