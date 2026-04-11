import Image from "next/image";

export const metadata = {
  title: "Preguntas frecuentes — tuslibros.cl",
};

const faqSections = [
  {
    title: "Para compradores",
    questions: [
      {
        q: "¿Cómo compro un libro?",
        a: (
          <ol className="list-decimal list-inside space-y-1 text-ink-muted">
            <li>Busca el libro en el catálogo, mapa o barra de búsqueda</li>
            <li>Haz clic en el libro que te interesa</li>
            <li>Contacta al vendedor por WhatsApp o compra directamente con MercadoPago</li>
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
        a: "Sí, y me gusta que así sea. Armé tuslibros.cl para que la conversación entre quien vende y quien compra sea directa, sin que yo me meta en el medio. Conversen por WhatsApp, pónganse de acuerdo. Y si quieren pagar con MercadoPago, también pueden ajustar el precio entre ustedes para repartirse la comisión como les acomode. Mi regla es una sola: libertad. — Vero",
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
            Las comisiones <strong>solo aplican</strong> cuando usas nuestras herramientas integradas: pago con <strong>MercadoPago</strong> (y otras pasarelas que sumemos) o <strong>despacho por courier</strong> (Shipit hoy, más integraciones en camino). Si coordinas todo por WhatsApp y entregas en persona, no pagas nada.
          </span>
        ),
      },
      {
        q: "¿Cómo publico un libro?",
        a: (
          <ol className="list-decimal list-inside space-y-1 text-ink-muted">
            <li>Inicia sesión en tu cuenta</li>
            <li>Haz clic en <strong>Publicar libro</strong></li>
            <li>Escanea el código de barras o ingresa el ISBN</li>
            <li>Completa precio y estado del libro</li>
            <li>Marca la ubicación en el mapa</li>
            <li>Tu libro aparece en el catálogo al instante</li>
          </ol>
        ),
      },
      {
        q: "¿Cómo me contactan los compradores?",
        a: "Los compradores te escriben directamente por WhatsApp al número que registraste en tu perfil. También pueden comprarte directamente con MercadoPago sin necesidad de coordinarse contigo.",
      },
      {
        q: "¿Puedo publicar muchos libros?",
        a: "Sí, todos los que quieras. Si tienes una biblioteca grande, también tenemos un importador por CSV para subir todo de una sola vez.",
      },
      {
        q: "¿Cómo elimino una publicación?",
        a: "Desde tu perfil, en la sección Mis Libros, puedes pausar o eliminar cualquier publicación cuando quieras.",
      },
    ],
  },
  {
    title: "Arriendos de libros",
    questions: [
      {
        q: "¿Cómo funciona el arriendo?",
        a: "Algunos libros los lees una vez y ya — para esos armamos esto. Quien publica activa la opción al listar. Quien arrienda paga el arriendo (por 7, 14 o 30 días) más una garantía. Devuelves el libro en buen estado y recuperas la garantía completa.",
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
        a: "Sí, completa. Si devuelves dentro del plazo y en buen estado, la garantía vuelve entera a tu cuenta de MercadoPago.",
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
            Haz clic en <strong>Registrarse</strong> e ingresa tu nombre, correo y contraseña. No necesitas tarjeta de crédito.
          </span>
        ),
      },
      {
        q: "Olvidé mi contraseña, ¿qué hago?",
        a: (
          <span>
            En la pantalla de inicio de sesión, haz clic en <strong>¿Olvidaste tu contraseña?</strong> para recibir un correo de recuperación.
          </span>
        ),
      },
      {
        q: "¿Puedo usar tuslibros.cl sin cuenta?",
        a: "Sí, para mirar. Puedes ver el catálogo, buscar, explorar el mapa, todo sin registrarte. Para publicar un libro o escribirle a alguien sí necesitas crear una cuenta — es un trámite de menos de un minuto.",
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

      </main>
    </div>
  );
}
