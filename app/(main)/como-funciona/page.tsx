// import Image from "next/image"; // ya no se usa: encabezado sin foto stock (20 jul 2026)
import Link from "next/link";

export const metadata = {
  // Esta página ya rankea en posición 8 para "dónde vender libros usados" (151
  // impresiones) pero con CTR 1.3%: el título decía "Cómo funciona", que no
  // responde la pregunta que la persona escribió. Ahora la responde literal.
  title: "Dónde vender libros usados en Chile — cómo funciona",
  description:
    "Dónde y cómo vender tus libros usados en Chile: publica gratis en 10 segundos, pon tu precio y cobra por MercadoPago. Courier o retiro en mano.",
  alternates: { canonical: "https://tuslibros.cl/como-funciona" },
};

const directSteps = [
  { number: 1, icon: "🔍", title: "Encuentra tu libro", description: "Busca en el catálogo, mapa o barra de búsqueda por título, autor o categoría." },
  { number: 2, icon: "💬", title: "Contacta al vendedor", description: "Escríbele directamente por WhatsApp para consultar sobre el libro." },
  { number: 3, icon: "🤝", title: "Coordina la entrega", description: "Acuerda el lugar y hora de retiro directamente con el vendedor." },
];

const mpSteps = [
  { number: 1, icon: "🔍", title: "Encuentra tu libro", description: "Busca en el catálogo por categoría, precio o cercanía." },
  { number: 2, icon: "💳", title: "Paga con MercadoPago", description: "Compra directo desde la publicación, con tu tarjeta y con registro de los dos lados." },
  { number: 3, icon: "📦", title: "Elige el despacho", description: "Retiro en persona, o envío por courier cuando esté disponible." },
  { number: 4, icon: "✅", title: "Recibe y confirma", description: "El vendedor recibe su pago automáticamente al confirmar la entrega." },
];

const sellerSteps = [
  { number: 1, icon: "📱", title: "Escanea el código de barras", description: "Usa la cámara de tu celular para escanear el ISBN de tu libro." },
  { number: 2, icon: "✏️", title: "Completa precio y condición", description: "Agrega el precio que quieres y selecciona el estado del libro." },
  { number: 3, icon: "📍", title: "Aparece en el catálogo", description: "Tu libro se publica al instante. Los compradores te contactan por WhatsApp o compran directo con MercadoPago." },
];

