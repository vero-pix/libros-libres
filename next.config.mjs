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
      { source: '/producto/:slug', destination: '/search?q=:slug', permanent: true },
      { source: '/product/:slug', destination: '/search?q=:slug', permanent: true },
      { source: '/categoria-producto/:slug', destination: '/?genre=:slug', permanent: true },
      { source: '/product-category/:slug', destination: '/?genre=:slug', permanent: true },
      { source: '/product-category/:slug/:sub', destination: '/?genre=:sub', permanent: true },
      { source: '/tienda', destination: '/', permanent: true },
      { source: '/shop', destination: '/', permanent: true },
      { source: '/finalizar-compra', destination: '/login', permanent: true },
      { source: '/mi-cuenta', destination: '/perfil', permanent: true },
      { source: '/mi-cuenta/pedidos', destination: '/mis-pedidos', permanent: true },
      { source: '/my-account/:path*', destination: '/perfil', permanent: true },
      { source: '/contacto', destination: '/sobre-nosotros', permanent: true },
      { source: '/blog/:slug', destination: '/historia', permanent: false },
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
