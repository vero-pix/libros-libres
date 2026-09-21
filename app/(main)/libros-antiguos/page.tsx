import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import ListingCard from "@/components/listings/ListingCard";
import BookCover from "@/components/listings/BookCover";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import { ordenarParaGrilla } from "@/lib/sortListings";
import { libroUrl } from "@/lib/urls";
import type { ListingWithBook } from "@/types";

export const revalidate = 300;

const URL = "https://tuslibros.cl/libros-antiguos";

/** Tag que marca una pieza como impreso chileno antiguo. Se pone desde "Mis libros". */
const TAG_CHILENO = "impreso-chileno";

export const metadata: Metadata = {
  title: "Libros antiguos en Chile: impresos chilenos y de colección",
  description:
    "Impresos chilenos antiguos y libros de colección: ediciones de Santiago del siglo XIX, publicaciones del Centenario, revistas y primeras ediciones. Fotos reales del ejemplar, año y estado declarado, envío a todo Chile.",
  alternates: { canonical: URL },
  keywords: [
    "impresos chilenos",
    "impresos chilenos antiguos",
    "libros chilenos antiguos",
    "ediciones antiguas chilenas",
    "libros antiguos",
    "libros antiguos chile",
    "comprar libros antiguos",
    "vender libros antiguos",
    "quien compra libros antiguos",
    "libros de coleccion chile",
    "primeras ediciones",
    "libros raros",
    "libros descatalogados",
    "libros siglo xix",
    "imprenta universitaria",
    "editorial nascimento",
    "libreria anticuaria online chile",
  ],
  openGraph: {
    title: "Libros antiguos en Chile: impresos chilenos y de colección",
    description:
      "Ediciones chilenas del siglo XIX y comienzos del XX, publicaciones del Centenario, revistas y rarezas. Con fotos reales y el estado a la vista.",
    url: URL,
    siteName: "tuslibros.cl",
    locale: "es_CL",
    type: "website",
  },
};

const faqs = [
  {
    q: "¿Qué es un impreso chileno antiguo?",
    a: "Un libro, folleto o revista impreso en Chile, normalmente antes de mediados del siglo XX: las ediciones de la Imprenta Universitaria, de Nascimento, de las librerías de Santiago del siglo XIX, las publicaciones del Centenario, las revistas universitarias. Se reconocen por el pie de imprenta con la dirección de la calle y, en los más viejos, por la ortografía de la época: 'rejión' con jota, la i latina en vez de la y. Casi ninguno se reimprimió nunca, así que el ejemplar que existe es el que hay.",
  },
  {
    q: "¿Por qué los impresos chilenos son difíciles de encontrar?",
    a: "Porque se imprimieron en tiradas cortas, para un país chico, y nadie los reeditó. Un clásico europeo del siglo XIX lo encuentras en cualquier librería de viejo del mundo; un recuento de Temuco impreso en Santiago en 1911 existe en los ejemplares que sobrevivieron. Eso es lo que los hace piezas: no son antiguos nomás, son escasos acá y en todas partes.",
  },
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
    a: "Sí. Cada publicación lleva fotos reales del ejemplar y la condición declarada por el vendedor. En las piezas antiguas el estado va descrito sin maquillaje: si el lomo está gastado o el papel tiene manchas de humedad, está dicho. Si pagas con MercadoPago queda registro de la compra y tienes 7 días para devolverlo si no corresponde a lo publicado.",
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
  { title: "Impresos chilenos", desc: "Ediciones hechas en Chile: la Imprenta Universitaria, Nascimento, las librerías de Santiago del siglo XIX. Tirada corta, sin reimpresión, con el pie de imprenta y la dirección de la calle en la portada." },
  { title: "Ediciones del siglo XIX", desc: "Clásicos traducidos y encuadernados en su época: Plutarco, Séneca, Pascal. Papel de trapo, lomos en piel, tipografía que ya no existe." },
  { title: "Primeras ediciones", desc: "La primera vez que un libro salió a la calle. Las de autores chilenos y del boom latinoamericano (Seix Barral, Zig-Zag, Nascimento) son las más buscadas." },
  { title: "Colecciones cerradas", desc: "Series que ya no se completan: la Biblioteca de Babel de Borges en Siruela, la Biblioteca Clásica Gredos, las primeras Alianza de bolsillo." },
  { title: "Descatalogados", desc: "Títulos que ninguna editorial volvió a imprimir. No son antiguos, pero solo existen usados." },
];

/**
 * El gancho de cada pieza sale de su propia descripción, no de un texto
 * paralelo en el código: así la landing nunca dice algo distinto de la ficha.
 */
function gancho(descripcion: string | null | undefined, max = 190): string {
  if (!descripcion) return "";
  const limpia = descripcion.trim();
  const fin = limpia.search(/\.\s/);
  const primera = fin > 0 ? limpia.slice(0, fin + 1) : limpia;
  if (primera.length <= max) return primera;
  const corte = primera.lastIndexOf(" ", max);
  return `${primera.slice(0, corte > 0 ? corte : max).trim()}…`;
}

const clp = (n: number | null | undefined) =>
  typeof n === "number" ? `$${n.toLocaleString("es-CL")}` : "";

