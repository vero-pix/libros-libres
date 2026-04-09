import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Alianzas Institucionales — tuslibros.cl",
  description:
    "Alianza sin costo para universidades, bibliotecas y centros de alumnos. Complementa tu catálogo con libros usados disponibles en tuslibros.cl.",
  alternates: { canonical: "https://tuslibros.cl/alianzas" },
};

const BENEFITS = [
  {
    icon: "📚",
    title: "Complementa tu catálogo",
    desc: "Cuando un libro no está disponible en la biblioteca, el estudiante lo encuentra en tuslibros.cl a 40-70% menos que nuevo.",
  },
  {
    icon: "🎓",
    title: "Servicio adicional sin costo",
    desc: "No requiere integración técnica. Basta un enlace en la ficha del libro o una mención en la sección de recursos.",
  },
  {
    icon: "💰",
    title: "Comisión por referido",
    desc: "Tu institución recibe una comisión por cada venta generada desde tus canales. Ingreso pasivo, sin esfuerzo operativo.",
  },
  {
    icon: "📍",
    title: "Búsqueda por ISBN y mapa",
    desc: "Los estudiantes buscan por ISBN, título o ubicación. Ven el libro más cercano en un mapa y reciben despacho a domicilio.",
  },
  {
    icon: "🔒",
    title: "Pago seguro con MercadoPago",
    desc: "El dinero se divide automáticamente entre vendedor y plataforma. Sin intermediarios manuales.",
  },
  {
    icon: "📦",
    title: "Despacho integrado",
    desc: "Coordinamos el envío a todo Chile. El estudiante recibe en su casa o punto de retiro.",
  },
];

const ALLIANCE_TYPES = [
  {
    name: "Biblioteca Universitaria",
    what: "Referencia en ficha de libros no disponibles",
    ask: "Enlace en portal o newsletter",
    time: "30 minutos para implementar",
  },
  {
    name: "Centro de Alumnos",
    what: "Canal de difusión a estudiantes",
    ask: "Publicación en redes del Centro",
    time: "1 reunión de 20 minutos",
  },
  {
    name: "Coordinación de Carrera",
    what: "Lista de textos del semestre → oferta dirigida",
    ask: "Compartir bibliografía obligatoria",
    time: "1 email",
  },
  {
    name: "Librería de Segunda Mano",
    what: "Vitrina digital sin costo fijo",
    ask: "Publicar inventario en la plataforma",
    time: "Carga masiva vía CSV",
  },
];

export default function AlianzasPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-4xl mx-auto px-4 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Alianzas Institucionales
          </h1>
          <p className="text-lg text-ink-muted max-w-2xl mx-auto">
            Complementa el catálogo de tu institución con libros usados disponibles en todo Chile.
            Sin costo, sin integración técnica, con comisión por referido.
          </p>
        </div>

        {/* Problem */}
        <div className="bg-ink text-cream rounded-2xl p-8 mb-12">
          <p className="text-xs font-mono uppercase tracking-widest text-cream-warm/60 mb-3">El problema que resolvemos</p>
          <p className="text-lg leading-relaxed">
            Cuando un título tiene lista de espera o no está disponible en la biblioteca,
            el estudiante queda sin opciones dentro de la institución.{" "}
            <span className="text-brand-400 font-semibold">
              Nosotros conectamos esa demanda con libros usados disponibles cerca del estudiante.
            </span>
          </p>
        </div>

        {/* Benefits grid */}
        <div className="mb-12">
          <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">Qué ofrecemos</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {BENEFITS.map((b) => (
              <div
                key={b.title}
                className="bg-white rounded-xl border border-cream-dark/30 p-5 hover:shadow-md transition-shadow"
              >
                <span className="text-2xl block mb-2">{b.icon}</span>
                <h3 className="font-semibold text-gray-900 text-sm mb-1">{b.title}</h3>
                <p className="text-xs text-ink-muted leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Alliance types */}
        <div className="mb-12">
          <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">Tipos de alianza</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {ALLIANCE_TYPES.map((a) => (
              <div
                key={a.name}
                className="bg-white rounded-xl border border-cream-dark/30 p-6"
              >
                <h3 className="font-bold text-gray-900 mb-3">{a.name}</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex gap-2">
                    <span className="text-brand-500 font-semibold flex-shrink-0">Ofrecemos:</span>
                    <span className="text-ink-muted">{a.what}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-brand-500 font-semibold flex-shrink-0">Pedimos:</span>
                    <span className="text-ink-muted">{a.ask}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-brand-500 font-semibold flex-shrink-0">Tiempo:</span>
                    <span className="text-ink-muted">{a.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* How it works for students */}
        <div className="bg-brand-50 rounded-2xl p-8 mb-12">
          <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">
            Cómo funciona para el estudiante
          </h2>
          <div className="grid sm:grid-cols-4 gap-6 text-center">
            {[
              { step: "1", title: "Busca", desc: "Por ISBN, título o en el mapa" },
              { step: "2", title: "Encuentra", desc: "Ve el libro más cercano disponible" },
              { step: "3", title: "Paga", desc: "Seguro con MercadoPago" },
              { step: "4", title: "Recibe", desc: "Despacho a domicilio coordinado" },
            ].map((s) => (
              <div key={s.step}>
                <div className="w-10 h-10 bg-brand-500 text-white rounded-full flex items-center justify-center font-bold text-lg mx-auto mb-2">
                  {s.step}
                </div>
                <p className="font-semibold text-gray-900 text-sm">{s.title}</p>
                <p className="text-xs text-ink-muted mt-1">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center bg-white rounded-2xl border border-cream-dark/30 p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Conversemos en 20 minutos
          </h2>
          <p className="text-sm text-ink-muted mb-6 max-w-md mx-auto">
            Sin compromiso. Le mostramos la plataforma, revisamos cómo encaja con su institución y activamos la alianza en el acto.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="mailto:vero@economics.cl?subject=Alianza%20institucional%20tuslibros.cl"
              className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-bold px-8 py-3.5 rounded-xl transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
              Escribir a vero@economics.cl
            </a>
            <Link
              href="/como-funciona"
              className="text-sm text-brand-600 font-semibold hover:underline"
            >
              Ver cómo funciona la plataforma &rarr;
            </Link>
          </div>
          <p className="text-xs text-gray-400 mt-4">
            Verónica Velásquez — Directora, tuslibros.cl
          </p>
        </div>
      </main>
    </div>
  );
}
