import Link from "next/link";
import RequestsRow from "@/components/home/RequestsRow";
import type { Metadata } from "next";

export const metadata: Metadata = {
  // 27-09-2026: título y descripción apuntan a las búsquedas de quien quiere
  // vender y hoy nos encuentra en la página 2 de Google (Search Console, 28
  // días): "donde vender libros usados" (107 impresiones, pos. 14,7), "vender
  // libros usados" (79, pos. 14,6), "quiero vender libros usados" (57, pos. 14,8).
  title: "Dónde vender libros usados en Chile — publica gratis",
  description:
    "¿Dónde vender libros usados en Chile? Publica gratis: escanea el código o sácale una foto, pon tu precio y cobra por MercadoPago o transferencia. 8% solo si vendes acá.",
  alternates: { canonical: "https://tuslibros.cl/vender" },
  keywords: [
    "venta de libros",
    "venta de libros usados",
    "venta de libros usados Chile",
    "vender libros usados",
    "vender libros usados Chile",
    "vender libros",
    "donde vender libros usados",
    "quiero vender libros usados",
    "compro libros usados",
  ],
};

const steps = [
  {
    emoji: "📱",
    title: "Escanea el código o sácale foto",
    description:
      "Apunta la cámara al código de barras. Si el libro no tiene, sácale una foto a la portada: título, autor y editorial se completan solos.",
  },
  {
    emoji: "💰",
    title: "Ponle precio",
    description:
      "Elige cuánto cobrar por tu libro. Puedes agregar fotos reales si quieres.",
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
    title: "Cobras como prefieras",
    description:
      "Por MercadoPago, directo a tu cuenta, o por transferencia: el comprador te paga a ti.",
  },
  {
    emoji: "📦",
    // Sin Shipit desde el 15-09-2026: despacha el vendedor (lib/shipping/coordinado.ts).
    title: "Envío a todo Chile",
    description:
      "Tú despachas por el courier que quieras. El comprador paga una tarifa fija por zona, que te llega junto con el pago.",
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
    // Hasta el 27-09 decía "coordina por WhatsApp sin pagar comisión": es la
    // frase que se retiró del sitio el 25-08 porque enseñaba a vender por fuera.
    title: "Entrega en persona",
    description:
      "Si el comprador está cerca, coordinan el retiro y no hay envío que pagar.",
  },
];