export default async function LibrosAntiguosPage() {
  const supabase = await createClient();

  const SELECT = `*, book:books!inner(*), seller:users(id, full_name, avatar_url, username, mercadopago_user_id)`;

  // Las piezas chilenas, de la más antigua a la más nueva.
  const { data: chilenasRaw } = await supabase
    .from("listings")
    .select(SELECT)
    .eq("status", "active")
    .contains("book.tags", [TAG_CHILENO]);

  const chilenas = ((chilenasRaw as unknown as ListingWithBook[]) ?? []).sort(
    (a, b) => (a.book?.published_year ?? 9999) - (b.book?.published_year ?? 9999)
  );

  const { data: featuredRaw } = await supabase
    .from("listings")
    .select(`*, book:books(*), seller:users(id, full_name, avatar_url, username, mercadopago_user_id)`)
    .eq("status", "active")
    .eq("is_collectible", true)
    .order("price", { ascending: false })
    .limit(48);

  // Las chilenas ya tienen su propia sección arriba: no se repiten en la grilla.
  const idsChilenas = new Set(chilenas.map((l) => l.id));
  const featured = ordenarParaGrilla(
    ((featuredRaw as unknown as ListingWithBook[]) ?? []).filter((l) => !idsChilenas.has(l.id))
  ).slice(0, 24);

  const { count: totalCollectible } = await supabase
    .from("listings")
    .select("id", { count: "exact", head: true })
    .eq("status", "active")
    .eq("is_collectible", true);

  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Libros antiguos e impresos chilenos en Chile",
    description:
      "Impresos chilenos antiguos, primeras ediciones, ediciones del siglo XIX y descatalogados a la venta en Chile, con fotos reales y pago protegido.",
    url: URL,
  };

  const itemListJsonLd = chilenas.length > 0
    ? {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: "Impresos chilenos antiguos disponibles",
        numberOfItems: chilenas.length,
        itemListElement: chilenas.map((l, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: l.book?.title,
          url: `https://tuslibros.cl${libroUrl(l)}`,
        })),
      }
    : null;

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
      {itemListJsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} />
      )}
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
              <span className="italic text-brand-600">impresos chilenos y primeras ediciones.</span>
            </h1>
            <p className="mt-6 text-lg text-ink-muted leading-relaxed">
              Ediciones hechas en Chile que nadie volvió a imprimir, clásicos del siglo XIX,
              colecciones que ya no se completan. Cada ejemplar con fotos reales, el año, el
              estado dicho sin maquillaje y el vendedor a la vista. Y si el que tiene la joya
              eres tú, acá la ve gente que sabe lo que vale.
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

          {chilenas.length > 0 && (
            <section className="mb-16">
              <h2 className="font-display text-3xl font-bold text-ink mb-3">
                Impresos chilenos
              </h2>
              <p className="text-ink-muted leading-relaxed max-w-3xl mb-8">
                Libros y revistas impresos en Chile, en tiradas cortas y para un país chico.
                Un clásico europeo del siglo XIX lo encuentras en cualquier librería de viejo
                del mundo; estos existen en los ejemplares que sobrevivieron. Van ordenados
                del más antiguo al más nuevo.
              </p>

              <ul className="space-y-4">
                {chilenas.map((l) => (
                  <li key={l.id}>
                    <Link
                      href={libroUrl(l)}
                      className="group flex gap-5 bg-white rounded-2xl p-5 border border-cream-dark hover:border-brand-300 hover:shadow-sm transition-all"
                    >
                      <BookCover
                        title={l.book?.title ?? "Libro"}
                        author={l.book?.author}
                        coverUrl={l.cover_image_url ?? l.book?.cover_url}
                        sizes="96px"
                        className="w-20 sm:w-24 shrink-0 rounded-lg border border-cream-dark"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline gap-3 flex-wrap">
                          {l.book?.published_year && (
                            <span className="font-mono text-xs font-semibold text-brand-600 tracking-wider">
                              {l.book.published_year}
                            </span>
                          )}
                          {l.book?.publisher && (
                            <span className="text-xs text-ink-muted">{l.book.publisher}</span>
                          )}
                        </div>
                        <h3 className="font-display text-lg sm:text-xl font-bold text-ink leading-snug mt-1 group-hover:text-brand-600 transition-colors">
                          {l.book?.title}
                        </h3>
                        {l.book?.author && (
                          <p className="text-sm text-ink-muted italic mt-0.5">{l.book.author}</p>
                        )}
                        <p className="text-sm text-ink-muted leading-relaxed mt-2 line-clamp-3">
                          {gancho(l.book?.description)}
                        </p>
                        {typeof l.price === "number" && (
                          <p className="text-base font-bold text-ink mt-3">{clp(l.price)}</p>
                        )}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>

              <div className="mt-6">
                <Link
                  href={`/?tag=${TAG_CHILENO}`}
                  className="inline-flex items-center text-brand-600 font-semibold hover:text-brand-700 transition-colors"
                >
                  Ver todos los impresos chilenos →
                </Link>
              </div>
            </section>
          )}

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
                  Antes de comprar puedes preguntarle al vendedor por la edición y el estado, y
                  si prefieres verlo con tus propios ojos, coordinas retiro en mano. Si algo no
                  corresponde a lo publicado, me escribes y lo resolvemos.
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
