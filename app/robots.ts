import { MetadataRoute } from "next";

// Asistentes de IA que SÍ nos mandan gente. Abiertos a propósito desde el
// 3 ago 2026: la encuesta de julio mostró que ChatGPT es la 2ª fuente de
// tráfico del sitio, así que aparecer en sus respuestas vale más que
// proteger un catálogo que ya es público. Van explícitos para no depender
// de la regla "*".
const AI_ASSISTANTS_ALLOWED = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-User",
  "Claude-SearchBot",
  "anthropic-ai",
  "Google-Extended",
  "PerplexityBot",
  "Perplexity-User",
  "cohere-ai",
];

// Scrapers que extraen en masa sin devolver una sola visita. Bloqueo total.
const SCRAPERS_BLOCKED = [
  "CCBot",
  "Bytespider",
  "FacebookBot",
  "Amazonbot",
  "Applebot-Extended",
  "Omgilibot",
  "Diffbot",
  "DataForSeoBot",
  "ImagesiftBot",
];

export default function robots(): MetadataRoute.Robots {
  const privateSections = [
    "/api/",
    "/admin/",
    "/perfil/",
    "/mis-libros/",
    "/mis-pedidos/",
    "/mis-ventas/",
    "/mis-arriendos/",
    "/carrito/",
    "/checkout/",
    "/mensajes/",
    "/referidos/",
    "/login",
    "/register",
    "/publish",
  ];

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          ...privateSections,
          // Ojo: /search NO va acá. Las páginas de búsqueda ya llevan
          // `noindex, follow` en el <head>, y bloquearlas por robots impedía
          // que Google lo leyera — así seguían indexadas para siempre.
          // Para desindexar hay que dejarlas rastreables. (3 ago 2026)
          // Block filtered/sorted URLs to prevent crawl of thousands of param combos
          "/*?*sort=",
          "/*?*page=",
          "/*?*price_min=",
          "/*?*price_max=",
          "/*?*condition=",
          "/*?*modality=",
          "/*?*lat=",
          "/*?*lng=",
          "/*?*view=",
        ],
      },
      // Asistentes de IA — mismo trato que un buscador normal.
      ...AI_ASSISTANTS_ALLOWED.map((ua) => ({
        userAgent: ua,
        allow: "/",
        disallow: privateSections,
      })),
      // Scrapers sin retorno — bloqueo total.
      ...SCRAPERS_BLOCKED.map((ua) => ({
        userAgent: ua,
        disallow: "/",
      })),
    ],
    sitemap: "https://tuslibros.cl/sitemap.xml",
  };
}
