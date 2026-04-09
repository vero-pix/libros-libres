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
  title: "Libros Libres — Donde los libros encuentran nuevos lectores",
  description:
    "Compra, vende y presta libros cerca de ti. Publica gratis, paga seguro con MercadoPago, recibe en tu casa.",
  keywords: ["libros", "segunda mano", "marketplace", "préstamo", "Chile"],
  openGraph: {
    title: "Libros Libres — Donde los libros encuentran nuevos lectores",
    description:
      "Compra, vende y presta libros cerca de ti. Publica gratis, paga seguro con MercadoPago, recibe en tu casa.",
    url: "https://tuslibros.cl",
    siteName: "Libros Libres",
    type: "website",
    locale: "es_CL",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Libros Libres — Donde los libros encuentran nuevos lectores",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Libros Libres — Donde los libros encuentran nuevos lectores",
    description:
      "Compra, vende y presta libros cerca de ti. Publica gratis, paga seguro con MercadoPago, recibe en tu casa.",
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
        <meta name="apple-mobile-web-app-title" content="Libros Libres" />
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
              name: "Libros Libres",
              alternateName: "tuslibros.cl",
              url: "https://tuslibros.cl",
              logo: "https://tuslibros.cl/og-image.png",
              description: "Compra, vende y presta libros cerca de ti. El Uber de los libros.",
              sameAs: ["https://www.linkedin.com/in/economista-veronica-velasquez/"],
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
