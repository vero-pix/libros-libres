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

const URL = "https://tuslibros.cl/libros-escolares";

/** Valores exactos de books.category / books.subcategory. */
const CAT_ACADEMICO = "academico";
const SUB_ESCOLAR = "academico-escolar";
const CAT_INFANTIL = "infantil-juvenil";

export const metadata: Metadata = {
  title: "Libros escolares usados en Chile: textos del estudiante y lectura complementaria",
  description:
    "Textos escolares y lectura complementaria usados en Chile: Educación Ciudadana, Historia y Geografía, Física, inglés y los títulos que pide el colegio. Fotos reales del ejemplar y envío a todo el país.",
  alternates: { canonical: URL },
  keywords: [
    "libros escolares usados",
    "textos escolares usados",
    "texto del estudiante",
    "educacion ciudadana 3 medio",
    "libro educacion ciudadana 3 medio",
    "libro de historia 2 medio",
    "compra de libros escolares usados",
    "libros del colegio usados",
    "lectura complementaria usada",
    "textos escolares santillana usados",
    "libros escolares chile",
    "donde comprar textos escolares usados",
  ],
  openGraph: {
    title: "Libros escolares usados en Chile: textos y lectura complementaria",
    description:
      "Los textos que pide el colegio, de segunda mano. Con fotos reales del ejemplar y el estado a la vista.",
    url: URL,
    siteName: "tuslibros.cl",
    locale: "es_CL",
    type: "website",
  },
};

const faqs = [
  {
    q: "¿Sirve el texto del año pasado?",
    a: "Casi siempre sí. Los textos del estudiante cambian de edición cada varios años, no todos los años, y el contenido de la asignatura se mueve poco. Revisa el año que declara la ficha y compáralo con el que pide el colegio. Si el profesor pide una edición específica, está dicho en la portada y en la foto.",
  },
  {
    q: "¿Por qué hay tan pocos textos escolares acá?",
    a: "Porque se mueven en marzo. Entre enero y abril entran y salen rápido, y el resto del año quedan pocos. Si buscas uno y hoy no está, déjalo pedido en /solicitudes: te escribo apenas alguien lo publique, sin que tengas que revisar el sitio.",
  },
  {
    q: "¿Tienen la lectura complementaria del colegio?",
    a: "De eso hay bastante más que textos de asignatura: Edipo rey, La Ilíada, El Principito y los títulos de las listas circulan todo el año. Están abajo en esta misma página y en la sección infantil y juvenil.",
  },
  {
    q: "¿En qué estado llegan los textos usados?",
    a: "Cada publicación trae fotos reales y la condición declarada. En textos escolares es normal encontrar ejercicios resueltos a lápiz o el nombre del dueño anterior; si los tiene, está dicho en la descripción. Míralo antes de comprar.",
  },
  {
    q: "Tengo los textos del año pasado, ¿los puedo vender?",
    a: "Sí, y en marzo se venden solos. Publicar es gratis: foto, precio y en qué estado está. Solo cobro 8% cuando la venta pasa por MercadoPago o por despacho con courier; si lo entregas en mano, no pago nada. Un texto que en tu casa ya no sirve, en otra casa ahorra treinta mil pesos.",
  },
  {
    q: "¿Hacen envíos a regiones?",
    a: "A todo Chile por courier, y sobre $20.000 de compra el envío va gratis. También puedes coordinar retiro en mano: en cada ficha aparece la comuna del vendedor.",
  },
];

const clp = (n: number | null | undefined) =>
  typeof n === "number" ? `$${n.toLocaleString("es-CL")}` : "";

/** Los que son texto de asignatura, distintos de la lectura complementaria. */
const ES_TEXTO_DE_ASIGNATURA =
  /texto del estudiante|educaci[oó]n ciudadana|historia y geograf|f[ií]sica|qu[ií]mica|biolog[ií]a|matem[aá]tic|ciencias sociales|ingl[eé]s|teen club|teens club|lenguaje|programas de estudio/i;

