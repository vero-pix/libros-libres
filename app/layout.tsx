import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Libros Libres — Marketplace de libros de segunda mano",
  description:
    "Compra, vende y presta libros de segunda mano cerca tuyo. Encontrá libros geolocalizados en tu ciudad.",
  keywords: ["libros", "segunda mano", "marketplace", "préstamo", "Argentina"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${inter.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