const benefits = [
  { icon: "✅", text: "Publicar siempre es gratis" },
  { icon: "✅", text: "Cero comisión si coordinas por WhatsApp" },
  { icon: "✅", text: "Pago seguro con MercadoPago (opcional)" },
  { icon: "✅", text: "Despacho a todo Chile por courier" },
  { icon: "✅", text: "Devolución en 7 días en compras con MercadoPago" },
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

      {/* Hero — encabezado limpio de marca (sin foto stock, mejor contraste) */}
      <div className="bg-cream-warm border-b border-cream-dark">
        <div className="max-w-3xl mx-auto px-4 py-16 sm:py-20 text-center">
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-ink mb-3">Cómo funciona</h1>
          <p className="text-ink-muted text-lg max-w-xl mx-auto">Cómo se compra acá, cómo se vende, y qué cobro por cada cosa</p>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 py-12">
        {/* Compra con MercadoPago — primero, porque es la vía principal.
            Antes abría "Compra directa" y la presentaba como mi favorita,
            cuando desde el 25 de agosto el sitio esconde el WhatsApp del
            vendedor que tiene MercadoPago: la página que explica cómo funciona
            el sitio recomendaba el camino que el sitio había cerrado. */}
        {/* El id es el destino del sello "Pago protegido" del hero: la promesa de
            la portada tiene que poder comprobarse en una página del sitio. */}
        <section id="pago-protegido" className="mb-14 scroll-mt-32">
          <h2 className="text-2xl font-bold text-ink mb-2 border-b-2 border-brand-600 pb-2 inline-block">
            Compra con pago seguro
          </h2>
          <p className="text-ink-muted mb-6"><strong>Es la forma normal de comprar acá.</strong> Pagas con <a href="https://www.mercadopago.cl" target="_blank" rel="noopener noreferrer" className="text-brand-600 font-semibold hover:underline">MercadoPago</a> desde la publicación y el libro te llega por courier — así puedes comprarle a alguien de otra región o de una comuna lejana, sin tener que ir a buscarlo. Pagas con tu tarjeta a través de MercadoPago —no en efectivo a un desconocido— y queda registro de la compra para los dos. Si algo sale mal tienes <Link href="/devoluciones" className="text-brand-600 font-semibold hover:underline">7 días para devolverlo</Link>: si llega dañado, si es un libro distinto al publicado, o si viene en peor estado del que decía la ficha. Por esta vía cobro un 8% del precio del libro, y con eso pago la pasarela, el servidor y las horas.</p>
          <p className="text-ink-muted mb-6">Algunos vendedores —yo entre ellos— además cobran por <strong>transferencia</strong>. Cuando es el caso, la ficha te muestra los datos de la cuenta al momento de comprar.</p>
          <div className="space-y-5">
            {mpSteps.map((step) => <StepCard key={step.number} step={step} />)}
          </div>
        </section>

        {/* Compra directa */}
        <section className="mb-14">
          <h2 className="text-2xl font-bold text-ink mb-2 border-b-2 border-brand-600 pb-2 inline-block">
            Trato directo, cuando aparece
          </h2>
          <p className="text-ink-muted mb-6"><strong>Solo en las fichas de vendedores que todavía no conectan MercadoPago.</strong> Ahí verás su WhatsApp: se hablan, se ponen de acuerdo, se juntan, y yo no me meto ni cobro nada. Lo tuve un tiempo en todas las fichas y pasó lo previsible — la conversación se iba a WhatsApp, la venta se cerraba afuera y el sitio se quedaba sin saber si había llegado el libro. Por eso hoy, cuando el vendedor puede cobrar por acá, el botón de comprar va primero.</p>
          <div className="space-y-5">
            {directSteps.map((step) => <StepCard key={step.number} step={step} />)}
          </div>
        </section>

        {/* Vendedores */}
        <section className="mb-14">
          <h2 className="text-2xl font-bold text-ink mb-2 border-b-2 border-brand-600 pb-2 inline-block">
            Para vendedores
          </h2>
          <p className="text-ink-muted mb-6">Publicar es gratis y no tiene vuelta. Y si la venta se paga con MercadoPago, no tienes que ir a ninguna parte: <strong>el courier pasa a buscar el paquete a tu casa</strong> y <strong>no le pagas nada</strong> — el envío se factura a tuslibros.cl a fin de mes. Solo necesitas tener el paquete listo dentro de los 2 días hábiles siguientes a la venta. <Link href="/como-despachar" className="text-brand-600 font-semibold hover:underline">Te explico el despacho paso a paso</Link>.</p>
          <div className="space-y-5">
            {sellerSteps.map((step) => <StepCard key={step.number} step={step} />)}
          </div>
        </section>

        {/* Benefits */}
        <section className="mb-14">
          <div className="bg-cream-warm rounded-xl p-8 text-center border border-cream-dark">
            <h2 className="text-2xl font-bold text-ink mb-6">Las reglas de la casa</h2>
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
        <div className="text-center space-y-4">
          <div>
            <Link href="/search" className="inline-block bg-brand-600 hover:bg-brand-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors mr-3">
              Explorar el catálogo
            </Link>
            <Link href="/publish" className="inline-block border-2 border-brand-600 text-brand-600 hover:bg-brand-600 hover:text-white font-semibold px-6 py-3 rounded-xl transition-colors">
              Publicar un libro
            </Link>
          </div>
          <p className="text-ink-muted">¿Tienes dudas?</p>
          <Link href="/ayuda" className="text-brand-600 font-semibold hover:underline text-lg">
            Visita el centro de ayuda &rarr;
          </Link>
        </div>
      </main>
    </div>
  );
}
