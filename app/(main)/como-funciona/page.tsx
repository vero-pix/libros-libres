import Image from "next/image";
import Link from "next/link";

export const metadata = {
  title: "Cómo Funciona — Libros Libres",
};

const directSteps = [
  { number: 1, icon: "🔍", title: "Encuentra tu libro", description: "Busca en el catálogo, mapa o barra de búsqueda por título, autor o categoría." },
  { number: 2, icon: "💬", title: "Contacta al vendedor", description: "Escríbele directamente por WhatsApp para consultar sobre el libro." },
  { number: 3, icon: "🤝", title: "Coordina la entrega", description: "Acuerda el lugar y hora de retiro directamente con el vendedor." },
];

const mpSteps = [
  { number: 1, icon: "🔍", title: "Encuentra tu libro", description: "Busca en el catálogo por categoría, precio o cercanía." },
  { number: 2, icon: "💳", title: "Paga con MercadoPago", description: "Compra directo desde la publicación. Tu dinero queda protegido." },
  { number: 3, icon: "📦", title: "Elige el despacho", description: "Retiro en persona, o envío por courier cuando esté disponible." },
  { number: 4, icon: "✅", title: "Recibe y confirma", description: "El vendedor recibe su pago automáticamente al confirmar la entrega." },
];

const rentalSteps = [
  { number: 1, icon: "📚", title: "Busca libros para arriendo", description: "Filtra por modalidad «Arriendo» en el catálogo." },
  { number: 2, icon: "📅", title: "Elige plazo y paga", description: "7, 14 o 30 días. Pagas arriendo + garantía reembolsable con MercadoPago." },
  { number: 3, icon: "📖", title: "Lee y disfruta", description: "Recibe el libro por courier o retíralo en persona." },
  { number: 4, icon: "🔄", title: "Devuelve y recupera tu garantía", description: "Devuelves en buen estado, tu garantía vuelve completa a tu cuenta." },
];

const sellerSteps = [
  { number: 1, icon: "📱", title: "Escanea el código de barras", description: "Usa la cámara de tu celular para escanear el ISBN de tu libro." },
  { number: 2, icon: "✏️", title: "Completa precio y condición", description: "Agrega el precio que quieres y selecciona el estado del libro." },
  { number: 3, icon: "📍", title: "Aparece en el catálogo", description: "Tu libro se publica al instante. Los compradores te contactan por WhatsApp o compran directo con MercadoPago." },
];

const benefits = [
  { icon: "✅", text: "Publicar siempre es gratis" },
  { icon: "✅", text: "Sin comisiones en ventas por WhatsApp" },
  { icon: "✅", text: "Pago seguro con MercadoPago" },
  { icon: "✅", text: "Despacho a domicilio (próximamente)" },
  { icon: "✅", text: "Arriendo de libros con garantía reembolsable" },
];

function StepCard({ step }: { step: { number: number; icon: string; title: string; description: string } }) {
  return (
    <div className="flex items-start gap-4 bg-white rounded-xl shadow-sm border border-cream-dark p-5">
      <div className="flex-shrink-0 w-12 h-12 rounded-full bg-brand-600 text-white flex items-center justify-center text-xl font-bold">
        {step.number}
      </div>
      <div>
        <h3 className="font-semibold text-ink text-lg mb-1">
          <span className="mr-2">{step.icon}</span>{step.title}
        </h3>
        <p className="text-ink-muted leading-relaxed">{step.description}</p>
      </div>
    </div>
  );
}

export default function ComoFuncionaPage() {
  return (
    <div className="min-h-screen bg-cream">

      {/* Hero */}
      <div className="relative h-64 overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=1200&q=80"
          alt="Lectura"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-cream/70" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
          <h1 className="text-4xl font-bold text-ink mb-2">Cómo Funciona</h1>
          <p className="text-ink-muted text-lg max-w-xl">Tres formas de comprar libros, una de publicar</p>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 py-12">
        {/* Compra directa */}
        <section className="mb-14">
          <h2 className="text-2xl font-bold text-ink mb-2 border-b-2 border-brand-600 pb-2 inline-block">
            Compra directa
          </h2>
          <p className="text-ink-muted mb-6">El modo más simple. Tú y el vendedor coordinan todo por WhatsApp, sin costo.</p>
          <div className="space-y-5">
            {directSteps.map((step) => <StepCard key={step.number} step={step} />)}
          </div>
        </section>

        {/* Compra con MercadoPago */}
        <section className="mb-14">
          <h2 className="text-2xl font-bold text-ink mb-2 border-b-2 border-brand-600 pb-2 inline-block">
            Compra con pago seguro
          </h2>
          <p className="text-ink-muted mb-6">Paga con MercadoPago directo desde la publicación. Tu dinero queda protegido.</p>
          <div className="space-y-5">
            {mpSteps.map((step) => <StepCard key={step.number} step={step} />)}
          </div>
        </section>

        {/* Arriendo */}
        <section className="mb-14">
          <h2 className="text-2xl font-bold text-ink mb-2 border-b-2 border-brand-600 pb-2 inline-block">
            Arriendo de libros
          </h2>
          <p className="text-ink-muted mb-6">Lee lo que quieras sin comprarlo. Devuelve y recupera tu garantía.</p>
          <div className="space-y-5">
            {rentalSteps.map((step) => <StepCard key={step.number} step={step} />)}
          </div>
        </section>

        {/* Vendedores */}
        <section className="mb-14">
          <h2 className="text-2xl font-bold text-ink mb-6 border-b-2 border-brand-600 pb-2 inline-block">
            Para vendedores
          </h2>
          <div className="space-y-5">
            {sellerSteps.map((step) => <StepCard key={step.number} step={step} />)}
          </div>
        </section>

        {/* Benefits */}
        <section className="mb-14">
          <div className="bg-cream-warm rounded-xl p-8 text-center border border-cream-dark">
            <h2 className="text-2xl font-bold text-ink mb-6">Beneficios</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {benefits.map((b) => (
                <div key={b.text} className="bg-brand-50 rounded-lg px-5 py-4 border border-brand-200">
                  <p className="text-ink font-medium text-sm sm:text-base">
                    <span className="mr-2">{b.icon}</span>{b.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <div className="text-center">
          <p className="text-ink-muted mb-2">¿Tienes dudas?</p>
          <Link href="/faq" className="text-brand-600 font-semibold hover:underline text-lg">
            Visita nuestras Preguntas Frecuentes &rarr;
          </Link>
        </div>
      </main>
    </div>
  );
}
