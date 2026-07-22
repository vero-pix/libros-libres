import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import ListingCard from "@/components/listings/ListingCard";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import { sortListingsForDisplay } from "@/lib/sortListings";
import type { ListingWithBook } from "@/types";

export const metadata: Metadata = {
  title: "Libros antiguos y de colección en Chile",
  description:
    "Encuentra libros antiguos, primeras ediciones, ediciones descatalogadas y rarezas literarias en Chile. Compra segura con MercadoPago y envío a todo el país.",
  alternates: { canonical: "https://tuslibros.cl/libros-antiguos" },
  keywords: [
    "libros antiguos Chile",
    "libros de colección Chile",
    "primeras ediciones",
    "libros raros",
    "libros descatalogados",
    "librería anticuaria online",
  ],
  openGraph: {
    title: "Libros antiguos y de colección en Chile",
    description:
      "Rescatamos primeras ediciones, rarezas y libros que creías perdidos. Encuentra esa edición especial en nuestro marketplace.",
    url: "https://tuslibros.cl/libros-antiguos",
    siteName: "tuslibros.cl",
    locale: "es_CL",
    type: "website",
  },
};

const faqs = [
  {
    q: "¿Qué hace que un libro sea considerado 'de colección' en tuslibros.cl?",
    a: "Destacamos libros que tienen un valor especial por su antigüedad, escasez o importancia editorial. Esto incluye primeras ediciones, libros firmados, ediciones numeradas, descatalogados o rarezas que ya no se encuentran en librerías tradicionales.",
  },
  {
    q: "¿Puedo revisar el estado del libro antes de comprarlo?",
    a: "Las publicaciones incluyen fotos reales subidas por el vendedor. Además, en la ficha puedes ver la condición declarada (como nuevo, muy bueno, aceptable). Tu pago con MercadoPago está protegido hasta que recibas y confirmes que el libro coincide con la descripción.",
  },
  {
    q: "¿A qué ciudades envían los libros antiguos?",
    a: "Llegamos a todo Chile mediante Starken, Chilexpress, Blue Express y 99 Minutos. También puedes usar el mapa para buscar libros antiguos cerca de ti y coordinar un retiro en mano directo con el vendedor.",
  },
  {
    q: "¿Tengo un libro antiguo, lo puedo vender aquí?",
    a: "Absolutamente. Publicar en tuslibros.cl es gratis y te permite llegar a coleccionistas de todo Chile. Solo cobramos una comisión del 8% cuando la venta se concreta. Puedes fijar el precio que estimes conveniente para tu ejemplar.",
  },
];

