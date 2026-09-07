import Link from "next/link";
import AyudaNav from "@/components/ayuda/AyudaNav";
import AyudaContacto from "@/components/ayuda/AyudaContacto";

export const metadata = {
  title: "Preguntas frecuentes",
  description:
    "Cuánto cuesta publicar, quién paga el envío, por qué no ves el WhatsApp de un vendedor, si puedes pagar en efectivo y cómo darte de baja de tuslibros.cl.",
  alternates: { canonical: "https://tuslibros.cl/ayuda/preguntas" },
};

const linkClass = "text-brand-600 font-semibold hover:underline";

type Pregunta = {
  q: string;
  /** Respuesta en texto plano: se usa tal cual en el JSON-LD. */
  a: string;
  /** Enlace opcional que se muestra después de la respuesta. */
  link?: { href: string; label: string };
  /** Matiz que se agrega al final de la respuesta (por ejemplo, el retiro a domicilio en la RM). */
  d7?: string;
};

const preguntas: Pregunta[] = [
  {
    q: "¿Cuánto cuesta publicar?",
    a: "Nada. Solo hay comisión cuando vendes con despacho (8% del precio del libro), descontada automáticamente.",
  },
  {
    q: "¿Por qué no puedo ver el WhatsApp de un vendedor?",
    a: "Cuando el vendedor cobra por la plataforma, la compra va por el sitio. Así el pago queda protegido y el envío queda registrado. Puedes escribirle por Mensajes.",
    link: { href: "/mensajes", label: "Ir a Mensajes" },
  },
  {
    q: "¿Puedo pagar en efectivo si retiro en persona?",
    a: "No. El pago es siempre en línea, también en entregas en persona. Es lo que protege a las dos partes.",
  },
  {
    q: "¿Quién paga el envío?",
    a: "El comprador, al momento de pagar. El vendedor no paga nada al courier.",
  },
  {
    q: "¿El courier pasa a buscar el libro o tengo que llevarlo?",
    a: "Lo llevas tú: descargas la etiqueta desde Mis Ventas o el correo, la pegas en el paquete y lo dejas en una sucursal del courier indicado (Starken, Bluexpress o Chilexpress). No pagas nada al courier.",
    d7: "Si prefieres que pasen a buscarlo a tu casa (solo Región Metropolitana), usa el botón Pedir retiro a domicilio en Mis Ventas.",
    link: { href: "/ayuda/vender", label: "Ver la guía del vendedor" },
  },
  {
    q: "¿Puedo vender libros subrayados?",
    a: "Sí, indicando el estado “con marcas”.",
  },
  {
    q: "¿Envían fuera de Chile?",
    a: "Por ahora no.",
  },
  {
    q: "¿Qué pasa si el mismo libro se vende dos veces?",
    a: "No debería ocurrir: al pagarse, el libro sale del catálogo. Si pasa, te devolvemos el dinero completo y te avisamos.",
  },
  {
    q: "¿Cómo me doy de baja?",
    a: "Perfil → Eliminar cuenta. Tus libros se despublican y tus datos se eliminan según la política de privacidad.",
    link: { href: "/privacidad", label: "Política de privacidad" },
  },
];

export default function AyudaPreguntasPage() {
  return (
    <div className="min-h-screen bg-cream">
      <div className="bg-cream-warm border-b border-cream-dark">
        <div className="max-w-3xl mx-auto px-4 py-16 sm:py-20 text-center">
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-ink mb-3">Preguntas frecuentes</h1>
          <p className="text-ink-muted text-lg max-w-xl mx-auto">Lo que nos preguntan más seguido. Si te falta algo, escríbenos.</p>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 py-12">
        <AyudaNav actual="/ayuda/preguntas" />

        <div className="space-y-4">
          {preguntas.map((p) => (
            <div key={p.q} className="bg-white rounded-xl shadow-sm border border-cream-dark overflow-hidden">
              <div className="bg-cream-warm px-5 py-3">
                <h2 className="font-semibold text-brand-600 text-base">{p.q}</h2>
              </div>
              <div className="px-5 py-4 text-ink-muted leading-relaxed">
                <p>
                  {p.a}
                  {p.d7 && <> {p.d7}</>}
                </p>
                {p.link && (
                  <p className="mt-2 text-sm">
                    <Link href={p.link.href} className={linkClass}>{p.link.label} →</Link>
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center text-ink-muted">
          ¿Vendes o compras? Las guías completas están en{" "}
          <Link href="/ayuda/vender" className={linkClass}>Quiero vender</Link> y{" "}
          <Link href="/ayuda/comprar" className={linkClass}>Quiero comprar</Link>.
        </div>

        <AyudaContacto texto="Hola, tengo una pregunta sobre tuslibros.cl" />
      </main>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: preguntas.map((p) => ({
              "@type": "Question",
              name: p.q,
              acceptedAnswer: { "@type": "Answer", text: p.a },
            })),
          }),
        }}
      />
    </div>
  );
}
