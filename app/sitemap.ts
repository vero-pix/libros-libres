import { MetadataRoute } from "next";
import { createServerClient } from "@supabase/ssr";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://tuslibros.cl";

  // Static pages (solo rutas PÚBLICAS — las que requieren login redirigen a
  // /login y Google las marca como "Página con redirección", bajando el SEO).
  const staticPages = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "daily" as const, priority: 1 },
    { url: `${baseUrl}/search`, lastModified: new Date(), changeFrequency: "daily" as const, priority: 0.8 },
    { url: `${baseUrl}/mapa`, lastModified: new Date(), changeFrequency: "daily" as const, priority: 0.8 },
    // /publish requiere login — usar /vender (landing pública) en su lugar
    { url: `${baseUrl}/vender`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.8 },
    { url: `${baseUrl}/solicitudes`, lastModified: new Date(), changeFrequency: "daily" as const, priority: 0.7 },
    { url: `${baseUrl}/como-funciona`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.6 },
    { url: `${baseUrl}/como-despachar`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.5 },
    { url: `${baseUrl}/devoluciones`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.4 },
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
      .select("id, slug, updated_at, seller:users(username)")
      .eq("status", "active")
      .order("updated_at", { ascending: false })
      .limit(1000);

    listingPages = (listings ?? []).map((l: any) => {
      const username = l.seller?.username;
      const url =
        username && l.slug
          ? `${baseUrl}/libro/${username}/${l.slug}`
          : `${baseUrl}/listings/${l.id}`;
      return {
        url,
        lastModified: new Date(l.updated_at),
        changeFrequency: "weekly" as const,
        priority: 0.9,
      };
    });
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

  // Category pages — subcategorías con al menos 1 libro activo
  let categoryPages: MetadataRoute.Sitemap = [];
  try {
    const supabaseForCats = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { cookies: { getAll: () => [], setAll: () => {} } }
    );

    // Subcategorías con libros
    const { data: subcatData } = await supabaseForCats
      .from("books")
      .select("subcategory, category")
      .not("subcategory", "is", null);

    if (subcatData) {
      // Contar libros por subcategoría
      const subCounts = new Map<string, { category: string; count: number }>();
      for (const row of subcatData) {
        if (!row.subcategory) continue;
        const existing = subCounts.get(row.subcategory);
        if (existing) {
          existing.count++;
        } else {
          subCounts.set(row.subcategory, { category: row.category ?? "", count: 1 });
        }
      }

      // Subcategorías con al menos 3 libros
      Array.from(subCounts.entries())
        .filter(([, { count }]) => count >= 3)
        .forEach(([sub, { category }]) => {
          const qs = category
            ? `?category=${encodeURIComponent(category)}&subcategory=${encodeURIComponent(sub)}`
            : `?subcategory=${encodeURIComponent(sub)}`;
          categoryPages.push({
            url: `${baseUrl}/${qs}`,
            lastModified: new Date(),
            changeFrequency: "weekly" as const,
            priority: 0.7,
          });
        });

      // Categorías raíz con al menos 1 libro
      const catCounts = new Map<string, number>();
      for (const row of subcatData) {
        if (!row.category) continue;
        catCounts.set(row.category, (catCounts.get(row.category) ?? 0) + 1);
      }
      Array.from(catCounts.entries())
        .filter(([, count]) => count >= 1)
        .forEach(([cat]) => {
          categoryPages.push({
            url: `${baseUrl}/?category=${encodeURIComponent(cat)}`,
            lastModified: new Date(),
            changeFrequency: "weekly" as const,
            priority: 0.75,
          });
        });
    }
  } catch {
    // Sitemap still works without category pages
  }

  return [...staticPages, ...categoryPages, ...listingPages, ...sellerPages];
}
