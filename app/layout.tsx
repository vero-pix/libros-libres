import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Footer from "@/components/ui/Footer";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://tuslibros.cl"),
  title: "Libros Libres — Marketplace de libros de segunda mano",
  description:
    "Compra, vende y presta libros usados cerca de ti. Publica gratis, paga seguro con MercadoPago, recibe en tu casa.",
  keywords: ["libros", "segunda mano", "marketplace", "préstamo", "Chile"],
  themeColor: "#2d3436",
  openGraph: {
    title: "Libros Libres — Marketplace de libros de segunda mano",
    description:
      "Compra, vende y presta libros usados cerca de ti. Publica gratis, paga seguro con MercadoPago, recibe en tu casa.",
    url: "https://tuslibros.cl",
    siteName: "Libros Libres",
    type: "website",
    locale: "es_CL",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Libros Libres — Marketplace de libros de segunda mano en Chile",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Libros Libres — Marketplace de libros de segunda mano",
    description:
      "Compra, vende y presta libros usados cerca de ti. Publica gratis, paga seguro con MercadoPago, recibe en tu casa.",
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
      <body className={`${inter.variable} antialiased flex flex-col min-h-screen`}>
        {children}
        <Footer />
      </body>
    </html>
  );
}
