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
      // Consolidación geo SEO → patrón canónico único /libros-usados/[ciudad].
      // 301 desde rutas legacy y desde /ciudad/[slug] para eliminar canibalización.
      { source: '/libros-usados-santiago', destination: '/libros-usados/santiago', permanent: true },
      { source: '/libros-usados-providencia', destination: '/libros-usados/providencia', permanent: true },
      { source: '/ciudad/:slug', destination: '/libros-usados/:slug', permanent: true },
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
    ],
  },
}

export default withMDX(nextConfig)
