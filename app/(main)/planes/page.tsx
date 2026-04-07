import Link from "next/link";

export const metadata = {
  title: "Planes — tuslibros.cl",
  description: "Elige tu plan de vendedor y reduce tus comisiones",
};

const PLANS = [
  {
    name: "Libre",
    price: "Gratis",
    priceNote: "sin costo mensual",
    commissions: { sale: "8%", rental: "10%" },
    features: [
      "Publica libros sin límite",
      "Recibe pagos con MercadoPago",
      "Tienda de vendedor personalizada",
      "Aparece en el mapa y catálogo",
      "WhatsApp directo con compradores",
    ],
    cta: "Empezar gratis",
    href: "/register",
    highlighted: false,
  },
  {
    name: "Librero",
    price: "$9.990",
    priceNote: "/mes",
    commissions: { sale: "5%", rental: "7%" },
    features: [
      "Todo lo de Libre",
      "Comisiones reducidas",
      "Prioridad en resultados de búsqueda",
      "Badge de vendedor verificado",
      "Soporte prioritario por WhatsApp",
    ],
    cta: "Elegir Librero",
    href: "/perfil",
    highlighted: true,
  },
  {
    name: "Librería",
    price: "$29.990",
    priceNote: "/mes",
    commissions: { sale: "3%", rental: "5%" },
    features: [
      "Todo lo de Librero",
      "Comisiones mínimas",
      "Carga masiva de libros (Excel)",
      "Panel de analytics avanzado",
      "Soporte dedicado",
      "Logo personalizado en tienda",
    ],
    cta: "Elegir Librería",
    href: "/perfil",
    highlighted: false,
  },
];

