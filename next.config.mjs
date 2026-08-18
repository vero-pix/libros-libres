import createMDX from '@next/mdx'

const withMDX = createMDX({
  extension: /\.mdx?$/,
  options: {
    remarkPlugins: [],
    rehypePlugins: [],
  },
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ['ts', 'tsx', 'js', 'jsx', 'md', 'mdx'],
  async redirects() {
    return [
      // www → apex (301 permanente para consolidar link equity)
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.tuslibros.cl' }],
        destination: 'https://tuslibros.cl/:path*',
        permanent: true,
      },
      // SEO landing pages — libros de alta demanda con página dedicada.
      // Redirigen ANTES que el middleware para transferir link equity (308).
      { source: '/libro/algebra-de-baldor', destination: '/algebra-de-baldor', permanent: true },
      { source: '/libro/algebra-de-baldor/', destination: '/algebra-de-baldor', permanent: true },
      // Neruda: la ficha original se vendió y su URL zombi quedaba indexada en pos ~70
      // con 755 impr/semana y 0 clics (el middleware la mandaba 302 a /search, dead end).
      // 301 permanente a la landing dedicada para consolidar esas impresiones donde toca.
      { source: '/libro/veinte-poemas-de-amor-y-una-cancion-desesperada-pablo-neruda', destination: '/pablo-neruda', permanent: true },
      { source: '/libro/veinte-poemas-de-amor-y-una-cancion-desesperada-pablo-neruda/', destination: '/pablo-neruda', permanent: true },
      // Consolidación geo SEO → patrón canónico único /libros-usados/[ciudad].
      // 301 desde rutas legacy y desde /ciudad/[slug] para eliminar canibalización.
      { source: '/libros-usados-santiago', destination: '/libros-usados/santiago', permanent: true },
      { source: '/libros-usados-providencia', destination: '/libros-usados/providencia', permanent: true },
      { source: '/ciudad/:slug', destination: '/libros-usados/:slug', permanent: true },
      // Consolidación de "vender" (31 jul 2026). /vender-libros-usados era un
      // duplicado casi calcado de /vender: 0 clics, 0 impresiones y 0 consultas
      // en GSC durante 90 días, mientras /vender aparecía en posición ~46 para
      // "vender libros usados" y la home se llevaba el tráfico (posición 7,5).
      // Tres páginas peleando la misma intención; se deja una sola.
      { source: '/vender-libros-usados', destination: '/vender', permanent: true },
      // WordPress legacy URLs → new routes
      // NOTA: /libro/:slug ya NO se redirige acá — el middleware lo resuelve a /libro/[username]/[slug]
      // Recuperación de tráfico: el slug legacy se traduce a búsqueda (hay intent recuperable)
      { source: '/producto/:slug', destination: '/search?q=:slug', permanent: true },
      { source: '/product/:slug', destination: '/search?q=:slug', permanent: true },
      // Tags legacy de WooCommerce indexados en Google (rebotaban 100% en 404).
      // Los slugs viejos no calzan con los tags curados → usamos ?q= (busca
      // título/autor; si no hay match cae en el empty-state, nunca en 404).
      { source: '/product-tag/:slug', destination: '/search?q=:slug', permanent: true },
      { source: '/product-tag/:slug/page/:page', destination: '/search?q=:slug', permanent: true },
      { source: '/categoria-producto/:slug', destination: '/?genre=:slug', permanent: true },
      { source: '/product-category/:slug', destination: '/?genre=:slug', permanent: true },
      { source: '/product-category/:slug/:sub', destination: '/?genre=:sub', permanent: true },
      // Rutas internas vigentes (no legacy SEO)
      { source: '/contacto', destination: '/sobre-nosotros', permanent: true },
      { source: '/blog/:slug', destination: '/historia', permanent: false },
      // NOTA: /tienda, /shop, /mi-cuenta, /my-account/*, /finalizar-compra ya NO
      // redirigen acá — el middleware les da 410 Gone para desindexar más rápido.
    ];
  },
  images: {
    // ─── Control de costo de Vercel (17 ago 2026) ───────────────────────────
    // La optimización de imágenes es lo que más factura del plan, y venía con
    // los valores por defecto de Next 14: caché de 60 SEGUNDOS (cada visita
    // después de ese minuto vuelve a transformar la misma portada y se vuelve a
    // cobrar) y 16 anchos distintos por imagen, cada variante facturada aparte.
    // Con ~1.950 portadas eso multiplica la cuenta sin que se note en pantalla.
    //
    // minimumCacheTTL: 30 días. Las portadas no cambian; si una se reemplaza,
    // el listing recibe una URL nueva igual.
    minimumCacheTTL: 2592000,
    // Solo los anchos que el diseño realmente usa. Cada ancho de más es otra
    // transformación facturada. Los `sizes` del código son 32/48/56/64/112/
    // 144/160/220px, así que estos cuatro los cubren a 1x y a 2x (retina):
    // 32@2x→64, 144@2x→288→384, 220@2x→440→640.
    deviceSizes: [640, 828, 1200, 1920],
    imageSizes: [64, 128, 256, 384],
    // Solo WebP: AVIF comprime algo mejor pero es bastante más caro de generar
    // y duplica las variantes de cada imagen.
    formats: ["image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "books.google.com",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
      {
        // Custom domain de Supabase (api.tuslibros.cl) — sirve /storage/covers.
        // Sin esto, next/image bloquea las portadas de libros subidos
        // después de la migración al custom domain.
        protocol: "https",
        hostname: "api.tuslibros.cl",
      },
      {
        protocol: "https",
        hostname: "covers.openlibrary.org",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        // Avatares de quienes entran con Google (OAuth, vivo desde jul 2026).
        // Sin esto next/image rechaza el avatar: en dev tumba la página entera
        // con "Invalid src prop" y en producción el avatar queda roto.
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
}

export default withMDX(nextConfig)
