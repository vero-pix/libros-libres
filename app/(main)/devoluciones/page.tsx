import Link from "next/link";

export const metadata = {
  title: "Política de devoluciones — tuslibros.cl",
  description: "Cómo funcionan las devoluciones en tuslibros.cl",
};

export default function DevolucionesPage() {
  return (
    <div className="min-h-screen bg-cream">
      <main className="max-w-3xl mx-auto px-4 py-10 sm:py-14">
        <header className="mb-10">
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-ink mb-3">
            Política de devoluciones
          </h1>
          <p className="text-ink-muted">
            Queremos que tanto compradores como vendedores tengan una experiencia justa y
            transparente.
          </p>
        </header>

        <section className="bg-white border border-cream-dark/40 rounded-xl p-6 mb-6">
          <h2 className="font-semibold text-ink text-lg mb-3">Cuándo puedes devolver</h2>
          <p className="text-sm text-ink-muted leading-relaxed mb-3">
            Puedes solicitar la devolución de un libro comprado en tuslibros.cl en los siguientes
            casos:
          </p>
          <ul className="text-sm text-ink-muted space-y-2 leading-relaxed">
            <li>
              • <strong>Libro dañado en el transporte</strong>: llegó roto, mojado o en condición
              significativamente peor a la descrita.
            </li>
            <li>
              • <strong>Libro distinto al publicado</strong>: recibiste una edición diferente, un
              título equivocado o un ejemplar con páginas faltantes.
            </li>
            <li>
              • <strong>Condición muy distinta a la descrita</strong>: el vendedor declaró “Como
              nuevo” pero llegó con rayones, subrayados o marcas no mencionadas.
            </li>
          </ul>
          <p className="text-sm text-ink-muted leading-relaxed mt-3">
            Tienes <strong>7 días desde la recepción</strong> para iniciar una devolución.
          </p>
        </section>

        <section className="bg-white border border-cream-dark/40 rounded-xl p-6 mb-6">
          <h2 className="font-semibold text-ink text-lg mb-3">Cómo funciona la devolución</h2>
          <ol className="text-sm text-ink-muted space-y-3 leading-relaxed list-decimal list-inside">
            <li>
              Escríbenos a{" "}
              <a href="mailto:hola@tuslibros.cl" className="text-brand-600 underline">
                hola@tuslibros.cl
              </a>{" "}
              con el ID de tu orden y una foto del libro.
            </li>
            <li>
              Validamos el caso en menos de 24 horas y, si corresponde, te enviamos una etiqueta de
              devolución.
            </li>
            <li>
              Las devoluciones se gestionan a través de <strong>Chilexpress</strong>, independiente
              del courier con el que llegó el libro originalmente.
            </li>
            <li>
              Llevas el paquete con la etiqueta a cualquier sucursal de Chilexpress (no hay retiro
              en domicilio para devoluciones).
            </li>
            <li>
              Una vez que el vendedor recibe el libro, se procesa el reembolso del monto del libro a
              tu cuenta de MercadoPago.
            </li>
          </ol>
        </section>

        <section className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-6">
          <h2 className="font-semibold text-amber-900 text-lg mb-2">Importante</h2>
          <ul className="text-sm text-amber-800 space-y-2 leading-relaxed">
            <li>
              • El costo del envío original <strong>no se reembolsa</strong>, salvo en casos de
              libro dañado o equivocado.
            </li>
            <li>
              • El libro debe devolverse en la misma condición en la que fue recibido, salvo cuando
              el problema es justamente un daño del transporte.
            </li>
            <li>
              • No se aceptan devoluciones por cambio de opinión si el libro coincide con lo
              descrito.
            </li>
          </ul>
        </section>

        <section className="bg-white border border-cream-dark/40 rounded-xl p-6 mb-6">
          <h2 className="font-semibold text-ink text-lg mb-3">Para vendedores</h2>
          <p className="text-sm text-ink-muted leading-relaxed">
            Si recibes una solicitud de devolución, nosotros validamos primero que sea legítima.
            Tus ventas están protegidas contra devoluciones injustificadas. Si tienes dudas sobre
            un caso específico, escríbenos antes de aceptar o rechazar.
          </p>
        </section>

        <div className="text-center mt-10">
          <Link
            href="/contacto"
            className="inline-block bg-ink text-cream px-6 py-3 rounded-lg font-medium hover:bg-ink/90"
          >
            ¿Tienes una devolución? Escríbenos
          </Link>
        </div>
      </main>
    </div>
  );
}
