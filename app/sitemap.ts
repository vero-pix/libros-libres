import { MetadataRoute } from "next";
import { createServerClient } from "@supabase/ssr";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://tuslibros.cl";

  // Static pages
  const staticPages = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "daily" as const, priority: 1 },
    { url: `${baseUrl}/search`, lastModified: new Date(), changeFrequency: "daily" as const, priority: 0.8 },
    { url: `${baseUrl}/mapa`, lastModified: new Date(), changeFrequency: "daily" as const, priority: 0.8 },
    { url: `${baseUrl}/publish`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.7 },
    { url: `${baseUrl}/como-funciona`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.6 },
    { url: `${baseUrl}/faq`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.5 },
    { url: `${baseUrl}/sobre-nosotros`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.5 },
    { url: `${baseUrl}/historia`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.4 },
    { url: `${baseUrl}/alianzas`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.7 },
    { url: `${baseUrl}/novedades`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.6 },
    { url: `${baseUrl}/terminos`, lastModified: new Date(), changeFrequency: "yearly" as const, priority: 0.3 },
    { url: `${baseUrl}/privacidad`, lastModified: new Date(), changeFrequency: "yearly" as const, priority: 0.3 },
  ];

  // Dynamic listing pages
  let listingPages: MetadataRoute.Sitemap = [];
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { cookies: { getAll: () => [], setAll: () => {} } }
    );

    const { data: listings } = await supabase
      .from("listings")
      .select("id, updated_at")
      .eq("status", "active")
      .order("updated_at", { ascending: false })
      .limit(500);

    listingPages = (listings ?? []).map((l) => ({
      url: `${baseUrl}/listings/${l.id}`,
      lastModified: new Date(l.updated_at),
      changeFrequency: "weekly" as const,
      priority: 0.9,
    }));
  } catch {
    // Sitemap still works without dynamic pages
  }

  // Seller store pages
  let sellerPages: MetadataRoute.Sitemap = [];
  try {
    const supabaseForSellers = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { cookies: { getAll: () => [], setAll: () => {} } }
    );

    const { data: sellers } = await supabaseForSellers
      .from("users")
      .select("id, updated_at")
      .order("updated_at", { ascending: false })
      .limit(200);

    sellerPages = (sellers ?? []).map((s) => ({
      url: `${baseUrl}/vendedor/${s.id}`,
      lastModified: new Date(s.updated_at),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));
  } catch {
    // Continue without seller pages
  }

  return [...staticPages, ...listingPages, ...sellerPages];
}
