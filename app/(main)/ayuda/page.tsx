import Link from "next/link";
import AyudaNav from "@/components/ayuda/AyudaNav";
import AyudaContacto from "@/components/ayuda/AyudaContacto";

export const metadata = {
  title: "Centro de ayuda",
  description:
    "Cómo vender y comprar libros usados en tuslibros.cl: publicar, cobrar por MercadoPago, despacho a domicilio, entrega en persona y qué hacer si algo falla.",
  alternates: { canonical: "https://tuslibros.cl/ayuda" },
};

const caminos = [
  {
    href: "/ayuda/vender",
    icon: "📚",
    title: "Quiero vender",
    body: "Publicar es gratis, cobras por MercadoPago y despachas dejando el paquete en una sucursal del courier.",
  },
  {
    href: "/ayuda/comprar",
    icon: "🛒",
    title: "Quiero comprar",
    body: "Pagas en línea con protección de MercadoPago y el libro llega a tu casa o lo retiras en persona.",
  },
  {
    href: "/ayuda/preguntas",
    icon: "❓",
    title: "Preguntas frecuentes",
    body: "Comisión, envíos, pagos, WhatsApp de los vendedores, libros subrayados y cómo darse de baja.",
  },
];

export default function AyudaPage() {
  return (
    <div className="min-h-screen bg-cream">
      <div className="bg-cream-warm border-b border-cream-dark">
        <div className="max-w-3xl mx-auto px-4 py-16 sm:py-20 text-center">
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-ink mb-3">¿Vendes o compras?</h1>
          <p className="text-ink-muted text-lg max-w-xl mx-auto">Dos caminos, un solo lugar para resolver dudas.</p>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 py-12">
        <AyudaNav actual="/ayuda" />

        <div className="space-y-5">
          {caminos.map((c) => (
            <Link
              key={c.href}
              href={c.href}
              className="flex items-start gap-4 bg-white rounded-xl shadow-sm border border-cream-dark p-5 hover:border-brand-600 transition-colors group"
            >
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-brand-600 text-white flex items-center justify-center text-xl">
                {c.icon}
              </div>
              <div>
                <h2 className="font-semibold text-ink text-lg mb-1 group-hover:text-brand-600 transition-colors">
                  {c.title} <span aria-hidden>→</span>
                </h2>
                <p className="text-ink-muted leading-relaxed">{c.body}</p>
              </div>
            </Link>
          ))}
        </div>

        <AyudaContacto texto="Hola, tengo una duda sobre tuslibros.cl" />
      </main>
    </div>
  );
}
