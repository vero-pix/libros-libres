import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Nuestra historia — tuslibros.cl",
  description:
    "La historia larga de tuslibros.cl. Veinte años de una idea, una pausa obligada, y una segunda oportunidad. Por Verónica Velásquez.",
  openGraph: {
    title: "Nuestra historia — tuslibros.cl",
    description:
      "Veinte años de una idea, una pausa obligada, y una segunda oportunidad.",
    type: "article",
  },
};

export default function HistoriaPage() {
  return (
    <div className="min-h-screen bg-cream">
      <article className="max-w-2xl mx-auto px-4 py-16 sm:py-24">
        {/* Header */}
        <header className="mb-12 text-center">
          <p className="text-xs font-medium tracking-[0.3em] uppercase text-brand-600 mb-4">
            Nuestra historia
          </p>
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-ink leading-tight mb-4">
            Veinte años, una pausa,<br />
            <span className="italic text-brand-600">y una segunda oportunidad.</span>
          </h1>
          <p className="text-ink-muted">
            Por Vero
          </p>
        </header>

        {/* Body */}
        <div className="space-y-6 text-ink-muted leading-relaxed text-lg">
          <p>
            Esta idea no es nueva. La primera versión la armé hace como veinte
            años. Era más rudimentaria, claro — otra internet, otro país, otro
            yo. Pero la intuición era la misma: conectar a quienes tienen
            libros con quienes los buscan, sin que una plataforma grande se
            lleve la mitad en comisiones ni convierta a los lectores en
            usuarios.
          </p>

          <p>
            Aguanté esa primera iteración a pulso. Con plata mía, con tiempo
            mío, varios años. Crecía lento pero crecía. El problema es que
            los costos también crecían, y yo no era una empresa — era una
            persona con una obsesión. En algún momento tuve que soltarla.
            Dolió más de lo que pensé que dolería.
          </p>

          <p>
            Pasaron quince meses. Quince meses sin volver a mirar eso. Hacía
            otras cosas, trabajaba en otras cosas, me decía a mí misma que
            había sido una experiencia linda pero que ya estaba. Que había
            aprendido y que con eso bastaba.
          </p>

          <div className="bg-white border-l-4 border-l-brand-600 border border-cream-dark rounded-xl p-6 my-8">
            <p className="text-ink italic text-xl leading-relaxed">
              Un día estaba mirando la ciudad desde la ventana. Toda esa
              extensión de edificios, departamentos, casas. Y pensé: en
              cada una de esas ventanas hay una estantería. Y en cada
              estantería hay un libro que yo no sé que existe.
            </p>
          </div>

          <p>
            Un libro que alguien ya leyó, que quizás le cambió algo, y que
            ahora está ahí, durmiendo. Y yo, sin saberlo, paso caminando por
            abajo todos los días.
          </p>

          <p>
            Esa imagen no se me fue. Volví a pensar en la idea de hace veinte
            años, pero distinta. Ya no era solo &ldquo;que los lectores se
            conecten sin comisiones&rdquo;. Era algo más cercano, más físico,
            casi vecinal. Descubrir un libro que está literalmente al lado
            mío, sin algoritmo que me empuje otra cosa, sin tener que entrar
            a una librería. Y poder preguntarle a la persona que lo tiene:{" "}
            <em>&ldquo;¿está bueno?&rdquo;</em>. Como cuando te recomienda un
            libro una amiga.
          </p>

          <p>
            Eso es tuslibros.cl. Una segunda oportunidad para esa idea, ahora
            con mejores herramientas, con menos ego, y con muchísima más
            claridad sobre lo que no quiero que sea.
          </p>

          <h2 className="font-display text-2xl font-bold text-ink mt-12 mb-4">
            Lo que no quiero que sea
          </h2>

          <p>
            No quiero que sea otro marketplace frío donde los libros son
            productos y los lectores son usuarios. No quiero cobrarles a los
            vendedores por publicar. No quiero meter algoritmos en medio de
            una conversación entre dos personas que quieren hablar sobre un
            libro. No quiero que esto se parezca a las plataformas que me
            hicieron soltar la primera versión.
          </p>

          <p>
            Quiero que sea cercano. Que el libro que buscas probablemente
            esté en la estantería de al lado. Que puedas preguntarle a quien
            lo tiene cómo le pareció. Que si se venden cara a cara, yo no
            cobre nada. Que si usan las herramientas que armé para hacerlo
            más seguro — pago con <a href="https://www.mercadopago.cl" target="_blank" rel="noopener noreferrer" className="text-brand-600 font-semibold hover:underline">MercadoPago</a>, despacho por courier —
            entonces sí cobre algo, porque mantener eso cuesta. Pero siempre
            con la regla: la conversación es de ustedes, no mía.
          </p>

          <h2 className="font-display text-2xl font-bold text-ink mt-12 mb-4">
            Por qué te estoy contando esto
          </h2>

          <p>
            Porque si estás leyendo hasta acá, probablemente eres la clase de
            persona para la que estoy construyendo esto. Alguien que lee en
            papel, que guarda los libros, que los subraya, que no los tira
            cuando ya no los necesita. Alguien que entiende que un libro
            usado a veces vale más que uno nuevo, porque viene con las
            huellas de quien lo leyó antes.
          </p>

          <p>
            Esta es la segunda oportunidad. No quiero volver a soltarla.
          </p>

          <p className="text-right text-sm italic text-ink mt-8">— Vero</p>
        </div>

        {/* CTA */}
        <div className="mt-16 pt-12 border-t border-cream-dark text-center">
          <p className="text-ink-muted mb-6">
            Si quieres ser parte:
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/"
              className="inline-block bg-brand-600 hover:bg-brand-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
            >
              Explorar el catálogo
            </Link>
            <Link
              href="/publish"
              className="inline-block border-2 border-brand-600 text-brand-600 hover:bg-brand-600 hover:text-white font-semibold px-6 py-3 rounded-xl transition-colors"
            >
              Publicar un libro
            </Link>
          </div>
          <p className="text-xs text-ink-muted mt-4">
            <Link href="/como-funciona" className="text-brand-600 font-semibold hover:underline">
              ¿Cómo funciona exactamente?
            </Link>
          </p>
          <p className="text-xs text-ink-muted mt-3">
            ¿Quieres escribirme?{" "}
            <Link href="/sobre-nosotros#contacto" className="text-brand-600 hover:underline">
              Estoy acá
            </Link>
            .
          </p>
        </div>
      </article>
    </div>
  );
}
