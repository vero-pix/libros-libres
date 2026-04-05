import Image from "next/image";
import Link from "next/link";

export const metadata = {
  title: "Cómo Funciona — Libros Libres",
};

const buyerSteps = [
  { number: 1, icon: "🔍", title: "Busca el libro", description: "Encuentra el libro que necesitas en el mapa interactivo o usa la barra de búsqueda." },
  { number: 2, icon: "💬", title: "Contacta al vendedor", description: "Escríbele directamente por WhatsApp para consultar sobre el libro." },
  { number: 3, icon: "🤝", title: "Coordina la entrega", description: "Acuerda el lugar y hora de retiro directamente con el vendedor." },
];

const sellerSteps = [
  { number: 1, icon: "📱", title: "Escanea el código de barras", description: "Usa la cámara de tu celular para escanear el ISBN de tu libro." },
  { number: 2, icon: "✏️", title: "Completa precio y condición", description: "Agrega el precio que quieres y selecciona el estado del libro." },
  { number: 3, icon: "📍", title: "Aparece en el mapa", description: "Tu libro se publica instantáneamente y compradores cercanos lo pueden ver." },
];

const benefits = [
  { icon: "✅", text: "Publicar es gratis" },
  { icon: "✅", text: "Sin comisiones en ventas directas" },
  { icon: "✅", text: "Llega a compradores cercanos" },
];

export default function ComoFuncionaPage() {
  return (
    <div className="min-h-screen bg-gray-50">

      {/* Hero */}
      <div className="relative h-64 overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=1200&q=80"
          alt="Lectura"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/60" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
          <h1 className="text-4xl font-bold text-white mb-2">Cómo Funciona</h1>
          <p className="text-gray-200 text-lg max-w-xl">Compra y vende libros usados cerca de ti</p>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 py-12">
        {/* Buyers */}
        <section className="mb-14">
          <h2 className="text-2xl font-bold text-[#2d3436] mb-6 border-b-2 border-[#d4a017] pb-2 inline-block">
            Para compradores
          </h2>
          <div className="space-y-5">
            {buyerSteps.map((step) => (
              <div key={step.number} className="flex items-start gap-4 bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[#d4a017] text-white flex items-center justify-center text-xl font-bold">
                  {step.number}
                </div>
                <div>
                  <h3 className="font-semibold text-[#2d3436] text-lg mb-1">
                    <span className="mr-2">{step.icon}</span>{step.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Sellers */}
        <section className="mb-14">
          <h2 className="text-2xl font-bold text-[#2d3436] mb-6 border-b-2 border-[#d4a017] pb-2 inline-block">
            Para vendedores
          </h2>
          <div className="space-y-5">
            {sellerSteps.map((step) => (
              <div key={step.number} className="flex items-start gap-4 bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[#2d3436] text-white flex items-center justify-center text-xl font-bold">
                  {step.number}
                </div>
                <div>
                  <h3 className="font-semibold text-[#2d3436] text-lg mb-1">
                    <span className="mr-2">{step.icon}</span>{step.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Benefits */}
        <section className="mb-14">
          <div className="bg-[#2d3436] rounded-xl p-8 text-center">
            <h2 className="text-2xl font-bold text-white mb-6">Beneficios</h2>
            <div className="flex flex-col sm:flex-row justify-center gap-6">
              {benefits.map((b) => (
                <div key={b.text} className="bg-white/10 rounded-lg px-6 py-4">
                  <p className="text-white font-medium text-lg">
                    <span className="mr-2">{b.icon}</span>{b.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <div className="text-center">
          <p className="text-gray-500 mb-2">¿Tienes dudas?</p>
          <Link href="/faq" className="text-[#2b6cb0] font-semibold hover:underline text-lg">
            Visita nuestras Preguntas Frecuentes &rarr;
          </Link>
        </div>
      </main>
    </div>
  );
}
