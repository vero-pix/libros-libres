import Link from "next/link";
import { WHATSAPP_SOPORTE_LEGIBLE, waSoporte } from "@/lib/soporte";

export const metadata = {
  title: "Cómo despachar",
  description: "Guía paso a paso para despachar un libro vendido por courier",
  alternates: { canonical: "https://tuslibros.cl/como-despachar" },
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
    title: "Descarga la etiqueta y pégala",
    body: 'La etiqueta aparece en Mis Ventas con el botón "Descargar etiqueta" y también te llega por correo apenas el courier la emite. Imprímela en hoja tamaño carta y pégala en la parte más plana del paquete con cinta transparente. ¿Sin impresora? En cualquier librería o cyber te la imprimen desde el celular.',
  },
  {
    n: 3,
    icon: "🏪",
    title: "Déjalo en una sucursal del courier",
    body: "Lleva el paquete con la etiqueta pegada a una sucursal del courier indicado en la etiqueta: Starken, Bluexpress o Chilexpress. No pagas nada al courier: el envío lo pagó el comprador en el checkout y se cobra a la cuenta de tuslibros.cl. Si prefieres que pasen a buscarlo a tu casa y estás en la Región Metropolitana, usa el botón \"Pedir retiro a domicilio\" en Mis Ventas.",
  },
  {
    n: 4,
    icon: "✅",
    title: "Guarda el comprobante",
    body: "En la sucursal te dan un comprobante con el número de seguimiento. Guárdalo hasta que el comprador confirme que recibió el libro: es tu respaldo si algo se pierde en el camino.",
  },
];

const contactos = [
  {
    quien: "Shipit (la etiqueta y el courier)",
    detalle: "WhatsApp +56 9 3230 2514, lunes a viernes de 9:00 a 18:00, o soporte@shipit.cl. Ten a mano el número de seguimiento.",
    href: "https://wa.me/56932302514",
  },
  {
    quien: "Vero (tuslibros.cl)",
    detalle: `WhatsApp ${WHATSAPP_SOPORTE_LEGIBLE}. Para cualquier cosa: una etiqueta que no llega, un comprador que no responde, un libro que ya vendiste por fuera.`,
    href: waSoporte(),
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
            <span className="text-2xl">🏪</span>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-ink">
              Dejas el paquete en una sucursal del courier
            </h2>
          </div>
          <p className="text-sm sm:text-base text-ink-muted leading-relaxed">
            Cuando se confirma una venta te llega la etiqueta. La descargas desde Mis Ventas o el correo, la
            pegas en el paquete y lo dejas en una sucursal del courier indicado: Starken, Bluexpress o
            Chilexpress. No pagas nada al courier. Si prefieres que pasen a buscarlo a tu casa y estás en la
            Región Metropolitana, usa el botón <strong>&ldquo;Pedir retiro a domicilio&rdquo;</strong> en Mis Ventas.
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
            Deja el paquete en la sucursal dentro de los <strong>2 días hábiles</strong> siguientes a la venta.
            Despachar a tiempo mantiene a los compradores contentos y asegura la buena reputación de tu tienda.
          </p>
        </section>

        <section className="bg-white border border-cream-dark/40 rounded-xl p-6 mb-8">
          <h2 className="font-semibold text-ink mb-3">💬 Cómo hablar con el comprador</h2>
          <p className="text-sm text-ink-muted leading-relaxed">
            En <Link href="/mis-ventas" className="text-brand-600 font-semibold hover:underline">Mis Ventas</Link>,
            al lado del nombre de cada comprador, hay un botón <strong>&ldquo;Escribir&rdquo;</strong> que abre un chat
            dentro del sitio. Úsalo para avisar que el libro salió, o para coordinar lugar y hora si la
            venta es con entrega en persona. En ese caso el pago ya está hecho por MercadoPago: no le cobres de nuevo.
          </p>
        </section>

        <section className="bg-red-50 border border-red-200 rounded-xl p-6 mb-8">
          <h2 className="font-semibold text-red-900 mb-3">🚨 Si algo sale mal</h2>
          <p className="text-sm text-red-800 leading-relaxed mb-4">
            En la sucursal no reciben el paquete, la etiqueta no llegó, el paquete se devolvió. Estos son los
            contactos:
          </p>
          <ul className="space-y-3">
            {contactos.map((c) => (
              <li key={c.quien} className="text-sm text-red-900">
                <a href={c.href} target="_blank" rel="noopener noreferrer" className="font-semibold hover:underline">
                  {c.quien}
                </a>
                <span className="block text-red-800 mt-0.5">{c.detalle}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="bg-white border border-cream-dark/40 rounded-xl p-6 mb-8">
          <h2 className="font-semibold text-ink mb-3">📌 Dos hábitos que evitan problemas</h2>
          <ul className="text-sm text-ink-muted space-y-2 leading-relaxed">
            <li>• <strong>Revisa Mis Ventas cada uno o dos días</strong>, aunque no te haya llegado el correo de aviso. A veces cae en spam.</li>
            <li>• <strong>Si vendes un libro por fuera, márcalo como vendido</strong> en Mis Libros. Si alguien lo compra acá y ya no lo tienes, hay que devolverle la plata.</li>
          </ul>
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
