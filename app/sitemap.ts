import { MetadataRoute } from "next";
import { createServerClient } from "@supabase/ssr";
import { COLLECTIONS } from "@/app/(main)/coleccion/[slug]/collections.config";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://tuslibros.cl";

  // Static pages (solo rutas PÚBLICAS — las que requieren login redirigen a
  // /login y Google las marca como "Página con redirección", bajando el SEO).
  // EXCLUIDAS: /search (bloqueada en robots.txt), query params (?category=X)
  const staticPages = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "daily" as const, priority: 1 },
    { url: `${baseUrl}/mapa`, lastModified: new Date(), changeFrequency: "daily" as const, priority: 0.8 },
    { url: `${baseUrl}/tiendas`, lastModified: new Date(), changeFrequency: "daily" as const, priority: 0.7 },
    { url: `${baseUrl}/vender`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.8 },
    { url: `${baseUrl}/vender-libros-usados`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.8 },
    { url: `${baseUrl}/libros-usados-chile`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.8 },
    { url: `${baseUrl}/comprar-libros-usados`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.8 },
    { url: `${baseUrl}/libros-usados-baratos`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.8 },
    { url: `${baseUrl}/libros-usados`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.8 },
    { url: `${baseUrl}/libros-antiguos`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.8 },
    // Landings SEO de libros de alta demanda (páginas dedicadas, ya en producción).
    // Estaban fuera del sitemap → dependían de pedir indexación a mano. Adentro para
    // que Google las descubra solo.
    { url: `${baseUrl}/algebra-de-baldor`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.7 },
    { url: `${baseUrl}/pablo-neruda`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.7 },
    { url: `${baseUrl}/mario-vargas-llosa`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.7 },
    { url: `${baseUrl}/rayuela`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.7 },
    { url: `${baseUrl}/cien-anos-de-soledad`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.7 },
    { url: `${baseUrl}/el-arte-de-amar`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.7 },
    // Landings de género/autor (jun 2026) — alta profundidad de catálogo.
    { url: `${baseUrl}/novelas-romanticas-usadas`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.7 },
    { url: `${baseUrl}/georges-simenon`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.7 },
    { url: `${baseUrl}/distopias-clasicas`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.7 },
    { url: `${baseUrl}/libros-de-historia-de-chile`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.8 },
    { url: `${baseUrl}/megan-maxwell-libros`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.7 },
    { url: `${baseUrl}/novela-negra-policial`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.7 },
    { url: `${baseUrl}/marcela-paz-libros`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.7 },
    { url: `${baseUrl}/solicitudes`, lastModified: new Date(), changeFrequency: "daily" as const, priority: 0.7 },
    { url: `${baseUrl}/alianzas`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.7 },
    { url: `${baseUrl}/como-funciona`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.6 },
    { url: `${baseUrl}/novedades`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.6 },
    { url: `${baseUrl}/faq`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.5 },
    { url: `${baseUrl}/como-despachar`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.5 },
    { url: `${baseUrl}/sobre-nosotros`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.5 },
    { url: `${baseUrl}/historia`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.4 },
    { url: `${baseUrl}/devoluciones`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.4 },
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
        priority: 0.8,
      };
    });

    // Colecciones editoriales con URL canónica (jul 2026)
    const collectionPages: MetadataRoute.Sitemap = Object.keys(COLLECTIONS).map((slug) => ({
      url: `${baseUrl}/coleccion/${slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));
    listingPages = [...collectionPages, ...listingPages];

    // TODO: agregar /categoria/[slug] cuando existan las rutas reales (Fase 2)
  } catch {
    // Sitemap still works without dynamic pages
  }

  // Seller store pages — solo vendedores con username (las URLs con UUID redirigen y Google las penaliza)
  let sellerPages: MetadataRoute.Sitemap = [];
  try {
    const supabaseForSellers = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { cookies: { getAll: () => [], setAll: () => {} } }
    );

    const { data: sellers } = await supabaseForSellers
      .from("users")
      .select("username, updated_at")
      .not("username", "is", null)
      .order("updated_at", { ascending: false })
      .limit(200);

    sellerPages = (sellers ?? [])
      .filter((s) => s.username)
      .map((s) => ({
        url: `${baseUrl}/vendedor/${s.username}`,
        lastModified: new Date(s.updated_at),
        changeFrequency: "weekly" as const,
        priority: 0.7,
      }));
  } catch {
    // Continue without seller pages
  }

  // Categorías excluidas del sitemap: las URLs serían /?category=X (home con query params),
  // no páginas reales. El & en esas URLs rompe el XML del sitemap. Se agregarán cuando
  // existan landings dedicadas (/libros-de-historia, etc.).

  const ciudadPages: MetadataRoute.Sitemap = [
    "santiago", "providencia", "las-condes", "nunoa",
    "valparaiso", "vina-del-mar", "concepcion", "temuco", "antofagasta", "la-serena",
    "talca", "puerto-montt", "coquimbo",
  ].map((c) => ({
    url: `${baseUrl}/libros-usados/${c}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: 0.9,
  }));

  return [...staticPages, ...ciudadPages, ...listingPages, ...sellerPages];
}
