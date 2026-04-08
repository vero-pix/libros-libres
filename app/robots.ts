import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
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
    ],
    sitemap: "https://tuslibros.cl/sitemap.xml",
  };
}