export default function PlanesPage() {
  return (
    <div className="min-h-screen bg-cream">
      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <p className="text-xs font-medium tracking-[0.3em] uppercase text-brand-600 mb-3">
            Planes
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-ink">
            Dos formas de vender, tú eliges
          </h1>
          <p className="text-ink-muted mt-3 max-w-lg mx-auto">
            Publica gratis y vende como quieras. Solo pagas comisión cuando usas MercadoPago.
          </p>
        </div>

        {/* Comparador Modo Libre vs Modo Pro */}
        <div className="grid sm:grid-cols-2 gap-6 mb-16">
          {/* Modo Libre */}
          <div className="bg-white rounded-2xl border border-cream-dark/30 p-7">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div>
                <h2 className="font-display text-xl font-bold text-ink">Venta directa</h2>
                <p className="text-ink-muted text-sm">Tú controlas todo</p>
              </div>
            </div>
            <ul className="space-y-3 mb-6">
              {[
                "Publicas gratis, sin límites",
                "Te contactan por WhatsApp",
                "Coordinan entrega entre ustedes",
                "Sin comisiones, sin intermediarios",
              ].map((text) => (
                <li key={text} className="flex items-start gap-2 text-sm text-ink-muted">
                  <svg className="w-4 h-4 text-green-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  {text}
                </li>
              ))}
            </ul>
            <p className="text-xs text-ink-muted mb-4">Ideal para vendedores ocasionales que prefieren trato directo</p>
            <Link
              href="/publish"
              className="block text-center py-3 rounded-xl font-semibold text-sm bg-cream-warm hover:bg-cream-dark/30 text-ink border border-cream-dark/30 transition-colors"
            >
              Publicar gratis
            </Link>
          </div>

          {/* Modo Pro */}
          <div className="bg-white rounded-2xl border border-brand-500/30 p-7 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
              </div>
              <div>
                <h2 className="font-display text-xl font-bold text-ink">Venta protegida</h2>
                <p className="text-ink-muted text-sm">Nosotros nos encargamos</p>
              </div>
            </div>
            <ul className="space-y-3 mb-6">
              {[
                "Pago seguro con MercadoPago",
                "Despacho con courier (próximamente)",
                "Protección al comprador",
                "Comisión solo cuando vendes",
              ].map((text) => (
                <li key={text} className="flex items-start gap-2 text-sm text-ink-muted">
                  <svg className="w-4 h-4 text-brand-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  {text}
                </li>
              ))}
            </ul>
            <p className="text-xs text-ink-muted mb-4">Ideal para vendedores frecuentes que quieren vender sin complicaciones</p>
            <a
              href="#planes"
              className="block text-center py-3 rounded-xl font-semibold text-sm bg-brand-500 hover:bg-brand-600 text-white transition-colors"
            >
              Ver planes Pro
            </a>
          </div>
        </div>

        {/* Planes detallados */}
        <div id="planes" className="scroll-mt-8">
          <h2 className="font-display text-2xl font-bold text-ink text-center mb-8">
            Planes con MercadoPago
          </h2>
          <p className="text-ink-muted text-center max-w-lg mx-auto mb-8">
            La comisión se descuenta automáticamente de cada venta. No hay cobros sorpresa.
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`relative bg-white rounded-2xl border p-7 flex flex-col ${
                  plan.highlighted
                    ? "border-brand-500 shadow-lg shadow-brand-500/10 ring-1 ring-brand-500"
                    : "border-cream-dark/30"
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-500 text-white text-xs font-semibold px-4 py-1 rounded-full">
                    Popular
                  </div>
                )}

                <h3 className="font-display text-xl font-bold text-ink">{plan.name}</h3>

                <div className="mt-4 mb-6">
                  <span className="font-display text-3xl font-bold text-ink">{plan.price}</span>
                  <span className="text-ink-muted text-sm ml-1">{plan.priceNote}</span>
                </div>

                {/* Commissions */}
                <div className="bg-cream-warm rounded-lg p-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-ink-muted">Comisión venta</span>
                    <span className="font-bold text-ink">{plan.commissions.sale}</span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-ink-muted">Comisión arriendo</span>
                    <span className="font-bold text-ink">{plan.commissions.rental}</span>
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-3 flex-1 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-ink-muted">
                      <svg className="w-4 h-4 text-brand-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>

                <Link
                  href={plan.href}
                  className={`text-center py-3 rounded-xl font-semibold text-sm transition-colors ${
                    plan.highlighted
                      ? "bg-brand-500 hover:bg-brand-600 text-white"
                      : "bg-cream-warm hover:bg-cream-dark/30 text-ink border border-cream-dark/30"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-16 max-w-2xl mx-auto">
          <h2 className="font-display text-xl font-bold text-ink text-center mb-8">
            Preguntas frecuentes
          </h2>
          <div className="space-y-4">
            <FaqItem
              q="¿Puedo vender solo por WhatsApp sin pagar nada?"
              a="Sí. Publicas gratis, te contactan por WhatsApp, coordinan la entrega y listo. Cero costo, cero comisión."
            />
            <FaqItem
              q="¿Cuándo pago comisión?"
              a="Solo cuando cobras a través de MercadoPago. Si vendes por WhatsApp y el comprador te paga directamente, no hay comisión."
            />
            <FaqItem
              q="¿Puedo cambiar de plan?"
              a="Sí, puedes subir o bajar de plan en cualquier momento desde tu perfil. El cambio aplica desde el siguiente período."
            />
            <FaqItem
              q="¿Qué pasa con mi dinero?"
              a="El dinero de cada venta va directo a tu cuenta de MercadoPago. La comisión se descuenta automáticamente. No retenemos tu dinero."
            />
            <FaqItem
              q="¿El plan Libre tiene algún costo oculto?"
              a="No. Publicas gratis, sin límites. La comisión del 8% solo aplica cuando usas MercadoPago para cobrar."
            />
          </div>
        </div>
      </main>
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <div className="bg-white rounded-xl border border-cream-dark/30 p-5">
      <h3 className="font-semibold text-ink text-sm">{q}</h3>
      <p className="text-ink-muted text-sm mt-2">{a}</p>
    </div>
  );
}
