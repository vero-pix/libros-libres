import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import ListingCard from "@/components/listings/ListingCard";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import { ordenarParaGrilla } from "@/lib/sortListings";
import type { ListingWithBook } from "@/types";

export const revalidate = 300;

const URL = "https://tuslibros.cl/educacion-ciudadana-3-medio";

/*
 * Landing del texto de Educación Ciudadana 3° medio (27-09-2026).
 *
 * Es la búsqueda temática con más demanda que tenemos en Google (análisis del
 * 22-09: 71% de la demanda temática). Search Console, 28 días al 24-09: "libro
 * de educación ciudadana 3 medio 2026" 105 impresiones en posición 8 y 2% de
 * clics; hasta ese día la mostraban fichas sueltas. Ese día había UN solo
 * ejemplar publicado, así que la página también capta la demanda: pedir aviso
 * y publicar el propio.
 *
 * Datos de la asignatura verificados el 27-09-2026 en curriculumnacional.cl
 * (obligatoria en 3° medio desde 2020, en 4° desde 2021) y mineduc.cl /
 * ayudamineduc.cl (texto gratis en municipales y subvencionados, reutilizable
 * de 7° básico a 4° medio, versión digital en catalogotextos.mineduc.cl).
 */
export const metadata: Metadata = {
  title: "Libro Educación Ciudadana 3° Medio usado — texto del estudiante",
  description:
    "Texto de Educación Ciudadana 3° medio usado en Chile: el texto del estudiante que pide el colegio. Si no hay, pide aviso y te escribo cuando alguien lo publique.",
  alternates: { canonical: URL },
  keywords: [
    "libro educacion ciudadana 3 medio",
    "libro de educación ciudadana 3 medio 2026",
    "educacion ciudadana 3 medio texto del estudiante",
    "texto educacion ciudadana tercero medio",
    "educacion ciudadana 3 medio santillana",
    "educacion ciudadana 4 medio libro",
    "textos escolares usados",
  ],
  openGraph: {
    title: "Libro Educación Ciudadana 3° Medio usado",
    description: "El texto del estudiante que pide el colegio, usado. Y si no está, te aviso cuando llegue.",
    url: URL,
    siteName: "tuslibros.cl",
    locale: "es_CL",
    type: "website",
  },
};

const ES_CIUDADANA = /educaci[oó]n ciudadana|formaci[oó]n ciudadana/i;

const faqs = [
  {
    q: "¿El colegio no me entrega el texto gratis?",
    a: "Depende del colegio. El Ministerio de Educación entrega los textos escolares gratis a los estudiantes de colegios municipales y particulares subvencionados que usan los textos del Mineduc, y además tienen una versión digital en catalogotextos.mineduc.cl. Si estás en un colegio particular pagado, si te lo pidieron de otra editorial o si se perdió, el usado es la forma más barata de tenerlo.",
  },
  {
    q: "¿Sirve un texto usado de otro año?",
    a: "Educación Ciudadana existe como asignatura obligatoria desde 2020 en 3° medio, así que los textos de esos años siguen el mismo currículum. Igual revisa en la ficha la editorial y el año, y compáralos con lo que pide el colegio: si piden una editorial específica, que coincida.",
  },
  {
    q: "¿Y si no hay ninguno publicado?",
    a: "Crea una solicitud en «Se busca» con el título y te aviso por correo cuando alguien lo publique.",
  },
  {
    q: "Tengo el texto del año pasado, ¿lo puedo vender?",
    a: "Sí: publicarlo es gratis. Escanea el código de barras o sácale una foto a la portada, ponle precio y listo. Hay gente buscándolo todos los meses.",
  },
];