export default async function LibrosAntiguosPage() {
  const supabase = await createClient();

  const { data: featuredRaw } = await supabase
    .from("listings")
    .select(`*, book:books(*), seller:users(id, full_name, avatar_url, username)`)
    .eq("status", "active")
    .eq("is_collectible", true)
    .order("created_at", { ascending: false })
    .limit(12);

  const featured = sortListingsForDisplay((featuredRaw as unknown as ListingWithBook[]) ?? []).slice(0, 8);

  const { count: totalCollectible } = await supabase
    .from("listings")
    .select("id", { count: "exact", head: true })
    .eq("status", "active")
    .eq("is_collectible", true);

  return (
    <>
      <div className="min-h-screen bg-cream">
        <main className="max-w-6xl mx-auto px-6 py-10">
          <Breadcrumbs
            items={[
              { label: "Inicio", href: "/" },
              { label: "Libros antiguos y coleccionables" },
            ]}
          />

          <section className="mt-8 mb-16 max-w-3xl">
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-ink leading-[1.05] tracking-tight">
              Libros antiguos y coleccionables en Chile.
            </h1>
            <p className="mt-6 text-lg text-ink-muted leading-relaxed">
              Hay ediciones que ya no se imprimen, primeras ediciones con portadas icónicas y libros
              que tienen más historia en sus páginas que en la trama misma. En <strong className="text-ink">tuslibros.cl</strong> rescatamos
              las rarezas literarias de Chile para conectarlas con nuevos lectores y coleccionistas.
              Pago protegido y envío a todo el país.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/?collectible=1"
                className="inline-flex items-center px-6 py-3 bg-brand-500 text-white text-sm font-semibold rounded-md hover:bg-brand-600 transition-colors shadow"
              >
                Ver {totalCollectible ? `las ${totalCollectible} joyas disponibles` : "joyas disponibles"}
              </Link>
            </div>
          </section>

          {featured.length > 0 && (
            <section className="mb-16">
              <h2 className="font-display text-3xl font-bold text-ink mb-6">
                Algunas rarezas y primeras ediciones disponibles
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {featured.map((l) => (
                  <ListingCard key={l.id} listing={l} />
                ))}
              </div>
              <div className="mt-6 text-center">
                <Link
                  href="/?collectible=1"
                  className="inline-flex items-center text-brand-600 font-semibold hover:text-brand-700 transition-colors"
                >
                  Ver todos los libros de colección →
                </Link>
              </div>
            </section>
          )}

          <section className="mb-16 bg-white rounded-2xl p-8 md:p-10 border border-cream-dark">
             <div className="grid md:grid-cols-2 gap-10 items-center">
               <div>
                  <h2 className="font-display text-3xl font-bold text-ink mb-4">
                    ¿Qué hace valioso a un libro antiguo?
                  </h2>
                  <p className="text-ink-muted leading-relaxed mb-4">
                    No todos los libros viejos son valiosos, ni todos los valiosos son antiguos. En el mundo
                    del coleccionismo literario chileno, el valor lo determina la <strong>escasez y la demanda</strong>.
                  </p>
                  <ul className="space-y-3 text-sm text-ink-muted">
                    <li><strong className="text-ink">Primeras ediciones:</strong> La primera vez que una obra vio la luz. Las primeras ediciones de autores chilenos como Bolaño o Lemebel son muy buscadas.</li>
                    <li><strong className="text-ink">Libros descatalogados:</strong> Títulos que las editoriales decidieron no volver a imprimir, convirtiéndolos en piezas difíciles de encontrar.</li>
                    <li><strong className="text-ink">Firmados o dedicados:</strong> Un ejemplar que lleva la rúbrica original del autor aumenta exponencialmente su valor histórico.</li>
                  </ul>
               </div>
               <div className="bg-cream p-6 rounded-xl border border-brand-100">
                  <h3 className="font-display font-bold text-lg text-ink mb-2">Protege tu compra</h3>
                  <p className="text-sm text-ink-muted mb-4">
                    Comprar libros usados por internet siempre ha requerido confianza. Con nosotros,
                    el dinero no se libera al vendedor hasta que tú recibes el libro y confirmas que
                    la edición y el estado corresponden a lo publicado.
                  </p>
               </div>
             </div>
          </section>

          <section className="mb-12">
            <h2 className="font-display text-3xl font-bold text-ink mb-8">
              Preguntas frecuentes
            </h2>
            <div className="space-y-4">
              {faqs.map((f, i) => (
                <details
                  key={i}
                  className="bg-white rounded-xl border border-cream-dark p-5 group"
                >
                  <summary className="font-semibold text-ink cursor-pointer list-none flex justify-between items-center">
                    {f.q}
                    <span className="text-brand-500 group-open:rotate-180 transition-transform">▾</span>
                  </summary>
                  <p className="mt-3 text-sm text-ink-muted leading-relaxed">{f.a}</p>
                </details>
              ))}
            </div>
          </section>
        </main>
      </div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqs.map((f) => ({
              "@type": "Question",
              name: f.q,
              acceptedAnswer: {
                "@type": "Answer",
                text: f.a,
              },
            })),
          }),
        }}
      />
    </>
  );
}
