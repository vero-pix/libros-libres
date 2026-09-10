import Link from "next/link";
import AyudaNav from "@/components/ayuda/AyudaNav";
import AyudaContacto from "@/components/ayuda/AyudaContacto";

export const metadata = {
  title: "Guía del comprador — cómo comprar libros usados en tuslibros.cl",
  description:
    "Pagas en línea con protección de MercadoPago y el libro llega a tu casa o lo retiras en persona. Cómo buscar, pagar, recibir y qué hacer si algo falla.",
  alternates: { canonical: "https://tuslibros.cl/ayuda/comprar" },
};

const linkClass = "text-brand-600 font-semibold hover:underline";

function Seccion({ n, id, title, children }: { n: number; id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mb-12 scroll-mt-24">
      <h2 className="text-2xl font-bold text-ink mb-4 border-b-2 border-brand-600 pb-2 inline-block">
        {n}. {title}
      </h2>
      <div className="space-y-4 text-ink-muted leading-relaxed">{children}</div>
    </section>
  );
}

function Tarjeta({ children }: { children: React.ReactNode }) {
  return <div className="bg-white rounded-xl shadow-sm border border-cream-dark p-5">{children}</div>;
}

export default function AyudaComprarPage() {
  return (
    <div className="min-h-screen bg-cream">
      <div className="bg-cream-warm border-b border-cream-dark">
        <div className="max-w-3xl mx-auto px-4 py-16 sm:py-20 text-center">
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-ink mb-3">Guía del comprador</h1>
          <p className="text-ink-muted text-lg max-w-xl mx-auto">
            Pagas en línea con protección de MercadoPago y el libro llega a tu casa o lo retiras en persona.
          </p>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 py-12">
        <AyudaNav actual="/ayuda/comprar" />

        <Seccion n={1} id="buscar" title="Buscar">
          <Tarjeta>
            <p>
              Busca por título, autor o tema en el <Link href="/search" className={linkClass}>catálogo</Link>. Filtra
              por comuna para encontrar libros cerca de ti y ahorrarte el envío con entrega en persona. Si no está lo
              que buscas, déjalo en <Link href="/solicitudes" className={linkClass}>Se busca</Link>: cuando un vendedor
              lo publique, te avisamos.
            </p>
          </Tarjeta>
        </Seccion>

        <Seccion n={2} id="pagar" title="Pagar">
          <Tarjeta>
            <p>
              El pago es en línea, por MercadoPago (tarjeta, débito o saldo). Tu dinero le llega al vendedor solo
              cuando la compra se confirma, y tienes la protección de MercadoPago si algo sale mal. Por eso no
              aceptamos transferencias ni pago en efectivo, ni siquiera en entregas en persona.
            </p>
            <p className="mt-4">
              Si tu pago es rechazado, la pantalla te dice por qué y qué hacer. Lo más común: límite de la tarjeta,
              datos mal escritos o un rechazo preventivo del banco. Puedes intentar con otro medio o escribirnos.
            </p>
          </Tarjeta>
        </Seccion>

        <Seccion n={3} id="recibir" title="Recibir">
          <Tarjeta>
            <h3 className="font-semibold text-ink text-lg mb-2">Despacho a domicilio</h3>
            <p>
              El vendedor prepara el paquete y el courier (Starken, Bluexpress, Chilexpress, según tu zona) lo lleva a
              tu dirección. Verás el número de seguimiento en{" "}
              <Link href="/mis-pedidos" className={linkClass}>Mis Pedidos</Link> y por correo en cuanto exista. Plazo
              habitual: 2 a 5 días hábiles desde el retiro.
            </p>
          </Tarjeta>
          <Tarjeta>
            <h3 className="font-semibold text-ink text-lg mb-2">Si compras dos veces al mismo vendedor</h3>
            <p>
              Mientras él no haya despachado, tus libros nuevos se suman al paquete que ya está armando y{" "}
              <strong>no pagas despacho de nuevo</strong>: es el mismo viaje. Lo verás en el checkout, donde el envío
              aparece como &ldquo;ya pagado&rdquo;, y le avisamos a él para que los meta en el mismo bulto. Deja de
              aplicar cuando el courier ya pasó a buscarlo o cuando el paquete llega a ocho libros.
            </p>
          </Tarjeta>
          <Tarjeta>
            <h3 className="font-semibold text-ink text-lg mb-2">Entrega en persona</h3>
            <p>
              Coordinas con el vendedor desde <Link href="/mis-pedidos" className={linkClass}>Mis Pedidos → Escribir</Link>.
              Sugiere un lugar público (metro, café). El pago ya está hecho: no pagues nada al recibir.
            </p>
          </Tarjeta>
          <p>Hoy despachamos solo dentro de Chile.</p>
        </Seccion>

        <Seccion n={4} id="si-algo-falla" title="Si algo falla">
          <Tarjeta>
            <ul className="space-y-3">
              <li>
                <strong className="text-ink">El libro no llega en el plazo:</strong> revisa el seguimiento en Mis
                Pedidos; si lleva más de 7 días hábiles sin movimiento, escríbenos.
              </li>
              <li>
                <strong className="text-ink">El libro llegó dañado o no es lo descrito:</strong> escríbenos dentro de
                3 días con fotos. Ver la <Link href="/devoluciones" className={linkClass}>política de devoluciones</Link>.
              </li>
              <li>
                <strong className="text-ink">El vendedor no responde para la entrega en persona:</strong> escríbenos
                después de 3 días.
              </li>
            </ul>
          </Tarjeta>
        </Seccion>

        <div className="text-center">
          <Link
            href="/search"
            className="inline-block bg-brand-600 hover:bg-brand-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            Explorar el catálogo
          </Link>
        </div>

        <AyudaContacto texto="Hola, tengo una duda sobre una compra en tuslibros.cl" />
      </main>
    </div>
  );
}
