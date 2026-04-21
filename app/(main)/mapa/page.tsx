import type { Metadata } from "next";
import MapaClient from "./MapaClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Mapa de libros usados en Chile",
  description:
    "Explora en el mapa los libros usados disponibles cerca de ti en Chile. Compra, arrienda o retira en mano. Santiago, regiones y todo el país.",
  openGraph: {
    title: "Mapa de libros usados en Chile — tuslibros.cl",
    description:
      "Los libros más cercanos a ti aparecen primero. Retiras en mano o pides despacho por courier.",
    url: "https://tuslibros.cl/mapa",
  },
};

export default function MapaPage() {
  return (
    <div className="flex flex-col h-screen">
      <h1 className="sr-only">Mapa de libros usados en Chile — tuslibros.cl</h1>
      <MapaClient />
    </div>
  );
}
