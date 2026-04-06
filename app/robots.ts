import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/admin/", "/perfil/", "/mis-libros/", "/mis-pedidos/", "/mis-ventas/", "/mis-arriendos/", "/carrito/", "/checkout/"],
    },
    sitemap: "https://tuslibros.cl/sitemap.xml",
  };
}
