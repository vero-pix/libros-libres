import Link from "next/link";

export const metadata = {
  title: "Cómo despachar — tuslibros.cl",
  description: "Guía paso a paso para despachar un libro vendido por courier",
};

const steps = [
  {
    n: 1,
    icon: "📦",
    title: "Empaqueta el libro",
    body: "Usa burbuja plástica, cartón o un sobre acolchado resistente. Asegúrate de que el libro no se mueva dentro del paquete. Si tienes varios libros en una misma orden, empácalos juntos.",
  },
  {
    n: 2,
    icon: "🖨️",
    title: "Imprime la etiqueta",
    body: "Desde Mis Ventas, busca la orden y haz click en “Descargar etiqueta”. Imprímela en hoja tamaño carta. Si no tienes impresora en casa, la mayoría de sucursales del courier la pueden imprimir mostrando el PDF desde el celular.",
  },
  {
    n: 3,
    icon: "🏷️",
    title: "Pega la etiqueta",
    body: "Pega la etiqueta en la parte más plana del paquete, bien firme, con cinta transparente. Asegúrate de que el código de barras quede visible y sin dobleces.",
  },
  {
    n: 4,
    icon: "🚚",
    title: "Llévala a la sucursal del courier",
    body: "Lleva el paquete a una sucursal del courier indicado en la orden (Chilexpress, Starken, Blue Express, 99 Minutos, Recíbelo o Spread). No es necesario pagar nada — el envío ya está cobrado al comprador. Solo muestra la etiqueta en el mesón.",
  },
  {
    n: 5,
    icon: "✅",
    title: "Guarda el comprobante",
    body: "La sucursal te va a entregar un comprobante de admisión. Guárdalo hasta que el comprador confirme que recibió el libro. Es tu respaldo si algo no llega.",
  },
];

export default function ComoDespacharPage() {
  return (
    <div className="min-h-screen bg-cream">
      <main className="max-w-3xl mx-auto px-4 py-10 sm:py-14">
        <div className="mb-10">
          <Link
            href="/mis-ventas"
            className="text-sm text-ink-muted hover:text-ink inline-flex items-center gap-1"
          >
            ← Volver a Mis Ventas
          </Link>
        </div>

        <header className="mb-12">
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-ink mb-3">
            Cómo despachar un libro
          </h1>
          <p className="text-ink-muted text-lg">
            Vendiste un libro, felicitaciones. Acá te dejo los 5 pasos para que llegue bien a su nuevo lector. Son fáciles, te prometo.
          </p>
        </header>

        <div className="space-y-5 mb-12">
          {steps.map((step) => (
            <div
              key={step.n}
              className="bg-white rounded-xl border border-cream-dark/40 p-6 flex gap-5 items-start shadow-sm"
            >
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-brand-600 text-white flex items-center justify-center text-lg font-bold">
                {step.n}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-ink text-lg mb-2">
                  <span className="mr-2">{step.icon}</span>
                  {step.title}
                </h3>
                <p className="text-ink-muted text-sm leading-relaxed">{step.body}</p>
              </div>
            </div>
          ))}
        </div>

        <section className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-8">
          <h2 className="font-semibold text-amber-900 mb-2">⏱️ Plazo de despacho</h2>
          <p className="text-sm text-amber-800 leading-relaxed">
            Despacha el libro dentro de los <strong>2 días hábiles</strong> siguientes a la venta. Esto
            mantiene a los compradores contentos y asegura que tu tienda mantenga una buena reputación.
          </p>
        </section>

        <section className="bg-white border border-cream-dark/40 rounded-xl p-6 mb-8">
          <h2 className="font-semibold text-ink mb-3">💡 Tips para que no se dañe en el camino</h2>
          <ul className="text-sm text-ink-muted space-y-2 leading-relaxed">
            <li>• Protege las esquinas del libro con cartón extra si es de tapa dura</li>
            <li>• Si llueve, usa una bolsa plástica antes del sobre</li>
            <li>• No uses cajas mucho más grandes que el libro (se golpea adentro)</li>
            <li>• Si el libro es antiguo o delicado, menciónalo en las notas al comprador</li>
          </ul>
        </section>

        <section className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h2 className="font-semibold text-blue-900 mb-2">¿Tienes dudas?</h2>
          <p className="text-sm text-blue-800 leading-relaxed mb-3">
            Si algo no te cuadra o tienes una situación especial, escríbeme. Estoy construyendo esto
            de a poco y me importa que el proceso sea simple para ti. — Vero
          </p>
          <Link href="/sobre-nosotros#contacto" className="text-sm text-blue-700 font-medium hover:underline">
            Contáctanos →
          </Link>
        </section>
      </main>
    </div>
  );
}
