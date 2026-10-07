import Link from "next/link";
import AyudaNav from "@/components/ayuda/AyudaNav";
import AyudaContacto from "@/components/ayuda/AyudaContacto";

export const metadata = {
  title: "Guía del comprador — cómo comprar libros usados en tuslibros.cl",
  description:
    "Pagas en línea, con MercadoPago o por transferencia, y el libro llega a tu casa o lo retiras en persona. Cómo buscar, pagar, recibir y qué hacer si algo falla.",
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
            Pagas en línea, con MercadoPago o por transferencia, y el libro llega a tu casa o lo retiras en persona.
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
              El pago es en línea: por MercadoPago (tarjeta, débito o saldo) o por transferencia, según el vendedor.
              El pago le llega directo a quien te vende. La compra queda registrada a tu nombre en Mis compras y,
              si algo sale mal, me escribes y te ayudo a resolverlo con el vendedor.
            </p>
            {/* El cargo no aparecía en esta guía (auditoría del 07-10-2026). Misma regla que lib/cargo-servicio.ts. */}
            <p className="mt-4">
              Si pagas con MercadoPago y pides despacho, se suma un <strong>cargo por servicio del 8%</strong> del
              precio del libro. Lo ves desglosado en la ficha y en el checkout antes de pagar. Con entrega en persona o
              por transferencia, no hay cargo.
            </p>
            <p className="mt-4">
              Algunos vendedores cobran por <strong>transferencia</strong> en vez de MercadoPago. Cuando es así, te
              lo digo en la ficha del libro antes de que compres. Confirmas el pedido, el libro queda reservado a tu
              nombre y el vendedor te manda sus datos por la mensajería del sitio. Yo no guardo datos bancarios de
              nadie. Es el único otro medio que existe: si alguien te pide pagar por fuera de esos dos caminos, no lo
              hagas y avísame.
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
              El despacho tiene una tarifa fija por zona y la ves en la ficha antes de comprar: eliges tu comuna y
              aparece el total. Cuando pagas, el vendedor lleva el paquete al courier que elija (Starken, Blue Express,
              Chilexpress, Correos u otro) dentro de 2 días hábiles y anota el número de seguimiento: lo verás en{" "}
              <Link href="/mis-pedidos" className={linkClass}>Mis compras</Link> y por correo. Plazo habitual: 2 a 5
              días hábiles desde que el vendedor despacha.
            </p>
          </Tarjeta>
          <Tarjeta>
            {/* Hasta el 07-10-2026 decía que una segunda compra al mismo vendedor se sumaba al paquete sin
                pagar despacho: eso existía con Shipit, no con el despacho coordinado (app/api/orders/route.ts). */}
            <h3 className="font-semibold text-ink text-lg mb-2">Varios libros del mismo vendedor</h3>
            <p>
              Agrégalos todos al carrito y págalos juntos: <strong>el despacho se cobra una sola vez por
              vendedor</strong>. Si compras en dos veces, cada compra paga su propio despacho.
            </p>
          </Tarjeta>
          <Tarjeta>
            <h3 className="font-semibold text-ink text-lg mb-2">Entrega en persona</h3>
            <p>
              Coordinas con el vendedor desde <Link href="/mis-pedidos" className={linkClass}>Mis compras → Escribir</Link>.
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
                <strong className="text-ink">El vendedor nunca despacha:</strong> si pagaste en el sitio, te devuelvo
                tu plata completa y su cuenta queda suspendida. Ya me tocó hacerlo.
              </li>
              <li>
                <strong className="text-ink">El libro llegó dañado o no es lo descrito:</strong> escríbenos dentro de
                7 días con fotos. Ver la <Link href="/devoluciones" className={linkClass}>política de devoluciones</Link>.
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
