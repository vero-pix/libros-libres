import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Footer from "@/components/ui/Footer";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Libros Libres — Marketplace de libros de segunda mano",
  description:
    "Compra, vende y presta libros de segunda mano cerca de ti. Encuentra libros geolocalizados en tu ciudad.",
  keywords: ["libros", "segunda mano", "marketplace", "préstamo", "Chile"],
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
