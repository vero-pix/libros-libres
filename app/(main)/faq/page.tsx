// import Image from "next/image"; // ya no se usa: encabezado sin foto stock (20 jul 2026)
import Link from "next/link";
import { isValidElement, type ReactNode } from "react";

export const metadata = {
  title: "Preguntas frecuentes",
  description:
    "Resuelve tus dudas sobre comprar y vender libros usados en tuslibros.cl. Cómo funciona el pago con MercadoPago, despachos a Chile y más.",
  alternates: { canonical: "https://tuslibros.cl/faq" },
};

const linkClass = "text-brand-600 font-semibold hover:underline";

/**
 * Serializa una respuesta del FAQ (string o JSX) a texto plano para el JSON-LD.
 * Devuelve null si el nodo no se puede serializar con certeza — en ese caso la
 * pregunta se omite del schema, que es preferible a publicar una respuesta falsa.
 * Antes acá había un fallback a item.q que hacía que Google recibiera la pregunta
 * repetida como respuesta en casi las 15 entradas.
 */
function answerToPlainText(node: ReactNode): string | null {
  if (node === null || node === undefined || typeof node === "boolean") return "";
  if (typeof node === "string") return node;
  if (typeof node === "number") return String(node);

  if (Array.isArray(node)) {
    const parts = node.map(answerToPlainText);
    if (parts.some((p) => p === null)) return null;
    return parts.join("");
  }

  if (isValidElement(node)) {
    const { children } = node.props as { children?: ReactNode };
    // Componentes propios: no podemos saber qué renderizan sin ejecutarlos.
    if (typeof node.type !== "string" && children === undefined) return null;
    // Elementos DOM sin hijos (<br />, <hr />) no aportan texto.
    if (children === undefined) return "";
    const inner = answerToPlainText(children);
    if (inner === null) return null;
    // Los <li> son frases independientes: separarlas para que no se peguen.
    return node.type === "li" ? `${inner.trim()}. ` : inner;
  }

  return null;
}

function normalizeAnswer(text: string): string {
  return text
    .replace(/\s+/g, " ")
    .replace(/\s+([.,;:])/g, "$1")
    .replace(/\.\s*\./g, ".")
    .trim();
}

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
        a: (
          <span>
            Pagas el precio publicado. Nada escondido, nada raro. Si pagas con{" "}
            <a
              href="https://www.mercadopago.cl"
              target="_blank"
              rel="noopener noreferrer"
              className={linkClass}
            >
              MercadoPago
            </a>
            , además tienes <strong>7 días para devolver el libro</strong> si llega dañado, si es distinto al publicado o si viene en peor estado del que decía la ficha —{" "}
            <Link href="/devoluciones" className={linkClass}>acá está la política completa</Link>.
          </span>
        ),
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
            (Shipit hoy, más integraciones en camino). Cobro un <strong>8% del precio del libro</strong>, igual para todos. Si coordinas todo por WhatsApp y entregas en persona, no pagas nada.
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
            <Link href="/forgot-password" className={linkClass}>
              <strong>¿Olvidaste tu contraseña?</strong>
            </Link>{" "}
            para recibir un código de recuperación por correo.
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

      {/* Hero — encabezado limpio de marca (sin foto stock, mejor contraste) */}
      <div className="bg-cream-warm border-b border-cream-dark">
        <div className="max-w-3xl mx-auto px-4 py-16 sm:py-20 text-center">
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-ink mb-3">Preguntas frecuentes</h1>
          <p className="text-ink-muted text-lg max-w-xl mx-auto">Lo que me preguntan más seguido. Si te falta algo, escríbeme.</p>
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
              href="mailto:vero@tuslibros.cl"
              className="inline-block border border-brand-600 text-brand-600 font-semibold px-6 py-3 rounded-xl hover:bg-brand-50 transition-colors"
            >
              vero@tuslibros.cl
            </a>
          </div>
        </div>

      </main>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqSections.flatMap((s) =>
              s.questions.flatMap((item) => {
                const raw = answerToPlainText(item.a);
                if (raw === null) return [];
                const text = normalizeAnswer(raw);
                // Sin respuesta real, o una que solo repite la pregunta: fuera del schema.
                if (!text || text === item.q) return [];
                return [
                  {
                    "@type": "Question",
                    name: item.q,
                    acceptedAnswer: { "@type": "Answer", text },
                  },
                ];
              })
            ),
          }),
        }}
      />
    </div>
  );
}
