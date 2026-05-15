import Link from "next/link";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Vender Libros Usados en Chile | tuslibros.cl",
  description:
    "Publica y vende libros usados fácilmente en Chile. Llega a miles de lectores en tuslibros.cl.",
  alternates: { canonical: "https://tuslibros.cl/vender-libros-usados" },
  openGraph: {
    title: "Vender Libros Usados en Chile | tuslibros.cl",
    description:
      "Publica y vende libros usados fácilmente en Chile. Llega a miles de lectores en tuslibros.cl.",
    url: "https://tuslibros.cl/vender-libros-usados",
    siteName: "tuslibros.cl",
    locale: "es_CL",
    type: "website",
  },
};

const steps = [
  {
    n: "1",
    title: "Fotografía la portada o escanea el código de barras",
    desc: "Apunta la cámara al ISBN. Título, autor, editorial y sinopsis se completan solos. Si el libro es antiguo y no tiene código, los ingresas a mano — toma 2 minutos.",
  },
  {
    n: "2",
    title: "Fija el precio que tú quieras",
    desc: "Hay un comparador integrado que muestra el precio del mismo libro en Buscalibre y MercadoLibre. Tú decides — lo vendemos o lo arriendamos, o las dos cosas.",
  },
  {
    n: "3",
    title: "Espera al comprador (o no tanto)",
    desc: "Te avisamos por WhatsApp cuando alguien hace una oferta, escribe o compra. Los libros raros en buen precio se venden en horas.",
  },
];

const whatSells = [
  {
    title: "Libros raros y descatalogados",
    desc: "Primeras ediciones, ediciones cubanas, autores chilenos que ya no se reimprimen. Lo que no está en Buscalibre se vende bien acá.",
  },
  {
    title: "Novela negra y suspenso",
    desc: "Mankell, Larsson, P.D. James — alta rotación, compradores recurrentes. Una serie completa se vende como un bundle.",
  },
  {
    title: "Escolares y universitarios",
    desc: "Abril y julio disparan la demanda. Si tienes textos de carrera guardados, ese es el momento.",
  },
  {
    title: "Autores chilenos",
    desc: "Donoso, Bolaño, Parra, Teillier, Eltit. Hay demanda constante y poca oferta de ejemplares usados en buen estado.",
  },
  {
    title: "Precio bajo el mercado",
    desc: "El sweet spot: 40–60% menos que el precio nuevo. Eso convierte. Un libro a $8.000 que en librería cuesta $18.000 se vende rápido.",
  },
];

const faqItems = [
  {
    q: "¿Cómo vender libros usados en Chile?",
    a: "La manera más directa es publicarlos en tuslibros.cl: creas una cuenta gratis, fotografías la portada o escaneas el ISBN, fijas el precio y quedas visible para compradores en todo Chile. También puedes vender en ferias de libros, grupos de Facebook o MercadoLibre — pero sin pago protegido ni logística integrada.",
  },
  {
    q: "¿Cuánto puedo ganar vendiendo libros usados?",
    a: "Depende del libro y el precio que pongas. Un libro de ficción bien conservado a $6.000–$12.000 se mueve. Libros raros o técnicos pueden valer $20.000–$80.000. La clave es precio 40–60% bajo el valor nuevo y fotos reales. Varios vendedores en tuslibros.cl llevan más de 30 libros vendidos.",
  },
  {
    q: "¿Qué libros se venden más rápido?",
    a: "Los descatalogados, los de autores chilenos, los de series completas y los escolares en temporada (marzo–abril y julio–agosto). También el suspenso y la novela negra tienen alta rotación. Lo que no funciona bien: autoayuda genérica sin autor célebre, libros muy rayados o con páginas faltantes.",
  },
  {
    q: "¿Tiene costo publicar en tuslibros.cl?",
    a: "Publicar es gratis. Siempre. Cobramos una comisión de 8% solo cuando el libro se vende con pago por MercadoPago. Si coordinas entrega directa por WhatsApp, no hay costo de ningún tipo.",
  },
  {
    q: "¿Necesito conectar MercadoPago para vender?",
    a: "No es obligatorio. Puedes publicar sin MercadoPago y coordinar el pago directamente con el comprador (transferencia, efectivo). Lo que sí pierde el comprador es la protección de pago — eso puede frenar algunas compras. Recomendamos conectar MP porque sube la tasa de conversión.",
  },
  {
    q: "¿Cómo se hace el despacho del libro?",
    a: "Cuando el comprador paga, el sistema genera automáticamente una etiqueta de Starken, Chilexpress o Blue Express. Imprimes, pegas y dejas el paquete en la sucursal más cercana — o pides retiro en domicilio. El comprador rastrea el envío en tiempo real.",
  },
  {
    q: "¿Puedo vender libros sin ISBN?",
    a: "Sí. Libros antiguos, ediciones locales y publicaciones sin código de barras se ingresan manualmente: título, autor, año, condición y fotos. Muchos de los libros más valiosos de la plataforma son de ese tipo.",
  },
];

