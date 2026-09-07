import Link from "next/link";
import AyudaNav from "@/components/ayuda/AyudaNav";
import AyudaContacto from "@/components/ayuda/AyudaContacto";

export const metadata = {
  title: "Guía del vendedor — cómo vender libros usados en tuslibros.cl",
  description:
    "Publicar es gratis, cobras por MercadoPago y el courier pasa a buscar el libro a tu casa. Qué hacer cuando vendes, cómo coordinar una entrega en persona y qué pasa si algo falla.",
  alternates: { canonical: "https://tuslibros.cl/ayuda/vender" },
};

const linkClass = "text-brand-600 font-semibold hover:underline";

function Seccion({ n, id, title, children }: { n: number; id?: string; title: string; children: React.ReactNode }) {
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

export default function AyudaVenderPage() {
  return (
    <div className="min-h-screen bg-cream">
      <div className="bg-cream-warm border-b border-cream-dark">
        <div className="max-w-3xl mx-auto px-4 py-16 sm:py-20 text-center">
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-ink mb-3">Guía del vendedor</h1>
          <p className="text-ink-muted text-lg max-w-xl mx-auto">
            Publicar es gratis, cobras por MercadoPago y el courier pasa a buscar el libro a tu casa.
          </p>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 py-12">
        <AyudaNav actual="/ayuda/vender" />

        <Seccion n={1} title="Publicar">
          <p>
            Publicar es gratis y no tiene límite de libros. Cada libro es un ejemplar único: cuando se vende,
            desaparece del catálogo.
          </p>
          <Tarjeta>
            <ul className="space-y-3">
              <li>
                <strong className="text-ink">Un libro:</strong>{" "}
                <Link href="/publish" className={linkClass}>Publicar</Link>, foto de la portada, el sitio reconoce
                título y autor, y confirmas precio, estado y comuna. Menos de un minuto.
              </li>
              <li>
                <strong className="text-ink">Muchos libros:</strong>{" "}
                <Link href="/mis-libros/importar" className={linkClass}>Mis Libros → Importar</Link> acepta un CSV
                (Excel, Numbers o Google Sheets). Si tienes la lista en cualquier formato, escríbenos y te ayudamos a
                dejarla lista.
              </li>
              <li>
                <strong className="text-ink">Libros subrayados o con notas:</strong> sí se pueden vender. Elige el
                estado &ldquo;con marcas&rdquo; y menciónalo en la descripción; hay compradores que los prefieren.
              </li>
              <li>
                <strong className="text-ink">Si vendes un libro por fuera</strong>, márcalo como vendido en{" "}
                <Link href="/mis-libros" className={linkClass}>Mis Libros</Link> para que nadie lo compre acá.
              </li>
            </ul>
          </Tarjeta>
        </Seccion>

        <Seccion n={2} id="cobrar" title="Cobrar: conecta MercadoPago">
          <p>
            Sin MercadoPago conectado solo te pueden comprar en persona. Con MercadoPago te compran desde cualquier
            región, el pago entra directo a tu cuenta y tuslibros nunca toca tu dinero.
          </p>
          <Tarjeta>
            <ul className="space-y-3">
              <li>
                <Link href="/perfil" className={linkClass}>Perfil → Conectar MercadoPago</Link>. Toma un minuto; si
                no tienes cuenta, la creas en el mismo paso.
              </li>
              <li>
                La comisión de tuslibros es <strong className="text-ink">8% sobre el precio del libro</strong> cuando
                la venta va con despacho, y se descuenta automáticamente del pago. Tú no haces ningún pago aparte.
              </li>
              <li>
                Cuando un vendedor puede cobrar por la plataforma, el botón de WhatsApp de su tienda se oculta: la
                venta va por el sitio, con la protección que eso da a las dos partes. Las dudas del comprador llegan
                por <Link href="/mensajes" className={linkClass}>Mensajes</Link>.
              </li>
            </ul>
          </Tarjeta>
        </Seccion>

        <Seccion n={3} title="Vendiste: qué pasa y qué tienes que hacer">
          <p>
            Te avisamos por correo y en <Link href="/mis-ventas" className={linkClass}>Mis Ventas</Link>. Revisa Mis
            Ventas cada uno o dos días aunque no te llegue correo.
          </p>

          <Tarjeta>
            <h3 className="font-semibold text-ink text-lg mb-3">Si el comprador eligió despacho</h3>
            <ol className="list-decimal pl-5 space-y-3">
              <li>
                Empaca el libro en sobre acolchado o caja chica. Si son varios libros del mismo comprador, van juntos
                en un solo paquete.
              </li>
              {/* [D7] Cambia cuando exista la modalidad "dejar en courier". */}
              <li>
                El courier pasa a buscar el paquete <strong className="text-ink">a tu casa</strong>. Vero confirma el
                retiro y te avisa día y ventana horaria. No vas a ninguna sucursal y no le pagas nada al courier: el
                envío ya lo pagó el comprador.
              </li>
              <li>
                Pega la etiqueta en el paquete. La descargas desde Mis Ventas (botón{" "}
                <strong className="text-ink">Descargar etiqueta</strong>) o desde el correo. Si no tienes impresora,
                escribe en el paquete, bien claro, el nombre del comprador y el número de seguimiento.
              </li>
              <li>Guarda el comprobante firmado que te deja el chofer hasta que el comprador reciba el libro.</li>
            </ol>
            {/* [D7 — activar cuando exista]
            <p className="mt-4">
              Si prefieres dejar el paquete tú en una sucursal del courier, elige{" "}
              <strong className="text-ink">&ldquo;Yo lo dejo en el courier&rdquo;</strong> en Mis Ventas antes de que
              se emita la etiqueta. Imprimes la etiqueta, la pegas y lo entregas en la sucursal indicada. Fuera de la
              Región Metropolitana esta es la modalidad por defecto.
            </p>
            */}
            <p className="mt-4 text-sm">
              Paso a paso con más detalle:{" "}
              <Link href="/como-despachar" className={linkClass}>cómo despachar un libro</Link>.
            </p>
          </Tarjeta>

          <Tarjeta>
            <h3 className="font-semibold text-ink text-lg mb-3">Si el comprador eligió entrega en persona</h3>
            <ul className="space-y-3">
              <li>
                <strong className="text-ink">El pago ya está hecho.</strong> No le cobres de nuevo.
              </li>
              <li>
                Coordina lugar y hora con el botón <strong className="text-ink">Escribir</strong> al lado de su
                nombre en Mis Ventas. Un punto de metro concurrido funciona bien.
              </li>
              <li>Recomendamos no compartir el teléfono hasta tener fecha y lugar acordados.</li>
            </ul>
          </Tarjeta>
        </Seccion>

        <Seccion n={4} title="Si algo falla">
          <Tarjeta>
            <ul className="space-y-3">
              <li>
                <strong className="text-ink">El courier no llegó el día del retiro:</strong> escribe a Shipit
                (WhatsApp o correo, en Mis Ventas) con tu número de seguimiento, y avísanos.
              </li>
              <li>
                <strong className="text-ink">El comprador no responde para coordinar la entrega en persona:</strong>{" "}
                escríbenos después de 3 días; nosotros lo contactamos.
              </li>
              <li>
                <strong className="text-ink">El libro se dañó o el comprador reclama:</strong> escríbenos. Ver la{" "}
                <Link href="/devoluciones" className={linkClass}>política de devoluciones</Link>.
              </li>
            </ul>
          </Tarjeta>
        </Seccion>

        <Seccion n={5} title="Consejos que funcionan">
          <Tarjeta>
            <ul className="space-y-3">
              <li>Foto de la portada real, con luz natural, sin filtro.</li>
              <li>Precio: mira cuánto vale el mismo título en el catálogo antes de fijarlo.</li>
              <li>Describe el estado con honestidad; las devoluciones nacen de sorpresas.</li>
              <li>
                Revisa <Link href="/solicitudes" className={linkClass}>Se busca</Link>: es la lista de libros que la
                gente está buscando y no encuentra.
              </li>
            </ul>
          </Tarjeta>
        </Seccion>

        <div className="text-center">
          <Link
            href="/publish"
            className="inline-block bg-brand-600 hover:bg-brand-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            Publicar un libro
          </Link>
        </div>

        <AyudaContacto texto="Hola, tengo una duda sobre cómo vender en tuslibros.cl" />
      </main>
    </div>
  );
}