export default async function LibrosEscolaresPage() {
  const supabase = await createClient();

  const SELECT = `*, book:books!inner(*), seller:users(id, full_name, avatar_url, username, mercadopago_user_id, on_vacation, vacation_message)`;

  const { data: escolarRaw } = await supabase
    .from("listings")
    .select(SELECT)
    .eq("status", "active")
    .eq("book.category", CAT_ACADEMICO)
    .eq("book.subcategory", SUB_ESCOLAR);

  const escolares = (escolarRaw as unknown as ListingWithBook[]) ?? [];

  const textos = escolares
    .filter((l) => ES_TEXTO_DE_ASIGNATURA.test(l.book?.title ?? ""))
    .sort((a, b) => (b.book?.published_year ?? 0) - (a.book?.published_year ?? 0));

  // Lo que el colegio pide leer: sale de la categoría infantil-juvenil, que es
  // donde de verdad circula, más lo que quedó en escolar sin ser de asignatura.
  const idsTexto = new Set(textos.map((l) => l.id));
  const { data: compRaw } = await supabase
    .from("listings")
    .select(SELECT)
    .eq("status", "active")
    .eq("book.category", CAT_INFANTIL);

  const complementaria = ordenarParaGrilla([
    ...escolares.filter((l) => !idsTexto.has(l.id)),
    ...((compRaw as unknown as ListingWithBook[]) ?? []),
  ]).slice(0, 12);

  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Libros escolares usados en Chile",
    description:
      "Textos escolares y lectura complementaria de segunda mano en Chile, con fotos reales del ejemplar y envío a todo el país.",
    url: URL,
  };

  const itemListJsonLd =
    textos.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "Textos escolares disponibles",
          numberOfItems: textos.length,
          itemListElement: textos.map((l, i) => ({
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
      { "@type": "ListItem", position: 2, name: "Libros escolares", item: URL },
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
          <Breadcrumbs items={[{ label: "Inicio", href: "/" }, { label: "Libros escolares" }]} />

          <section className="mt-8 mb-16 max-w-3xl animate-fade-up">
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-ink leading-[1.05] tracking-tight">
              Libros escolares usados —{" "}
              <span className="italic text-brand-600">los que pide el colegio, de segunda mano.</span>
            </h1>
            <p className="mt-6 text-lg text-ink-muted leading-relaxed">
              Un texto del estudiante nuevo cuesta lo que cuesta, se usa nueve meses y después
              queda muerto en una repisa. Acá vuelven a circular: textos de asignatura y la
              lectura complementaria de las listas, con fotos reales y el estado dicho sin
              maquillaje. Son pocos y se mueven en marzo, así que si no está el que buscas,
              déjalo pedido y te aviso.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/solicitudes"
                className="inline-flex items-center px-6 py-3 bg-brand-500 text-white text-sm font-semibold rounded-xl hover:bg-brand-600 transition-colors shadow-sm"
              >
                Pedir el texto que buscas →
              </Link>
              <Link
                href="/publish"
                className="inline-flex items-center px-6 py-3 bg-white border border-ink/20 text-ink text-sm font-semibold rounded-xl hover:border-brand-500 hover:text-brand-600 transition-colors"
              >
                Vender los del año pasado
              </Link>
            </div>
          </section>

          {textos.length > 0 && (
            <section className="mb-16">
              <h2 className="font-display text-3xl font-bold text-ink mb-3">
                Textos de asignatura disponibles hoy
              </h2>
              <p className="text-ink-muted leading-relaxed max-w-3xl mb-8">
                Estos son todos los que hay en este momento —{textos.length} en total—, del más
                nuevo al más antiguo. No es un catálogo grande y no voy a fingir que lo es: los
                textos escolares entran en enero y salen en abril. Si el tuyo no está, pídelo.
              </p>

              <ul className="space-y-4">
                {textos.map((l) => (
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
                        {typeof l.price === "number" && (
                          <p className="text-base font-bold text-ink mt-3">{clp(l.price)}</p>
                        )}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {complementaria.length > 0 && (
            <section className="mb-16">
              <h2 className="font-display text-3xl font-bold text-ink mb-3">
                Lectura complementaria
              </h2>
              <p className="text-ink-muted leading-relaxed max-w-3xl mb-8">
                De esto hay mucho más que de textos de asignatura, y circula todo el año: los
                títulos de las listas del colegio se leen una vez y se pasan.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {complementaria.map((l) => (
                  <ListingCard key={l.id} listing={l} />
                ))}
              </div>
              <div className="mt-6">
                <Link
                  href="/libros-infantiles"
                  className="inline-flex items-center text-brand-600 font-semibold hover:text-brand-700 transition-colors"
                >
                  Ver todos los infantiles y juveniles →
                </Link>
              </div>
            </section>
          )}

          <section className="mb-16 bg-white rounded-2xl p-8 md:p-10 border border-cream-dark">
            <div className="grid md:grid-cols-2 gap-10 items-center">
              <div>
                <h2 className="font-display text-3xl font-bold text-ink mb-4">
                  ¿Te quedaron los textos del año pasado?
                </h2>
                <p className="text-ink-muted leading-relaxed mb-4">
                  En marzo se venden solos. Un texto que en tu casa ya no sirve, en otra casa
                  ahorra treinta mil pesos, y es la época del año en que más gente los anda
                  buscando con la lista en la mano.
                </p>
                <ul className="space-y-3 text-sm text-ink-muted">
                  <li><strong className="text-ink">Publicar es gratis.</strong> Foto de la portada, el año de la edición y el precio.</li>
                  <li><strong className="text-ink">Di si tiene ejercicios resueltos.</strong> No espanta a nadie, y evita reclamos después.</li>
                  <li><strong className="text-ink">Comisión 8% solo si se vende por la plataforma.</strong> En mano, no cobro nada.</li>
                </ul>
                <Link href="/vender" className="inline-flex items-center mt-6 text-sm text-brand-600 font-semibold hover:text-brand-700 transition-colors">
                  Cómo vender en tuslibros.cl →
                </Link>
              </div>
              <div className="bg-cream p-6 rounded-xl border border-brand-100">
                <h3 className="font-display font-bold text-lg text-ink mb-2">
                  ¿El texto que buscas no está?
                </h3>
                <p className="text-sm text-ink-muted mb-4">
                  Es lo más probable fuera de marzo, y prefiero decírtelo derecho que dejarte
                  buscando. Déjalo pedido con el curso y la asignatura: cuando alguien lo
                  publique, te escribo yo.
                </p>
                <Link href="/solicitudes" className="text-sm text-brand-600 font-semibold hover:text-brand-700 transition-colors">
                  Pedir un texto escolar →
                </Link>
              </div>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="font-display text-3xl font-bold text-ink mb-8">Preguntas frecuentes</h2>
            <div className="space-y-4">
              {faqs.map((f, i) => (
                <details key={i} className="bg-white rounded-xl border border-cream-dark p-5 group">
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
            <p className="text-xs text-ink-muted uppercase tracking-widest font-semibold mb-4">
              También puede interesarte
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/libros-infantiles" className="text-sm text-brand-600 font-medium hover:text-brand-700 underline underline-offset-2 transition-colors">Infantil y juvenil</Link>
              <span className="text-ink-muted">·</span>
              <Link href="/algebra-de-baldor" className="text-sm text-brand-600 font-medium hover:text-brand-700 underline underline-offset-2 transition-colors">Álgebra de Baldor</Link>
              <span className="text-ink-muted">·</span>
              <Link href="/categoria/academico-universitario" className="text-sm text-brand-600 font-medium hover:text-brand-700 underline underline-offset-2 transition-colors">Universitarios</Link>
              <span className="text-ink-muted">·</span>
              <Link href="/libros-usados-baratos" className="text-sm text-brand-600 font-medium hover:text-brand-700 underline underline-offset-2 transition-colors">Libros usados baratos</Link>
              <span className="text-ink-muted">·</span>
              <Link href="/solicitudes" className="text-sm text-brand-600 font-medium hover:text-brand-700 underline underline-offset-2 transition-colors">Pedir un libro</Link>
            </div>
          </section>
        </main>
      </div>
    </>
  );
}