export default function VenderLibrosUsadosPage() {
  return (
    <>
      <div className="min-h-screen bg-cream">
        <main className="max-w-4xl mx-auto px-6 py-10">
          <Breadcrumbs
            items={[
              { label: "Inicio", href: "/" },
              { label: "Vender libros usados" },
            ]}
          />

          {/* Hero */}
          <section className="mt-8 mb-16">
            <h1 className="font-display text-4xl sm:text-5xl font-bold text-ink leading-[1.1] tracking-tight">
              Vender libros usados en Chile
            </h1>
            <p className="mt-5 text-lg text-ink-muted leading-relaxed max-w-2xl">
              Esos libros que ya leíste y no vas a leer de nuevo están ocupando espacio.
              Alguien los está buscando ahora mismo. En <strong className="text-ink">tuslibros.cl</strong> los
              publicas gratis, fijas el precio tú y el pago llega directo a tu cuenta.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/publish"
                className="inline-flex items-center px-7 py-3.5 bg-brand-500 text-white font-semibold rounded-xl hover:bg-brand-600 transition-colors shadow-sm text-sm"
              >
                Publicar libro
              </Link>
              <Link
                href="/como-funciona"
                className="inline-flex items-center px-7 py-3.5 bg-white border border-cream-dark text-ink font-semibold rounded-xl hover:border-brand-400 transition-colors text-sm"
              >
                Cómo funciona →
              </Link>
            </div>
          </section>

          {/* Cómo funciona */}
          <section className="mb-16">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-ink mb-8">
              Cómo publicar un libro en 3 pasos
            </h2>
            <div className="space-y-4">
              {steps.map((step) => (
                <div
                  key={step.n}
                  className="flex gap-5 bg-white border border-cream-dark/50 rounded-xl p-6"
                >
                  <div className="flex-shrink-0 w-8 h-8 bg-brand-500 text-white text-sm font-bold rounded-full flex items-center justify-center">
                    {step.n}
                  </div>
                  <div>
                    <h3 className="font-semibold text-ink mb-1">{step.title}</h3>
                    <p className="text-sm text-ink-muted leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Qué se vende */}
          <section className="mb-16">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-ink mb-2">
              Qué libros usados se venden mejor
            </h2>
            <p className="text-ink-muted mb-8 text-sm">
              No todos los libros rotan igual. Esto es lo que hemos visto funcionar:
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              {whatSells.map((item) => (
                <div
                  key={item.title}
                  className="bg-white border border-cream-dark/50 rounded-xl p-5"
                >
                  <h3 className="font-semibold text-ink mb-1 text-sm">{item.title}</h3>
                  <p className="text-xs text-ink-muted leading-relaxed">{item.desc}</p>
                </div>
              ))}
              <div className="sm:col-span-2 bg-cream-warm border border-cream-dark/40 rounded-xl p-5">
                <p className="text-sm text-ink-muted">
                  <strong className="text-ink">Consejo real:</strong> el precio es más determinante
                  que el libro. Un título mediano bien priceado convierte mejor que un clásico
                  caro. Mira el comparador integrado antes de publicar.
                </p>
              </div>
            </div>
          </section>

          {/* Comisiones claras */}
          <section className="mb-16 bg-ink text-cream rounded-2xl p-8">
            <h2 className="font-display text-2xl font-bold mb-4">
              Costos reales, sin letra chica
            </h2>
            <ul className="space-y-3 text-sm text-cream/85">
              <li className="flex gap-3">
                <span className="text-brand-400 font-bold shrink-0">✓</span>
                <span>Publicar es gratis. Uno o cien libros, da igual.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-brand-400 font-bold shrink-0">✓</span>
                <span>Comisión de 8% solo si usas pago con MercadoPago. Si coordinan en persona, cero.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-brand-400 font-bold shrink-0">✓</span>
                <span>El comprador paga el despacho. Tú no pones nada de tu bolsillo para enviar.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-brand-400 font-bold shrink-0">✓</span>
                <span>Sin suscripción mensual. Sin cargos fijos. Sin sorpresas.</span>
              </li>
            </ul>
            <Link
              href="/publish"
              className="inline-flex items-center mt-6 px-6 py-3 bg-brand-500 text-white text-sm font-semibold rounded-xl hover:bg-brand-600 transition-colors"
            >
              Publicar libro gratis →
            </Link>
          </section>

          {/* FAQ */}
          <section className="mb-16">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-ink mb-8">
              Preguntas frecuentes
            </h2>
            <div className="space-y-3">
              {faqItems.map((item) => (
                <details
                  key={item.q}
                  className="group bg-white border border-cream-dark/50 rounded-xl p-5 cursor-pointer"
                >
                  <summary className="font-semibold text-ink text-sm list-none flex items-center justify-between gap-4">
                    {item.q}
                    <span className="text-brand-500 text-lg group-open:rotate-45 transition-transform duration-200 shrink-0">
                      +
                    </span>
                  </summary>
                  <p className="mt-3 text-sm text-ink-muted leading-relaxed">{item.a}</p>
                </details>
              ))}
            </div>
          </section>

          {/* Internal links */}
          <section className="mb-12 border-t border-cream-dark pt-10">
            <p className="text-xs text-ink-muted uppercase tracking-widest font-semibold mb-4">
              También puede interesarte
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/search"
                className="text-sm text-brand-600 font-medium hover:text-brand-700 underline underline-offset-2 transition-colors"
              >
                Explorar libros disponibles
              </Link>
              <span className="text-ink-muted">·</span>
              <Link
                href="/como-funciona"
                className="text-sm text-brand-600 font-medium hover:text-brand-700 underline underline-offset-2 transition-colors"
              >
                Cómo funciona la plataforma
              </Link>
              <span className="text-ink-muted">·</span>
              <Link
                href="/vender"
                className="text-sm text-brand-600 font-medium hover:text-brand-700 underline underline-offset-2 transition-colors"
              >
                Vender en tuslibros.cl
              </Link>
              <span className="text-ink-muted">·</span>
              <Link
                href="/solicitudes"
                className="text-sm text-brand-600 font-medium hover:text-brand-700 underline underline-offset-2 transition-colors"
              >
                Lo que buscan los compradores
              </Link>
            </div>
          </section>
        </main>
      </div>

      {/* FAQPage schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqItems.map((item) => ({
              "@type": "Question",
              name: item.q,
              acceptedAnswer: { "@type": "Answer", text: item.a },
            })),
          }),
        }}
      />

      {/* BreadcrumbList schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Inicio", item: "https://tuslibros.cl" },
              { "@type": "ListItem", position: 2, name: "Vender libros usados", item: "https://tuslibros.cl/vender-libros-usados" },
            ],
          }),
        }}
      />

      {/* HowTo schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "HowTo",
            name: "Cómo vender libros usados en Chile",
            description: "Pasos para publicar y vender libros usados en tuslibros.cl",
            step: steps.map((s) => ({
              "@type": "HowToStep",
              name: s.title,
              text: s.desc,
            })),
          }),
        }}
      />
    </>
  );
}
