import type { Metadata } from "next";
import { Playfair_Display, DM_Sans } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/react";
import Footer from "@/components/ui/Footer";
import BackToTop from "@/components/ui/BackToTop";
import PageTracker from "@/components/ui/PageTracker";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: "swap",
});

export const viewport = {
  themeColor: "#1a1a2e",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://tuslibros.cl"),
  title: {
    default: "Libros libres, puerta a puerta — tuslibros.cl",
    template: "%s | tuslibros.cl",
  },
  description:
    "Compra y vende libros usados en Santiago y todo Chile. Desde $3.000, pago seguro con MercadoPago, despacho por courier o retiro en mano. Publica gratis tu biblioteca.",
  keywords: [
    "libros usados",
    "libros usados Chile",
    "libros usados Santiago",
    "comprar libros usados",
    "vender libros usados",
    "libros segunda mano",
    "marketplace libros",
    "arriendo libros",
    "librería online Chile",
  ],
  openGraph: {
    title: "tuslibros.cl — Libros usados en Chile con envío o retiro",
    description:
      "Compra y vende libros usados en Chile. Desde $3.000, pago seguro con MercadoPago, despacho o retiro.",
    url: "https://tuslibros.cl",
    siteName: "tuslibros.cl",
    type: "website",
    locale: "es_CL",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "tuslibros.cl — Libros usados en Chile",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "tuslibros.cl — Libros usados en Chile",
    description:
      "Libros usados en Chile desde $3.000. Pago seguro, despacho o retiro en mano.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-CL">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="tuslibros.cl" />
        {/* Google Analytics GA4 */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-N243GH70EQ" />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','G-N243GH70EQ');`,
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `if("serviceWorker" in navigator){setTimeout(()=>{navigator.serviceWorker.register("/sw.js")},3000)}`,
          }}
        />
      </head>
      <body className={`${playfair.variable} ${dmSans.variable} font-sans antialiased flex flex-col min-h-screen bg-cream`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "tuslibros.cl",
              alternateName: "tuslibros",
              url: "https://tuslibros.cl",
              logo: "https://tuslibros.cl/og-image.png",
              description: "Marketplace chileno de libros usados. Compra, vende y arrienda libros cerca de ti, con mapa, despacho por courier o retiro en mano.",
              areaServed: { "@type": "Country", name: "Chile" },
              sameAs: ["https://www.linkedin.com/in/economista-veronica-velasquez/"],
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "tuslibros.cl",
              alternateName: "tuslibros",
              url: "https://tuslibros.cl",
              inLanguage: "es-CL",
              description: "Libros usados en Chile con envío o retiro. Pago seguro con MercadoPago.",
              potentialAction: {
                "@type": "SearchAction",
                target: {
                  "@type": "EntryPoint",
                  urlTemplate: "https://tuslibros.cl/search?q={search_term_string}",
                },
                "query-input": "required name=search_term_string",
              },
            }),
          }}
        />
        {children}
        <Footer />
        <BackToTop />
        <Analytics />
        <PageTracker />
      </body>
    </html>
  );
}
