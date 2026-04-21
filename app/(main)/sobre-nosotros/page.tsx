import Image from "next/image";
import Link from "next/link";
import ContactForm from "@/components/ui/ContactForm";

export const metadata = {
  title: "Sobre tuslibros.cl — marketplace chileno de libros usados",
  description:
    "La historia detrás de tuslibros.cl: un marketplace chileno de libros usados construido en Providencia. Por qué los libros físicos, por qué el mapa, y por qué creemos que el libro que buscas está en la estantería de al lado.",
  alternates: { canonical: "https://tuslibros.cl/sobre-nosotros" },
};

const values = [
  { icon: "📖", title: "Los libros son de papel", description: "Nos gusta el olor, el peso, las páginas dobladas. Lo físico importa." },
  { icon: "🏠", title: "Cerca", description: "El libro que buscas probablemente está en la estantería de al lado." },
  { icon: "🤝", title: "Sin mucho medio", description: "Hablan directo vendedor y comprador. Yo no me meto en el medio." },
  { icon: "🆓", title: "Publicar es gratis", description: "Siempre. No hay versión premium escondida." },
];

export default function SobreNosotrosPage() {
  return (
    <div className="min-h-screen bg-cream">

      {/* Hero */}
      <div className="relative h-64 overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1200&q=80"
          alt="Comunidad"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-cream/70" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
          <h1 className="text-4xl font-bold text-ink mb-2">Hola, soy Vero</h1>
          <p className="text-ink-muted text-lg max-w-xl">Y esta es la historia detrás de tuslibros.cl</p>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 py-12">
        {/* Mission / intro */}
        <section className="mb-12">
          <div className="bg-cream-warm rounded-xl p-8 border border-cream-dark border-l-4 border-l-brand-600">
            <h2 className="text-sm uppercase tracking-widest text-brand-600 font-semibold mb-3">Por qué existe tuslibros.cl</h2>
            <p className="text-ink text-lg leading-relaxed font-light">
              Nació de la ilusión. Del amor por los libros de papel, por su peso, por su olor, por subrayarlos. Es, casi, un gesto romántico.
            </p>
          </div>
        </section>

        {/* Origin Story — real */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-ink mb-4 border-b-2 border-brand-600 pb-2 inline-block">
            Cómo empezó (la versión honesta)
          </h2>
          <div className="bg-white rounded-xl shadow-sm border border-cream-dark p-6 space-y-4 text-ink-muted leading-relaxed">
            <p>
              Hace unos 20 años armé una primera versión de tuslibros.cl. Era la misma idea — conectar lectores directo, sin las comisiones y los líos de las plataformas que ya existían. La mantuve a pulso, con plata mía, durante años. Crecía, pero el costo también crecía, y en algún momento tuve que soltarla. Dolió.
            </p>
            <p>
              Pasaron quince meses. Un día estaba mirando la ciudad desde la ventana — toda esa extensión de edificios, departamentos, casas — y pensé: en cada una de esas ventanas hay una estantería. Y en cada estantería hay un libro que yo no sé que existe, que alguien ya leyó, que quizás me cambiaría algo si lo encontrara.
            </p>
            <p>
              Imaginé poder ver todo eso conectado. Descubrir un libro que está literalmente al lado mío, sin tener que entrar a una librería, sin algoritmo que me empuje otra cosa. Y poder preguntarle a la persona que lo tiene: &ldquo;¿está bueno?&rdquo;. Como cuando te recomienda un libro una amiga.
            </p>
            <p>
              Así nació tuslibros.cl. Una segunda oportunidad para esa idea, ahora con mejores herramientas y con menos ego. Si llegaste hasta acá leyendo, probablemente eres parte de lo que estoy intentando construir.
            </p>
            <p className="text-right text-sm italic text-ink">— Vero</p>
          </div>
        </section>

        {/* Values */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-ink mb-6 border-b-2 border-brand-600 pb-2 inline-block">
            Lo que importa
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {values.map((v) => (
              <div key={v.title} className="bg-white rounded-xl shadow-sm border border-cream-dark p-5 text-center">
                <div className="text-3xl mb-2">{v.icon}</div>
                <h3 className="font-bold text-ink mb-1">{v.title}</h3>
                <p className="text-ink-muted text-sm">{v.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Who is it for */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-ink mb-4 border-b-2 border-brand-600 pb-2 inline-block">
            ¿Para quién es tuslibros.cl?
          </h2>
          <div className="bg-white rounded-xl shadow-sm border border-cream-dark p-6">
            <p className="text-ink-muted leading-relaxed">
              Para quien lee en papel y no le gusta tirar los libros a la basura cuando ya no los necesita. Para quien busca algo específico y prefiere encontrarlo a la vuelta de la esquina antes que pagar despacho. Para quien le gusta conversar sobre libros con desconocidos. Para ti, básicamente, si llegaste hasta acá leyendo.
            </p>
            <div className="mt-5 flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/search" className="inline-block bg-brand-600 hover:bg-brand-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm">
                Buscar libros
              </Link>
              <Link href="/publish" className="inline-block border-2 border-brand-600 text-brand-600 hover:bg-brand-600 hover:text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm">
                Publicar el mío
              </Link>
            </div>
          </div>
        </section>

        {/* Contact */}
        <section>
          <div className="bg-brand-50 rounded-xl p-6 text-center border border-brand-200">
            <h2 className="text-xl font-bold text-ink mb-2">Escríbeme</h2>
            <p className="text-ink-muted mb-4">Sugerencias, reclamos, dudas, ideas — me llegan todas y las leo yo.</p>
            <a
              href="https://wa.me/56994583067?text=Hola%2C%20tengo%20una%20consulta%20sobre%20tuslibros.cl"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Escríbenos por WhatsApp
            </a>
            <p className="text-xs text-ink-muted mt-3">Trato de responder dentro del día.</p>
          </div>
        </section>

        {/* Contact form */}
        <section id="contacto" className="scroll-mt-24">
          <ContactForm />
        </section>
      </main>
    </div>
  );
}
