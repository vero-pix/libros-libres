import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Vender Libros Usados en Chile | tuslibros.cl",
  description:
    "¿Quieres vender libros usados en Chile? Publica en 10 segundos. Escanea el código de barras, ponle precio y listo. Pago seguro con MercadoPago y envío a todo el país.",
  alternates: { canonical: "https://tuslibros.cl/vender" },
};

const steps = [
  {
    emoji: "📱",
    title: "Escanea el código de barras",
    description:
      "Apunta la cámara al código de barras del libro. Título, autor y portada se completan solos.",
  },
  {
    emoji: "💰",
    title: "Ponle precio",
    description:
      "Elige cuánto cobrar y si lo vendes, arriendas o ambas. Puedes agregar fotos reales si quieres.",
  },
  {
    emoji: "✅",
    title: "Listo, publicado",
    description:
      "Tu libro aparece en el catálogo con portada, descripción y tu tienda personal. Los compradores te encuentran.",
  },
];

const benefits = [
  {
    emoji: "🔒",
    title: "Pago seguro",
    description:
      "MercadoPago divide el pago: el dinero llega directo a tu cuenta, sin intermediarios.",
  },
  {
    emoji: "📦",
    title: "Envío a todo Chile",
    description:
      "Cotiza entre Starken, Chilexpress, Blue Express y más. El comprador elige y paga el envío.",
  },
  {
    emoji: "🏪",
    title: "Tu tienda propia",
    description:
      "Cada vendedor tiene su URL única: tuslibros.cl/libro/tu-nombre/titulo. Comparte tu catálogo.",
  },
  {
    emoji: "💬",
    title: "Mensajería directa",
    description:
      "Conversa con compradores dentro de la plataforma. Sin dar tu teléfono ni tu email.",
  },
  {
    emoji: "📊",
    title: "Carritos en tiempo real",
    description:
      "Ve quién tiene tus libros en el carrito. Rescata ventas con un mensaje directo.",
  },
  {
    emoji: "🤝",
    title: "Entrega presencial",
    description:
      "Para compradores cerca de ti, coordina por WhatsApp sin pagar comisión de envío.",
  },
];

export default function VenderPage() {
  return (
    <div className="min-h-screen bg-cream">
      {/* Hero */}
      <section className="relative overflow-hidden text-white">
        {/* Background image */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/images/hero-libros.jpg')" }}
        />
        {/* Dark overlay for readability */}
        <div className="absolute inset-0 bg-navy/75" />

        <div className="relative max-w-4xl mx-auto px-4 py-20 sm:py-28 text-center">
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight animate-fade-in-up">
            Vende tus libros usados<br />
            <span className="text-brand-400">en 10 segundos</span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-white/80 max-w-2xl mx-auto animate-fade-in-up" style={{ animationDelay: "0.15s" }}>
            Solo escanea el código de barras. Sin fotos perfectas. ¡Listo!
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
            <Link
              href="/publish"
              className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-semibold px-8 py-3.5 rounded-xl text-lg transition-colors duration-200 shadow-lg shadow-brand-500/20"
            >
              Publicar ahora
            </Link>
            <Link
              href="/como-funciona"
              className="inline-flex items-center gap-2 text-white/80 hover:text-white font-medium transition-colors duration-200"
            >
              ¿Cómo funciona? →
            </Link>
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="max-w-4xl mx-auto px-4 py-16">
        <h2 className="font-display text-2xl sm:text-3xl font-bold text-ink text-center mb-12">
          Tres pasos. Cero complicaciones.
        </h2>

        <div className="grid sm:grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <div
              key={i}
              className="relative bg-white rounded-2xl border border-cream-dark/40 p-6 text-center transition-all duration-300 hover:shadow-md hover:-translate-y-1"
            >
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-500 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">
                {i + 1}
              </div>
              <div className="text-4xl mb-4 mt-2">{step.emoji}</div>
              <h3 className="font-display text-lg font-bold text-ink mb-2">
                {step.title}
              </h3>
              <p className="text-sm text-ink-muted">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Benefits grid */}
      <section className="bg-cream-warm border-y border-cream-dark/30">
        <div className="max-w-5xl mx-auto px-4 py-16">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-ink text-center mb-4">
            Todo lo que necesitas para vender
          </h2>
          <p className="text-ink-muted text-center mb-12 max-w-xl mx-auto">
            Sin suscripción, sin costos fijos. Solo pagas una pequeña comisión cuando vendes.
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((b, i) => (
              <div
                key={i}
                className="bg-white rounded-xl border border-cream-dark/30 p-5 transition-all duration-300 hover:shadow-sm"
              >
                <div className="text-2xl mb-3">{b.emoji}</div>
                <h3 className="font-semibold text-ink mb-1">{b.title}</h3>
                <p className="text-sm text-ink-muted">{b.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA bottom */}
      <section className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h2 className="font-display text-2xl sm:text-3xl font-bold text-ink mb-4">
          ¿Tienes libros juntando polvo?
        </h2>
        <p className="text-ink-muted mb-8 max-w-lg mx-auto">
          Alguien los está buscando ahora mismo. Dale la oportunidad de que te encuentren.
        </p>
        <Link
          href="/publish"
          className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-semibold px-8 py-3.5 rounded-xl text-lg transition-colors duration-200 shadow-lg shadow-brand-500/20"
        >
          Publicar mi primer libro
        </Link>
      </section>
    </div>
  );
}
