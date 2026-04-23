import { MetadataRoute } from "next";

// Crawlers que scrapean masivamente para entrenar LLMs sin devolver tráfico.
// Los bloqueamos por completo. Mantenemos Googlebot/Bingbot (search) y
// ChatGPT-User/PerplexityBot (citation con clicks reales al sitio).
const AI_TRAINING_CRAWLERS = [
  "GPTBot",
  "CCBot",
  "ClaudeBot",
  "anthropic-ai",
  "Google-Extended",
  "Bytespider",
  "FacebookBot",
  "Amazonbot",
  "Applebot-Extended",
  "Omgilibot",
  "Diffbot",
  "DataForSeoBot",
  "ImagesiftBot",
  "cohere-ai",
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
    "/pitch/",
    "/login",
    "/register",
  ];

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          ...privateSections,
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
      // Crawlers de training de LLM — bloqueo total.
      ...AI_TRAINING_CRAWLERS.map((ua) => ({
        userAgent: ua,
        disallow: "/",
      })),
    ],
    sitemap: "https://tuslibros.cl/sitemap.xml",
  };
}
