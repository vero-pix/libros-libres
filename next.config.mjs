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
      // WordPress legacy URLs → new routes
      // NOTA: /libro/:slug ya NO se redirige acá — el middleware lo resuelve a /libro/[username]/[slug]
      // Recuperación de tráfico: el slug legacy se traduce a búsqueda (hay intent recuperable)
      { source: '/producto/:slug', destination: '/search?q=:slug', permanent: true },
      { source: '/product/:slug', destination: '/search?q=:slug', permanent: true },
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
