import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import ListingCard from "@/components/listings/ListingCard";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import { sortListingsForDisplay } from "@/lib/sortListings";
import type { ListingWithBook } from "@/types";

export const revalidate = 300;

const URL = "https://tuslibros.cl/libros-antiguos";

export const metadata: Metadata = {
  title: "Libros antiguos y de colección en Chile: comprar y vender",
  description:
    "Compra y vende libros antiguos en Chile: primeras ediciones, ediciones del siglo XIX, libros descatalogados y de colección. Fotos reales, pago protegido con MercadoPago y envío a todo el país.",
  alternates: { canonical: URL },
  keywords: [
    "libros antiguos",
    "libros antiguos chile",
    "comprar libros antiguos",
    "vender libros antiguos",
    "compra de libros antiguos",
    "quien compra libros antiguos",
    "libros de coleccion chile",
    "primeras ediciones",
    "libros raros",
    "libros descatalogados",
    "libros siglo xix",
    "libreria anticuaria online chile",
  ],
  openGraph: {
    title: "Libros antiguos y de colección en Chile",
    description:
      "Primeras ediciones, ediciones del siglo XIX, rarezas y descatalogados. Comprar y vender con fotos reales y pago protegido.",
    url: URL,
    siteName: "tuslibros.cl",
    locale: "es_CL",
    type: "website",
  },
};

const faqs = [
  {
    q: "¿Quién compra libros antiguos en Chile?",
    a: "Coleccionistas, libreros de viejo, bibliotecas y lectores que buscan una edición concreta. En tuslibros.cl los encuentras a todos en un mismo lugar: publicas tu ejemplar con fotos y precio, y el que lo busca te escribe o lo compra directo. No hay intermediario que te tase a la baja.",
  },
  {
    q: "¿Cómo sé cuánto vale mi libro antiguo?",
    a: "Mira qué piden por la misma edición en IberLibro, Buscalibre o en librerías de viejo, y ajusta por el estado real del ejemplar (encuadernación, manchas, hojas sueltas, sellos). Los libros antiguos en Chile suelen venderse entre un 40% y un 60% más baratos que en el extranjero, y aun así se venden. Si dudas, publícalo y deja que el mercado te diga.",
  },
  {
    q: "¿Qué hace que un libro sea 'de colección'?",
    a: "Escasez y demanda. Primeras ediciones, ediciones numeradas o firmadas, libros del siglo XIX y anteriores, títulos descatalogados que ya no se reimprimen y colecciones cerradas como la Biblioteca de Babel de Siruela. Un libro viejo no es necesariamente valioso; uno valioso no es necesariamente viejo.",
  },
  {
    q: "¿Puedo revisar el estado antes de comprar?",
    a: "Sí. Cada publicación lleva fotos reales del ejemplar y la condición declarada por el vendedor. Si pagas con MercadoPago el dinero queda protegido hasta que recibes el libro y confirmas que corresponde a lo publicado.",
  },
  {
    q: "¿Envían libros antiguos a regiones?",
    a: "A todo Chile por courier (Starken, Chilexpress, Blue Express). Para ejemplares frágiles puedes coordinar retiro en mano con el vendedor, que aparece en la ficha con su comuna.",
  },
  {
    q: "¿Cuánto cobra tuslibros.cl por vender un libro antiguo?",
    a: "Publicar es gratis. Solo cobro 8% sobre el precio del libro cuando la venta pasa por MercadoPago o por despacho con courier. Si lo vendes en persona, no pago nada.",
  },
];

const TIPOS = [
  { title: "Ediciones del siglo XIX", desc: "Clásicos traducidos y encuadernados en su época: Plutarco, Séneca, Pascal. Papel de trapo, lomos en piel, tipografía que ya no existe." },
  { title: "Primeras ediciones", desc: "La primera vez que un libro salió a la calle. Las de autores chilenos y del boom latinoamericano (Seix Barral, Zig-Zag, Nascimento) son las más buscadas." },
  { title: "Colecciones cerradas", desc: "Series que ya no se completan: la Biblioteca de Babel de Borges en Siruela, la Biblioteca Clásica Gredos, las primeras Alianza de bolsillo." },
  { title: "Descatalogados", desc: "Títulos que ninguna editorial volvió a imprimir. No son antiguos, pero solo existen usados." },
];

