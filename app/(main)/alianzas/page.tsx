import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Alianzas — tuslibros.cl",
  description:
    "Estamos armando alianzas con universidades, bibliotecas, centros de alumnos y librerías de segunda mano. Si quieres ser parte, escríbeme.",
  alternates: { canonical: "https://tuslibros.cl/alianzas" },
};

const IDEAS = [
  {
    name: "Bibliotecas universitarias",
    what: "Cuando un libro no está en la biblioteca o tiene lista de espera, el estudiante puede encontrarlo acá, usado, más barato, y probablemente a la vuelta del campus.",
  },
  {
    name: "Centros de alumnos",
    what: "Un canal directo para que los estudiantes intercambien la bibliografía del semestre entre ellos, sin intermediarios. Yo pongo la plataforma, ustedes ponen la comunidad.",
  },
  {
    name: "Coordinaciones de carrera",
    what: "Compártanme la bibliografía obligatoria del semestre y armamos una lista dirigida. Los estudiantes la encuentran fácil, los que tienen el libro pueden ofrecerlo.",
  },
  {
    name: "Librerías de segunda mano",
    what: "Una vitrina digital adicional, sin costo fijo, con carga masiva por CSV para que no tengan que subir libro por libro. Publicar es gratis.",
  },
];

export default function AlianzasPage() {
  return (
    <div className="min-h-screen bg-cream">
      <main className="max-w-3xl mx-auto px-4 py-16">
        {/* Status banner */}
        <div className="mb-10 bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 text-center">
          <p className="text-sm text-amber-900">
            <strong>Próximamente.</strong> Estamos recién abriendo esta conversación. Si te interesa ser de los primeros, escríbeme.
          </p>
        </div>

        {/* Hero */}
        <header className="text-center mb-12">
          <p className="text-xs font-medium tracking-[0.3em] uppercase text-brand-600 mb-3">
            Alianzas institucionales
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-ink mb-4 leading-tight">
            Hagamos circular los libros<br />
            <span className="italic text-brand-600">entre quienes los necesitan.</span>
          </h1>
          <p className="text-ink-muted max-w-xl mx-auto leading-relaxed">
            Si trabajas en una universidad, biblioteca, centro de alumnos o librería de segunda mano, probablemente estemos pensando en lo mismo: cómo hacer que los libros lleguen a más gente y cuesten menos.
          </p>
        </header>

        {/* La idea */}
        <section className="bg-white rounded-xl border border-cream-dark p-8 mb-10">
          <h2 className="font-display text-xl font-bold text-ink mb-4">Lo que tengo en la cabeza</h2>
          <div className="space-y-4 text-ink-muted leading-relaxed">
            <p>
              Una de las razones por las que armé tuslibros.cl es porque los libros universitarios son carísimos, se compran una vez, se usan un semestre, y después quedan en el estante. Mientras tanto, el semestre siguiente otro estudiante paga precio nuevo por el mismo libro.
            </p>
            <p>
              Eso no tiene por qué ser así. Si las instituciones que ya tienen la comunidad (universidades, centros de alumnos, bibliotecas) se suman, podemos armar algo que funcione mejor para todos: los estudiantes ahorran, los libros circulan, y quien los vende recupera algo.
            </p>
            <p>
              No necesito que integren nada técnico. No cobro por ser parte. Si hay ventas que salen de tus canales, te paso una comisión por referido — porque si tú ayudas a que esto crezca, es justo que también recibas algo.
            </p>
          </div>
        </section>

        {/* Ideas por tipo */}
        <section className="mb-10">
          <h2 className="font-display text-xl font-bold text-ink mb-6 text-center">Cómo podríamos colaborar</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {IDEAS.map((idea) => (
              <div key={idea.name} className="bg-white rounded-xl border border-cream-dark p-6">
                <h3 className="font-semibold text-ink mb-2">{idea.name}</h3>
                <p className="text-sm text-ink-muted leading-relaxed">{idea.what}</p>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-ink-muted mt-6 italic">
            ¿Tu caso es otro? Mejor, cuéntame y lo pensamos juntos.
          </p>
        </section>

        {/* CTA */}
        <section className="bg-brand-50 border border-brand-200 rounded-xl p-8 text-center">
          <h2 className="font-display text-xl font-bold text-ink mb-2">Conversemos 20 minutos</h2>
          <p className="text-sm text-ink-muted mb-6 max-w-md mx-auto">
            Sin compromiso. Te muestro{" "}
            <Link href="/search" className="text-brand-600 font-semibold hover:underline">
              la plataforma
            </Link>
            , me cuentas cómo es tu institución, y vemos si tiene sentido armar algo juntos.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="mailto:vero@tuslibros.cl?subject=Alianza%20con%20tuslibros.cl"
              className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
            >
              Escribirme a vero@tuslibros.cl
            </a>
            <Link
              href="/sobre-nosotros#contacto"
              className="text-sm text-brand-600 font-semibold hover:underline"
            >
              O por el formulario de contacto →
            </Link>
          </div>
          <p className="text-xs text-ink-muted mt-5 italic">— Vero, fundadora de tuslibros.cl</p>
        </section>
      </main>
    </div>
  );
}