export default async function EducacionCiudadanaPage() {
  const supabase = await createClient();

  const { data: raw } = await supabase
    .from("listings")
    .select(`*, book:books!inner(*), seller:users(id, full_name, avatar_url, username, mercadopago_user_id)`)
    .eq("status", "active")
    .ilike("book.title", "%ciudadan%")
    .limit(200);

  const listings = ordenarParaGrilla(
    ((raw ?? []) as any[]).filter((item) => item.book && ES_CIUDADANA.test(item.book.title ?? "")) as unknown as ListingWithBook[]
  );

  const publicarHref = `/publish?title=${encodeURIComponent("Educación Ciudadana 3° Medio - Texto del Estudiante")}`;

  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Libro Educación Ciudadana 3° Medio usado",
    description: "Textos de Educación Ciudadana 3° medio de segunda mano en Chile.",
    url: URL,
  };
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: "https://tuslibros.cl" },
      { "@type": "ListItem", position: 2, name: "Libros escolares", item: "https://tuslibros.cl/libros-escolares" },
      { "@type": "ListItem", position: 3, name: "Educación Ciudadana 3° Medio", item: URL },
    ],
  };
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      <div className="min-h-screen bg-cream">
        <main className="max-w-5xl mx-auto px-6 py-10">
          <Breadcrumbs
            items={[
              { label: "Inicio", href: "/" },
              { label: "Libros escolares", href: "/libros-escolares" },
              { label: "Educación Ciudadana 3° Medio" },
            ]}
          />

          <section className="mt-8 mb-12 max-w-3xl animate-fade-in-up">
            <h1 className="font-display text-4xl sm:text-5xl font-bold text-ink leading-[1.05] tracking-tight">
              Libro de Educación Ciudadana 3° Medio —{" "}
              <span className="italic text-brand-600">usado.</span>
            </h1>
            <p className="mt-5 text-lg text-ink-muted leading-relaxed">
              El texto del estudiante que pide el colegio. Acá están los que publican los vendedores; y si
              hoy no hay, pídelo y te escribo apenas alguien lo suba.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/solicitudes" className="shadow-sm">
                Avísame cuando llegue
              </ButtonLink>
              <ButtonLink href={publicarHref} variant="outline">
                Tengo uno, quiero venderlo →
              </ButtonLink>
            </div>
          </section>

          {listings.length > 0 ? (
            <section className="mb-16">
              <div className="flex items-baseline justify-between mb-5">
                <h2 className="font-display text-2xl font-bold text-ink">Disponibles ahora</h2>
                <span className="text-sm text-ink-muted">
                  {listings.length} {listings.length === 1 ? "ejemplar" : "ejemplares"}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {listings.map((l) => <ListingCard key={l.id} listing={l} />)}
              </div>
            </section>
          ) : (
            <section className="mb-16 bg-white border border-cream-dark rounded-2xl p-8 text-center">
              <p className="font-display text-xl text-ink mb-2">Hoy no hay ninguno publicado</p>
              <p className="text-sm text-ink-muted mb-6">Déjame tu pedido y te escribo apenas alguien lo suba.</p>
              <Link href="/solicitudes" className="inline-flex items-center px-5 py-2.5 bg-brand-500 text-white text-sm font-semibold rounded-lg hover:bg-brand-600 transition-colors">
                Pedir el texto de Educación Ciudadana
              </Link>
            </section>
          )}

          <section className="mb-16 grid md:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl p-6 border border-cream-dark">
              <h2 className="font-semibold text-ink mb-2">Antes de comprar: ¿te corresponde gratis?</h2>
              <p className="text-sm text-ink-muted leading-relaxed">
                En colegios municipales y particulares subvencionados, el Mineduc entrega el texto gratis y tiene
                versión digital. Si tu colegio es particular pagado, pide otra editorial o el tuyo se perdió, el
                usado es lo más barato.
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 border border-cream-dark">
              <h2 className="font-semibold text-ink mb-2">Qué revisar en la ficha</h2>
              <p className="text-sm text-ink-muted leading-relaxed">
                La editorial (que sea la que pide el colegio), el año y el estado: si viene rayado o con
                actividades resueltas. Los de 3° medio se diseñan para reutilizarse, así que un ejemplar bien
                cuidado dura varios años.
              </p>
            </div>
          </section>

          <section className="mb-16 bg-ink text-cream rounded-2xl p-8 md:p-10">
            <h2 className="font-display text-2xl font-bold mb-3">¿Te quedó el texto del año pasado?</h2>
            <p className="text-cream/80 text-sm leading-relaxed max-w-xl mb-6">
              Hay gente buscándolo todos los meses. Publicar es gratis y solo cobro 8% cuando se vende por la plataforma.
            </p>
            <ButtonLink href={publicarHref}>Publicar mi texto →</ButtonLink>
          </section>

          <section className="mb-12">
            <h2 className="font-display text-2xl font-bold text-ink mb-6">Preguntas frecuentes</h2>
            <div className="space-y-3">
              {faqs.map((f, i) => (
                <details key={i} className="group bg-white border border-cream-dark/50 rounded-xl p-5 cursor-pointer">
                  <summary className="font-semibold text-ink text-sm list-none flex items-center justify-between gap-4">
                    {f.q}
                    <span className="text-brand-500 text-lg group-open:rotate-45 transition-transform duration-200 shrink-0">+</span>
                  </summary>
                  <p className="mt-3 text-sm text-ink-muted leading-relaxed">{f.a}</p>
                </details>
              ))}
            </div>
          </section>

          <section className="mb-12 border-t border-cream-dark pt-10">
            <p className="text-xs text-ink-muted uppercase tracking-widest font-semibold mb-4">También puede interesarte</p>
            <div className="flex flex-wrap gap-3">
              <Link href="/libros-escolares" className="text-sm text-brand-600 font-medium hover:text-brand-700 underline underline-offset-2 transition-colors">Libros escolares usados</Link>
              <span className="text-ink-muted">·</span>
              <Link href="/libros-usados-baratos" className="text-sm text-brand-600 font-medium hover:text-brand-700 underline underline-offset-2 transition-colors">Libros usados baratos</Link>
              <span className="text-ink-muted">·</span>
              <Link href="/solicitudes" className="text-sm text-brand-600 font-medium hover:text-brand-700 underline underline-offset-2 transition-colors">Se busca</Link>
            </div>
          </section>
        </main>
      </div>
    </>
  );
}
