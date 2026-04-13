import Image from "next/image";
import Link from "next/link";

export const metadata = {
  title: "Preguntas frecuentes — tuslibros.cl",
};

const linkClass = "text-brand-600 font-semibold hover:underline";

const faqSections = [
  {
    title: "Para compradores",
    questions: [
      {
        q: "¿Cómo compro un libro?",
        a: (
          <ol className="list-decimal list-inside space-y-1 text-ink-muted">
            <li>
              Busca el libro en el{" "}
              <Link href="/search" className={linkClass}>catálogo</Link>,{" "}
              <Link href="/mapa" className={linkClass}>mapa</Link> o barra de búsqueda
            </li>
            <li>Haz clic en el libro que te interesa</li>
            <li>
              Contacta al vendedor por WhatsApp o compra directamente con{" "}
              <a
                href="https://www.mercadopago.cl"
                target="_blank"
                rel="noopener noreferrer"
                className={linkClass}
              >
                MercadoPago
              </a>
            </li>
            <li>Coordina la entrega en persona, retiro, o recibe por courier</li>
          </ol>
        ),
      },
      {
        q: "¿Cuánto cuesta comprar?",
        a: "Pagas el precio publicado. Nada escondido, nada raro.",
      },
      {
        q: "¿Puedo negociar el precio?",
        a: (
          <span>
            Sí, y me gusta que así sea. Armé tuslibros.cl para que la conversación entre quien vende y quien compra sea directa, sin que yo me meta en el medio. Conversen por WhatsApp, pónganse de acuerdo. Y si quieren pagar con{" "}
            <a
              href="https://www.mercadopago.cl"
              target="_blank"
              rel="noopener noreferrer"
              className={linkClass}
            >
              MercadoPago
            </a>
            , también pueden ajustar el precio entre ustedes para repartirse la comisión como les acomode. Mi regla es una sola: libertad. — Vero
          </span>
        ),
      },
      {
        q: "¿Cómo sé si el libro está en buen estado?",
        a: (
          <span>
            Cada publicación incluye el estado del libro: <strong>Como nuevo</strong>, <strong>Buen estado</strong>, <strong>Estado regular</strong> o <strong>Con detalles</strong>. También puedes preguntarle directamente al vendedor antes de acordar la compra.
          </span>
        ),
      },
    ],
  },
  {
    title: "Para vendedores",
    questions: [
      {
        q: "¿Cuánto cuesta publicar?",
        a: "Cero. Siempre. Publica uno o mil, da igual — es gratis y va a seguir siendo gratis.",
      },
      {
        q: "¿Cuándo se aplican comisiones?",
        a: (
          <span>
            Las comisiones <strong>solo aplican</strong> cuando usas nuestras herramientas integradas: pago con{" "}
            <a
              href="https://www.mercadopago.cl"
              target="_blank"
              rel="noopener noreferrer"
              className={linkClass}
            >
              MercadoPago
            </a>{" "}
            (y otras pasarelas que sumemos) o{" "}
            <strong>
              <Link href="/como-despachar" className={linkClass}>despacho por courier</Link>
            </strong>{" "}
            (Shipit hoy, más integraciones en camino). Si coordinas todo por WhatsApp y entregas en persona, no pagas nada.
          </span>
        ),
      },
      {
        q: "¿Cómo publico un libro?",
        a: (
          <ol className="list-decimal list-inside space-y-1 text-ink-muted">
            <li>Inicia sesión en tu cuenta</li>
            <li>
              Haz clic en{" "}
              <Link href="/publish" className={linkClass}>
                <strong>Publicar libro</strong>
              </Link>
            </li>
            <li>
              Escanea el{" "}
              <Link href="/publish" className={linkClass}>código de barras o ingresa el ISBN</Link>
            </li>
            <li>Completa precio y estado del libro</li>
            <li>
              Marca la ubicación en el{" "}
              <Link href="/mapa" className={linkClass}>mapa</Link>
            </li>
            <li>
              Tu libro aparece en el{" "}
              <Link href="/search" className={linkClass}>catálogo</Link> al instante
            </li>
          </ol>
        ),
      },
      {
        q: "¿Cómo me contactan los compradores?",
        a: (
          <span>
            Los compradores te escriben directamente por WhatsApp al número que registraste en tu{" "}
            <Link href="/perfil" className={linkClass}>perfil</Link>. También pueden comprarte directamente con{" "}
            <a
              href="https://www.mercadopago.cl"
              target="_blank"
              rel="noopener noreferrer"
              className={linkClass}
            >
              MercadoPago
            </a>{" "}
            sin necesidad de coordinarse contigo.
          </span>
        ),
      },
      {
        q: "¿Puedo publicar muchos libros?",
        a: (
          <span>
            Sí, todos los que quieras. Si tienes una biblioteca grande, también tenemos un{" "}
            <Link href="/mis-libros/importar" className={linkClass}>importador por CSV</Link> para subir todo de una sola vez.
          </span>
        ),
      },
      {
        q: "¿Cómo elimino una publicación?",
        a: (
          <span>
            Desde tu{" "}
            <Link href="/perfil" className={linkClass}>perfil</Link>, en la sección{" "}
            <Link href="/mis-libros" className={linkClass}>Mis Libros</Link>, puedes pausar o eliminar cualquier publicación cuando quieras.
          </span>
        ),
      },
    ],
  },
  {
    title: "Arriendos de libros",
    questions: [
      {
        q: "¿Cómo funciona el arriendo?",
        a: (
          <span>
            Algunos libros los lees una vez y ya — para esos armamos esto. Quien publica activa la opción al listar. Quien arrienda paga el arriendo (por 7, 14 o 30 días) más una{" "}
            <Link href="/devoluciones" className={linkClass}>garantía</Link>. Devuelves el libro en buen estado y recuperas la garantía completa.
          </span>
        ),
      },
      {
        q: "¿Cuánto cuesta arrendar un libro?",
        a: "El precio lo pone cada vendedor. Normalmente es una fracción del precio de venta — un libro de $12.000 puede quedar en $3.000 de arriendo más garantía reembolsable. La garantía suele ser el precio del libro completo, para que nadie pierda si el libro no vuelve.",
      },
      {
        q: "¿Qué pasa si no devuelvo el libro a tiempo?",
        a: "Se retiene la garantía como compensación al vendedor. No es un castigo, es simplemente que el libro ya no vuelve y quien lo prestó no queda a cero.",
      },
      {
        q: "¿La garantía es reembolsable?",
        a: (
          <span>
            Sí, completa. Si devuelves dentro del plazo y en buen estado, la{" "}
            <Link href="/devoluciones" className={linkClass}>garantía</Link> vuelve entera a tu cuenta de{" "}
            <a
              href="https://www.mercadopago.cl"
              target="_blank"
              rel="noopener noreferrer"
              className={linkClass}
            >
              MercadoPago
            </a>
            .
          </span>
        ),
      },
    ],
  },
  {
    title: "Cuenta y perfil",
    questions: [
      {
        q: "¿Cómo creo una cuenta?",
        a: (
          <span>
            Haz clic en{" "}
            <Link href="/register" className={linkClass}>
              <strong>Registrarse</strong>
            </Link>{" "}
            e ingresa tu nombre, correo y contraseña. No necesitas tarjeta de crédito.
          </span>
        ),
      },
      {
        q: "Olvidé mi contraseña, ¿qué hago?",
        a: (
          <span>
            En la pantalla de inicio de sesión, haz clic en{" "}
            <Link href="/reset-password" className={linkClass}>
              <strong>¿Olvidaste tu contraseña?</strong>
            </Link>{" "}
            para recibir un correo de recuperación.
          </span>
        ),
      },
      {
        q: "¿Puedo usar tuslibros.cl sin cuenta?",
        a: (
          <span>
            Sí, para mirar. Puedes ver el{" "}
            <Link href="/search" className={linkClass}>catálogo</Link>, buscar, explorar el{" "}
            <Link href="/mapa" className={linkClass}>mapa</Link>, todo sin registrarte. Para{" "}
            <Link href="/publish" className={linkClass}>publicar un libro</Link> o escribirle a alguien sí necesitas{" "}
            <Link href="/register" className={linkClass}>crear una cuenta</Link> — es un trámite de menos de un minuto.
          </span>
        ),
      },
    ],
  },
];

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-cream">

      {/* Hero */}
      <div className="relative h-64 overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=1200&q=80"
          alt="Librería"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-cream/70" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
          <h1 className="text-4xl font-bold text-ink mb-2">Preguntas frecuentes</h1>
          <p className="text-ink-muted text-lg max-w-xl">Lo que me preguntan más seguido. Si te falta algo, escríbeme.</p>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 py-12">
        {faqSections.map((section) => (
          <div key={section.title} className="mb-10">
            <h2 className="text-2xl font-bold text-ink mb-4 border-b-2 border-brand-600 pb-2 inline-block">
              {section.title}
            </h2>
            <div className="space-y-4">
              {section.questions.map((item) => (
                <div
                  key={item.q}
                  className="bg-white rounded-xl shadow-sm border border-cream-dark overflow-hidden"
                >
                  <div className="bg-cream-warm px-5 py-3">
                    <h3 className="font-semibold text-brand-600 text-base">{item.q}</h3>
                  </div>
                  <div className="px-5 py-4 text-ink-muted leading-relaxed">
                    {typeof item.a === "string" ? <p>{item.a}</p> : item.a}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* CTA */}
        <div className="mt-12 bg-white rounded-2xl border border-cream-dark shadow-sm px-6 py-8 text-center">
          <p className="text-xl font-bold text-ink mb-2">¿No encontraste lo que buscabas?</p>
          <p className="text-ink-muted mb-5">Escríbeme directo — respondo rápido.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/contacto"
              className="inline-block bg-brand-600 text-white font-semibold px-6 py-3 rounded-xl hover:bg-brand-700 transition-colors"
            >
              Ir a Contacto
            </Link>
            <a
              href="mailto:hola@tuslibros.cl"
              className="inline-block border border-brand-600 text-brand-600 font-semibold px-6 py-3 rounded-xl hover:bg-brand-50 transition-colors"
            >
              hola@tuslibros.cl
            </a>
          </div>
        </div>

      </main>
    </div>
  );
}
