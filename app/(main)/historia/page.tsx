import Link from "next/link";

export const metadata = {
  title: "De WordPress a Next.js en 1 semana — tuslibros.cl",
  description:
    "Cómo Verónica Velásquez reconstruyó un marketplace de libros usados con Next.js 14, Supabase y Claude AI en solo 7 días. Case study de desarrollo con inteligencia artificial.",
  openGraph: {
    title: "De WordPress a Next.js en 1 semana — tuslibros.cl",
    description:
      "Cómo reconstruí un marketplace de libros usados con inteligencia artificial en 7 días.",
    type: "article",
  },
};

const timeline = [
  {
    day: "Día 1",
    title: "Diseño y arquitectura",
    description:
      "Definición del stack tecnológico, esquema de base de datos en Supabase, estructura del proyecto con App Router y componentes reutilizables.",
  },
  {
    day: "Día 2",
    title: "MVP funcional",
    description:
      "Autenticación con Supabase Auth, publicación de libros con escáner ISBN por código de barras, mapa interactivo con Mapbox y geolocalización.",
  },
  {
    day: "Día 3",
    title: "Rediseño UI",
    description:
      "Pivote de diseño: de un enfoque centrado en el mapa a un marketplace estilo Martfury con grid de productos, cards y navegación intuitiva.",
  },
  {
    day: "Día 4",
    title: "Pagos y envíos",
    description:
      "Integración completa con MercadoPago, flujo de checkout con selección de courier y cálculo de costos de envío en tiempo real.",
  },
  {
    day: "Día 5",
    title: "Búsqueda y pedidos",
    description:
      "Filtros avanzados por categoría, precio y ubicación. Página Mis Pedidos con seguimiento de estado y notificaciones.",
  },
  {
    day: "Día 6",
    title: "Contenido y lanzamiento",
    description:
      "Landing page optimizada, páginas legales, meta tags para SEO y Open Graph, preparación completa para producción.",
  },
  {
    day: "Día 7",
    title: "En vivo en tuslibros.cl",
    description:
      "Deploy en Vercel, dominio personalizado configurado, SSL activo. El marketplace está en producción recibiendo usuarios reales.",
  },
];

const techStack = [
  { name: "Next.js 14", color: "bg-ink text-white" },
  { name: "TypeScript", color: "bg-blue-600 text-white" },
  { name: "Tailwind CSS", color: "bg-cyan-500 text-white" },
  { name: "Supabase", color: "bg-emerald-600 text-white" },
  { name: "Mapbox", color: "bg-indigo-600 text-white" },
  { name: "MercadoPago", color: "bg-sky-500 text-white" },
  { name: "Vercel", color: "bg-ink text-white" },
  { name: "Inteligencia Artificial", color: "bg-brand-600 text-white" },
];

const stats = [
  { value: "7", label: "días de desarrollo" },
  { value: "33+", label: "archivos creados" },
  { value: "2,100+", label: "líneas de código" },
  { value: "0", label: "líneas escritas manualmente" },
];

export default async function HistoriaPage() {
  return (
    <div className="min-h-screen bg-cream">

      {/* Hero */}
      <section className="bg-cream-warm border-b border-cream-dark py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-brand-600 font-semibold tracking-widest uppercase text-sm mb-4">
            Case Study
          </p>
          <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-6 text-ink">
            De WordPress a Next.js
            <br />
            <span className="text-brand-600">en 1 semana</span>
          </h1>
          <p className="text-lg md:text-xl text-ink-muted max-w-2xl mx-auto mb-8">
            Cómo reconstruí un marketplace de libros usados usando inteligencia
            artificial — sin escribir una sola línea de código manualmente.
          </p>
          <p className="text-sm text-ink-muted">
            Por{" "}
            <span className="text-ink font-medium">Verónica Velásquez</span>{" "}
            · Fundadora de tuslibros.cl
          </p>
        </div>
      </section>

      {/* Intro */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-lg text-ink-muted leading-relaxed">
            tuslibros.cl nació como un sitio WordPress con el theme Martfury.
            Funcionaba, pero era lento, difícil de personalizar y costoso de
            mantener. En abril de 2026, decidí reconstruirlo desde cero usando{" "}
            inteligencia artificial como copiloto de desarrollo. El
            resultado: un marketplace moderno, rápido y completamente
            personalizado — en solo 7 días.
          </p>
        </div>
      </section>

      {/* Timeline */}
      <section className="bg-cream-warm py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-ink mb-16">
            La semana que cambió todo
          </h2>
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-6 md:left-1/2 md:-translate-x-px top-0 bottom-0 w-0.5 bg-brand-600/30" />

            <div className="space-y-12">
              {timeline.map((item, i) => {
                const isLeft = i % 2 === 0;
                return (
                  <div
                    key={item.day}
                    className="relative flex items-start md:items-center"
                  >
                    {/* Dot */}
                    <div className="absolute left-6 md:left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-brand-600 border-4 border-cream-warm shadow z-10" />

                    {/* Card — mobile always right, desktop alternates */}
                    <div
                      className={`ml-14 md:ml-0 md:w-[45%] ${
                        isLeft
                          ? "md:mr-auto md:pr-12 md:text-right"
                          : "md:ml-auto md:pl-12"
                      }`}
                    >
                      <span className="inline-block text-xs font-bold tracking-widest uppercase text-brand-600 mb-1">
                        {item.day}
                      </span>
                      <h3 className="text-xl font-bold text-ink mb-2">
                        {item.title}
                      </h3>
                      <p className="text-ink-muted leading-relaxed text-sm">
                        {item.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-ink mb-4">
            Stack tecnológico
          </h2>
          <p className="text-ink-muted mb-12">
            Cada pieza elegida por rendimiento, developer experience y costo
            cero en etapa inicial.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {techStack.map((tech) => (
              <span
                key={tech.name}
                className={`${tech.color} px-5 py-2.5 rounded-full text-sm font-semibold shadow-sm`}
              >
                {tech.name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-cream-warm border-y border-cream-dark py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-ink mb-16">
            Los números
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-5xl md:text-6xl font-extrabold text-brand-600">
                  {stat.value}
                </p>
                <p className="text-ink-muted mt-2 text-sm">{stat.label}</p>
              </div>
            ))}
          </div>
          <p className="text-center text-ink-muted text-xs mt-10">
            * Bueno, tal vez unas pocas líneas para ajustes finales. Pero el
            punto se entiende.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-ink mb-12">
            ¿Quieres ver el resultado?
          </h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/"
              className="inline-block bg-brand-600 hover:bg-brand-700 text-white font-bold px-8 py-4 rounded-lg text-lg transition-colors shadow-lg"
            >
              Explorar tuslibros.cl
            </Link>
            <a
              href="https://tuslibros.cl"
              className="inline-block border-2 border-brand-600 text-brand-600 hover:bg-brand-600 hover:text-white font-bold px-8 py-4 rounded-lg text-lg transition-colors"
            >
              Explorar tuslibros.cl
            </a>
          </div>
          <p className="text-ink-muted text-sm mt-8">
            ¿Tienes un proyecto similar en mente?{" "}
            <a
              href="https://www.linkedin.com/in/economista-veronica-velasquez/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-600 hover:underline"
            >
              Conversemos en LinkedIn
            </a>
          </p>
        </div>
      </section>
    </div>
  );
}
