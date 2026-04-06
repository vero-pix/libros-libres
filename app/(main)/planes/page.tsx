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
      "Aparece en el mapa",
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
            Vende más, paga menos
          </h1>
          <p className="text-ink-muted mt-3 max-w-lg mx-auto">
            Todos los planes incluyen publicación ilimitada y pagos seguros con MercadoPago.
            La diferencia está en la comisión por venta.
          </p>
        </div>

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

              <h2 className="font-display text-xl font-bold text-ink">{plan.name}</h2>

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

        {/* FAQ */}
        <div className="mt-16 max-w-2xl mx-auto">
          <h2 className="font-display text-xl font-bold text-ink text-center mb-8">
            Preguntas frecuentes
          </h2>
          <div className="space-y-4">
            <FaqItem
              q="¿Puedo cambiar de plan?"
              a="Sí, puedes subir o bajar de plan en cualquier momento desde tu perfil. El cambio aplica desde el siguiente período."
            />
            <FaqItem
              q="¿Qué pasa con mi dinero?"
              a="El dinero de cada venta va directo a tu cuenta de MercadoPago. La comisión se descuenta automáticamente. No retenemos tu dinero."
            />
            <FaqItem
              q="¿Cómo se cobra el plan mensual?"
              a="Se cobra automáticamente a tu cuenta de MercadoPago al inicio de cada mes. Puedes cancelar en cualquier momento."
            />
            <FaqItem
              q="¿El plan Libre tiene algún costo oculto?"
              a="No. Publicas gratis, sin límites. Solo pagas la comisión cuando vendes o arriendas un libro."
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