const faqItems = [
  {
    q: "¿Dónde puedo vender libros usados en Chile?",
    a: "En tuslibros.cl puedes publicar tus libros usados gratis y llegar a compradores en todo Chile. Escaneas el código de barras, pones el precio y tu libro aparece en el catálogo al instante con portada, descripción y tu tienda personal.",
  },
  {
    // Para quien busca "compro libros usados" o "compro libros usados a domicilio"
    // (119 impresiones en 28 días): quiere que alguien le compre la biblioteca.
    q: "¿Ustedes compran libros usados?",
    a: "No los compro yo: los vendes tú, directo a quien los está buscando y al precio que tú pones. Suele rendir más que venderle la biblioteca a una librería de usados, que tiene que comprar barato para poder revender. Tampoco hay retiro a domicilio: tú decides si entregas en persona o despachas.",
  },
  {
    q: "¿Cuánto cuesta publicar?",
    a: "Cero. Siempre. Publica uno o mil, da igual — es gratis y va a seguir siendo gratis.",
  },
  {
    q: "¿Cuándo se aplican comisiones?",
    a: "Publicar es gratis y no hay mensualidad. Cobro 8% del precio del libro, igual para todos, y solo cuando la venta se cierra acá. Con eso pago la pasarela, el servidor y las horas.",
  },
  {
    q: "¿Qué libros se venden mejor?",
    a: "Los libros raros, descatalogados y de autores chilenos tienen alta demanda. También las series completas y libros escolares en temporada. El precio es clave: entre 40% y 60% menos que en librerías nuevas convierte muy bien.",
  },
  {
    // Traída de /vender-libros-usados al consolidar las dos páginas (31 jul 2026).
    // La cifra de vendedores está verificada contra la BD (listings en status
    // completed): el más activo supera los 70 libros vendidos.
    q: "¿Cuánto puedo ganar vendiendo libros usados?",
    a: "Depende del libro y del precio que le pongas. Una novela bien conservada entre $6.000 y $12.000 se mueve rápido; un libro raro o técnico puede valer entre $20.000 y $80.000. La receta que funciona es precio 40% a 60% bajo el valor nuevo y fotos reales del ejemplar. Hay vendedores en tuslibros.cl que ya superaron los 70 libros vendidos.",
  },
  {
    q: "¿Puedo publicar muchos libros a la vez?",
    a: "Sí, todos los que quieras. Si tienes una biblioteca grande, también tenemos un importador por CSV para subir todo de una sola vez.",
  },
  {
    q: "¿Necesito facturar para vender en tuslibros.cl?",
    a: "No. Tuslibros.cl es una plataforma para personas que venden sus propios libros, no un negocio formal. No necesitas inicio de actividades ni boleta electrónica para publicar.",
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
            Vende tus libros usados{" "}
            <br />
            <span className="text-brand-400">en Chile</span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-white/80 max-w-2xl mx-auto animate-fade-in-up" style={{ animationDelay: "0.15s" }}>
            Publica en 10 segundos. Escanea el código o sácale una foto, ponle precio y listo.
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
          <p className="mt-6 text-sm text-white/60 animate-fade-in-up" style={{ animationDelay: "0.45s" }}>
            ¿Tienes libros antiguos, primeras ediciones o de colección?{" "}
            <Link href="/libros-antiguos" className="underline underline-offset-2 hover:text-white transition-colors">
              Acá se venden mejor →
            </Link>
          </p>
        </div>
      </section>

      {/* Steps */}
      <section className="max-w-4xl mx-auto px-4 py-16 pb-0">
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

      <div className="mt-16">
        <RequestsRow />
      </div>

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

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-4 py-16">
        <h2 className="font-display text-2xl sm:text-3xl font-bold text-ink text-center mb-10">
          Preguntas frecuentes
        </h2>
        <div className="space-y-4">
          {faqItems.map((item) => (
            <details key={item.q} className="group bg-white border border-cream-dark/30 rounded-xl p-5 cursor-pointer">
              <summary className="font-semibold text-ink list-none flex items-center justify-between gap-4">
                {item.q}
                <span className="text-brand-500 text-lg group-open:rotate-45 transition-transform duration-200 shrink-0">+</span>
              </summary>
              <p className="mt-3 text-sm text-ink-muted leading-relaxed">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Testimonios de vendedores */}
      <section className="max-w-4xl mx-auto px-4 py-16">
        <h2 className="font-display text-2xl sm:text-3xl font-bold text-ink text-center mb-10">
          Vendedores que ya circulan sus libros
        </h2>
        <div className="max-w-2xl mx-auto">
          {[
            // 18-09-2026: Carlos de CIMLibros mandó su recomendación por escrito.
            // Va TAL CUAL la escribió él, signos incluidos.
            //
            // Las otras dos citas que había acá —atribuidas a Libros De La
            // Buhardilla y a María Soledad, con nombre y comuna— nadie las
            // dijo: estaban escritas por el sitio y puestas en su boca. Fuera.
            // Además las cifras no eran ciertas: decía 78 libros de CIMLibros
            // (tiene 201), 37 de Buhardilla (260) y 20 de María Soledad, que
            // tiene 4 publicados y ninguna venta.
            {
              name: "Carlos, CIMLibros",
              location: "La Florida, Santiago",
              books: "201 libros publicados",
              quote: "Tus Libros ¡Funciona!, se generan contactos con gente que aprecia los libros y ama la lectura, la experiencia es fantástica y recomiendo esta página con un entusiasmo rotundo",
            },
          ].map((t) => (
            <blockquote
              key={t.name}
              className="relative bg-white border border-cream-dark/30 rounded-2xl px-7 py-7 sm:px-9 sm:py-8"
            >
              <span aria-hidden className="absolute -top-3 left-6 text-5xl font-serif text-brand-400 leading-none select-none">&ldquo;</span>
              <p className="font-serif italic text-base sm:text-lg text-ink leading-relaxed mb-4">{t.quote}</p>
              <footer className="text-xs text-ink-muted">
                <span className="font-semibold text-ink not-italic">{t.name}</span>
                <span className="mx-1.5">·</span>{t.location}
                <span className="mx-1.5">·</span>{t.books}
              </footer>
            </blockquote>
          ))}
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

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqItems.map((item) => ({
              "@type": "Question",
              name: item.q,
              acceptedAnswer: { "@type": "Answer", text: item.a },
            })),
          }),
        }}
      />
    </div>
  );
}
