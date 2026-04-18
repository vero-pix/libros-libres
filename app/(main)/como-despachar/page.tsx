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
    title: "Imprime la etiqueta (si está disponible)",
    body: 'Entra a Mis Ventas y busca tu orden. Si ves el botón "Descargar etiqueta", imprímela en hoja tamaño carta y pégala en la parte más plana del paquete con cinta transparente. ¿Sin impresora? En cualquier librería o cyber te la imprimen desde el celular. Si NO ves el botón, no te preocupes: significa que el courier Shipit trae el manifiesto impreso al momento del retiro — tú solo anotas el código de tracking y el nombre del destinatario en el paquete para identificarlo.',
  },
  {
    n: 3,
    icon: "🏠",
    title: "Deja el paquete listo para el retiro",
    body: 'Shipit coordina un retiro a domicilio en la dirección que registraste. La fecha y ventana horaria de retiro aparece en el detalle de la orden (por ejemplo: "20 abril, 11:00–17:00"). Necesitas que alguien esté en casa durante esa ventana para entregar el paquete. Si la venta se paga antes de las 11 AM, el retiro suele quedar para ese mismo día; si es después, queda agendado para el siguiente día hábil.',
  },
  {
    n: 4,
    icon: "✅",
    title: "Firma el manifiesto y guárdalo",
    body: "Cuando llegue el courier, te entrega un manifiesto o comprobante de retiro para firmar (una copia queda contigo). Guárdalo hasta que el comprador confirme que recibió el libro — es tu respaldo si algo se pierde en el camino. No pagas nada al courier: el envío se factura directamente a la cuenta de tuslibros.cl a fin de mes.",
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

        <header className="mb-10">
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-ink mb-3">
            Cómo despachar un libro
          </h1>
          <p className="text-ink-muted text-lg">
            Vendiste un libro, felicitaciones. Acá te dejo los 4 pasos para que llegue bien a su nuevo lector. Son fáciles, te prometo.
          </p>
        </header>

        <section className="mb-12 bg-gradient-to-br from-brand-50 to-cream-warm border border-brand-200 rounded-2xl p-6 sm:p-7">
          <div className="flex items-start gap-3 mb-2">
            <span className="text-2xl">🏠</span>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-ink">
              El courier pasa a buscar a tu casa
            </h2>
          </div>
          <p className="text-sm sm:text-base text-ink-muted leading-relaxed">
            No tienes que ir a ninguna sucursal ni hacer fila. Cuando se confirma una venta, Shipit coordina
            un retiro a domicilio y un courier pasa por el paquete a la dirección que tienes registrada.
            Tú solo lo dejas listo y esperas en casa en la ventana que te indica la orden.
          </p>
        </section>

        <div className="mb-4">
          <Link href="/mis-ventas" className="text-brand-600 font-semibold hover:underline text-sm">
            Ir a Mis Ventas para ver tus órdenes →
          </Link>
        </div>

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
            Ten el paquete listo dentro de los <strong>2 días hábiles</strong> siguientes a la venta.
            Shipit agenda el retiro con corte diario a las <strong>11:00 AM</strong>: si la venta se paga
            después de esa hora, el retiro queda para el día hábil siguiente. Despachar a tiempo mantiene
            a los compradores contentos y asegura la buena reputación de tu tienda.
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
          <p className="text-sm text-ink-muted mt-4">
            ¿El comprador reportó un problema?{" "}
            <Link href="/devoluciones" className="text-brand-600 font-semibold hover:underline">
              Lee la política de devoluciones
            </Link>
            .
          </p>
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