export default async function LibrosAntiguosPage() {
  const supabase = await createClient();

  const { data: featuredRaw } = await supabase
    .from("listings")
    .select(`*, book:books(*), seller:users(id, full_name, avatar_url, username, mercadopago_user_id)`)
    .eq("status", "active")
    .eq("is_collectible", true)
    .order("price", { ascending: false })
    .limit(48);

  const featured = sortListingsForDisplay((featuredRaw as unknown as ListingWithBook[]) ?? []).slice(0, 24);

  const { count: totalCollectible } = await supabase
    .from("listings")
    .select("id", { count: "exact", head: true })
    .eq("status", "active")
    .eq("is_collectible", true);

  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Libros antiguos y de colección en Chile",
    description:
      "Libros antiguos, primeras ediciones, ediciones del siglo XIX y descatalogados a la venta en Chile, con fotos reales y pago protegido.",
    url: URL,
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: "https://tuslibros.cl" },
      { "@type": "ListItem", position: 2, name: "Libros antiguos y de colección", item: URL },
    ],
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      <div className="min-h-screen bg-cream">
        <main className="max-w-6xl mx-auto px-6 py-10">
          <Breadcrumbs
            items={[
              { label: "Inicio", href: "/" },
              { label: "Libros antiguos y de colección" },
            ]}
          />

          <section className="mt-8 mb-16 max-w-3xl">
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-ink leading-[1.05] tracking-tight">
              Libros antiguos y de colección —{" "}
              <span className="italic text-brand-600">comprar y vender en Chile.</span>
            </h1>
            <p className="mt-6 text-lg text-ink-muted leading-relaxed">
              Ediciones del siglo XIX, primeras ediciones, colecciones que ya no se completan y
              libros que ninguna editorial volvió a imprimir. Cada ejemplar con fotos reales, el
              vendedor a la vista y pago protegido. Y si el que tiene la joya eres tú, acá la
              ve gente que sabe lo que vale.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/?collectible=1"
                className="inline-flex items-center px-6 py-3 bg-brand-500 text-white text-sm font-semibold rounded-xl hover:bg-brand-600 transition-colors shadow-sm"
              >
                Ver {totalCollectible ? `los ${totalCollectible} ejemplares` : "los ejemplares"} disponibles
              </Link>
              <Link
                href="/publish"
                className="inline-flex items-center px-6 py-3 bg-white border border-ink/20 text-ink text-sm font-semibold rounded-xl hover:border-brand-500 hover:text-brand-600 transition-colors"
              >
                Vender un libro antiguo →
              </Link>
            </div>
          </section>

          {featured.length > 0 && (
            <section className="mb-16">
              <h2 className="font-display text-3xl font-bold text-ink mb-6">
                Disponibles ahora
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

          <section className="mb-16">
            <h2 className="font-display text-2xl font-bold text-ink mb-4">Qué se entiende por libro de colección</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {TIPOS.map((b) => (
                <div key={b.title} className="bg-white rounded-xl p-5 border border-cream-dark">
                  <h3 className="font-semibold text-ink mb-1 text-sm">{b.title}</h3>
                  <p className="text-xs text-ink-muted leading-relaxed">{b.desc}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-16 bg-white rounded-2xl p-8 md:p-10 border border-cream-dark">
            <div className="grid md:grid-cols-2 gap-10 items-center">
              <div>
                <h2 className="font-display text-3xl font-bold text-ink mb-4">
                  ¿Tienes libros antiguos y no sabes a quién vendérselos?
                </h2>
                <p className="text-ink-muted leading-relaxed mb-4">
                  La mayoría de la gente que hereda una biblioteca termina regalándola o
                  vendiéndola por kilo. Acá la ven coleccionistas y libreros de todo Chile,
                  y el precio lo pones tú.
                </p>
                <ul className="space-y-3 text-sm text-ink-muted">
                  <li><strong className="text-ink">Publicar es gratis.</strong> Fotos, descripción del estado y precio. Diez minutos por libro.</li>
                  <li><strong className="text-ink">Sin tasador de por medio.</strong> Nadie te compra el lote a la baja para revenderlo.</li>
                  <li><strong className="text-ink">Comisión 8% solo si se vende por la plataforma.</strong> Si lo entregas en mano, no cobro nada.</li>
                </ul>
                <Link href="/vender" className="inline-flex items-center mt-6 text-sm text-brand-600 font-semibold hover:text-brand-700 transition-colors">
                  Cómo vender en tuslibros.cl →
                </Link>
              </div>
              <div className="bg-cream p-6 rounded-xl border border-brand-100">
                <h3 className="font-display font-bold text-lg text-ink mb-2">Para el que compra</h3>
                <p className="text-sm text-ink-muted mb-4">
                  Con MercadoPago el dinero no se libera al vendedor hasta que recibes el libro y
                  confirmas que la edición y el estado corresponden a lo publicado. Y si prefieres
                  verlo antes, coordinas retiro en mano.
                </p>
                <Link href="/solicitudes" className="text-sm text-brand-600 font-semibold hover:text-brand-700 transition-colors">
                  ¿Buscas una edición concreta? Pídela →
                </Link>
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

          <section className="mb-12 border-t border-cream-dark pt-10">
            <p className="text-xs text-ink-muted uppercase tracking-widest font-semibold mb-4">También puede interesarte</p>
            <div className="flex flex-wrap gap-3">
              <Link href="/libros-de-historia-de-chile" className="text-sm text-brand-600 font-medium hover:text-brand-700 underline underline-offset-2 transition-colors">Historia de Chile</Link>
              <span className="text-ink-muted">·</span>
              <Link href="/antroposofia" className="text-sm text-brand-600 font-medium hover:text-brand-700 underline underline-offset-2 transition-colors">Antroposofía</Link>
              <span className="text-ink-muted">·</span>
              <Link href="/autor/ken-wilber" className="text-sm text-brand-600 font-medium hover:text-brand-700 underline underline-offset-2 transition-colors">Ken Wilber</Link>
              <span className="text-ink-muted">·</span>
              <Link href="/autor" className="text-sm text-brand-600 font-medium hover:text-brand-700 underline underline-offset-2 transition-colors">Páginas de autor</Link>
              <span className="text-ink-muted">·</span>
              <Link href="/vender" className="text-sm text-brand-600 font-medium hover:text-brand-700 underline underline-offset-2 transition-colors">Vender libros usados</Link>
            </div>
          </section>
        </main>
      </div>
    </>
  );
}
