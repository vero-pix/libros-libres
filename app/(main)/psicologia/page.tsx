import PortadasEncabezado from "@/components/landings/PortadasEncabezado";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import ListingCard from "@/components/listings/ListingCard";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import { ordenarParaGrilla } from "@/lib/sortListings";
import { activosParaFiltrar, completarListings } from "@/lib/activosParaFiltrar";
import type { ListingWithBook } from "@/types";

export const revalidate = 300;

const URL = "https://tuslibros.cl/psicologia";

export const metadata: Metadata = {
  title: "Libros de psicología, psicoanálisis y psiquiatría usados en Chile",
  description:
    "Libros de psicología usados en Chile: Freud, Jung, Lacan, Piaget, Oliver Sacks, Goleman, Frankl. Manuales de psiquiatría, psicopatología y psicología del desarrollo. Envío a todo Chile o retiro en mano.",
  alternates: { canonical: URL },
  keywords: [
    "libros de psicologia",
    "libros de psicologia usados",
    "libros de psicoanalisis",
    "libros de psiquiatria",
    "freud libros",
    "jung libros",
    "lacan libros",
    "piaget libros",
    "oliver sacks libros",
    "daniel goleman inteligencia emocional",
    "viktor frankl libros",
    "psicologia del desarrollo libro",
    "psicopedagogia libros",
    "comprar libros de psicologia chile",
  ],
  openGraph: {
    title: "Libros de psicología, psicoanálisis y psiquiatría usados en Chile",
    description:
      "Freud, Jung, Lacan, Piaget, Sacks, Goleman. Manuales de la carrera y clásicos que ya no se reimprimen, usados y con envío a todo Chile.",
    url: URL,
    siteName: "tuslibros.cl",
    locale: "es_CL",
    type: "website",
  },
};

// Las secciones se eligen en orden: un libro cae en la primera que calza.
// Regex con borde de palabra: sin él, "jung" traía a Mari Jungstedt (novela
// negra) y "frankl" a Benjamin Franklin.
const SECCIONES: { id: string; titulo: string; bajada: string; needles: RegExp[] }[] = [
  {
    id: "psicoanalisis",
    titulo: "Psicoanálisis",
    bajada: "Freud, Jung, Lacan y los que vinieron después.",
    needles: [/psicoan/, /freud/, /\bjung\b/, /lacan/, /winnicott/, /melanie klein/, /\bbion\b/, /kohut/, /kernberg/, /nasio/, /\bdolto\b/, /bettelheim/, /horney/, /alfred adler/, /\binconsciente\b/],
  },
  {
    id: "clinica",
    titulo: "Psiquiatría y clínica",
    bajada: "Compendios, psicopatología, psicofarmacología y psicoterapia.",
    needles: [/psiquiatr/, /psicopatolog/, /psicoterap/, /psicofarmac/, /neurosis/, /esquizofren/, /salud mental/, /\byalom\b/, /\bszasz\b/],
  },
  {
    id: "desarrollo",
    titulo: "Desarrollo y educación",
    bajada: "Piaget, Vygotsky, psicología del niño y del adolescente.",
    needles: [/piaget/, /vygotsk/, /psicopedagog/, /psicología del desarrollo/, /psicologia del desarrollo/, /psicología (infantil|evolutiva|educacional|pedagógica|del escolar|y educación del niño)/, /psicologia (infantil|evolutiva|educacional|pedagogica|del escolar)/, /\berikson\b/, /bowlby/],
  },
  {
    id: "divulgacion",
    titulo: "Para leer sin ser del área",
    bajada: "Oliver Sacks, Goleman, Frankl, Fromm: psicología que se lee como ensayo.",
    needles: [/oliver sacks/, /goleman/, /\bfrankl\b/, /\bfromm\b/, /cyrulnik/, /damasio/, /inteligencia emocional/, /bandler/, /maslow/, /carl rogers/],
  },
  {
    id: "general",
    titulo: "Manuales y psicología general",
    bajada: "Los textos de primer año y los clásicos de la psicología experimental.",
    needles: [/psicolog/],
  },
];

// Lo que la palabra "psicología" arrastra sin serlo.
const FUERA: RegExp[] = [/parapsicolog/, /psicoquin/, /astrolog/, /kolosimo/, /thriller/, /suspens/, /novela psicol/];

const faqs = [
  {
    q: "¿Qué libros de psicología se consiguen usados en Chile?",
    a: "Sobre todo lo que se lee en la carrera: Freud y Jung, Piaget, los compendios de psiquiatría, la Psicología de Morris o el Desarrollo psicológico de Craig, y manuales de psicopatología. También divulgación que sale mucho de bibliotecas personales: Oliver Sacks, Goleman, Viktor Frankl y Erich Fromm.",
  },
  {
    q: "¿Por dónde empezar si no soy del área?",
    a: "El hombre que confundió a su mujer con un sombrero de Oliver Sacks, El hombre en busca de sentido de Frankl o El arte de amar de Fromm se leen sin preparación. Si te interesa el psicoanálisis, las conferencias de introducción de Freud son más amables que La interpretación de los sueños.",
  },
  {
    q: "¿Sirven los manuales antiguos para estudiar?",
    a: "Para los clásicos (Freud, Jung, Piaget, Wundt) sí: el texto no cambia. Para psiquiatría y psicopatología, fíjate en la edición: los criterios diagnósticos se actualizan y un compendio de hace treinta años sirve más como historia que como referencia clínica.",
  },
  {
    q: "¿Y si el libro que busco no está?",
    a: "Crea una solicitud en tuslibros.cl con el título y te aviso cuando alguien lo publique.",
  },
];

export default async function PsicologiaPage() {
  const supabase = await createClient();

  // Todos los activos, no solo 1.000 (lib/activosParaFiltrar.ts).
  const raw = await activosParaFiltrar(supabase);

  const seccionDe = new Map<string, string>();
  for (const item of raw) {
    if (!item.book) continue;
    const hay = `${item.book.title ?? ""} ${item.book.author ?? ""} ${(item.book.tags ?? []).join(" ")}`.toLowerCase();
    if (FUERA.some((n) => n.test(hay))) continue;
    const s = SECCIONES.find((sec) => sec.needles.some((n) => n.test(hay)));
    if (s) seccionDe.set(item.id, s.id);
  }

  const todos = (await completarListings(supabase, Array.from(seccionDe.keys()))) as unknown as ListingWithBook[];

  const secciones = SECCIONES.map((s) => ({
    ...s,
    listings: ordenarParaGrilla(todos.filter((l) => seccionDe.get(l.id) === s.id)).slice(0, 24),
  })).filter((s) => s.listings.length > 0);

  const portadas = ordenarParaGrilla(todos);

  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Libros de psicología, psicoanálisis y psiquiatría usados en Chile",
    description:
      "Catálogo de libros de psicología de segunda mano en Chile: psicoanálisis, psiquiatría, psicología del desarrollo y divulgación.",
    url: URL,
    about: { "@type": "Thing", name: "Psicología", sameAs: "https://es.wikipedia.org/wiki/Psicolog%C3%ADa" },
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: "https://tuslibros.cl" },
      { "@type": "ListItem", position: 2, name: "Psicología", item: URL },
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
        <main className="max-w-5xl mx-auto px-6 py-10">
          <Breadcrumbs items={[{ label: "Inicio", href: "/" }, { label: "Psicología" }]} />

          <section className="mt-8 mb-12 grid lg:grid-cols-[minmax(0,1fr)_auto] gap-6 lg:gap-10 items-center">
            <div className="max-w-3xl">
            <h1 className="font-display text-4xl sm:text-5xl font-bold text-ink leading-[1.05] tracking-tight">
              Libros de psicología —{" "}
              <span className="italic text-brand-600">usados, en Chile.</span>
            </h1>
            <p className="mt-5 text-lg text-ink-muted leading-relaxed">
              Freud, Jung, Lacan, Piaget, Oliver Sacks. Los manuales de la carrera, los compendios de psiquiatría y los
              clásicos que ya no se reimprimen. Los junté acá porque estaban repartidos por todo el sitio.
            </p>
            {secciones.length > 1 && (
              <nav className="mt-6 flex flex-wrap gap-2" aria-label="Secciones">
                {secciones.map((s) => (
                  <a
                    key={s.id}
                    href={`#${s.id}`}
                    className="text-sm px-3 py-1.5 rounded-full border border-cream-dark bg-white text-ink hover:border-brand-400 hover:text-brand-600 transition-colors"
                  >
                    {s.titulo} <span className="text-ink-muted">({s.listings.length})</span>
                  </a>
                ))}
              </nav>
            )}
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/search?q=psicolog%C3%ADa" className="shadow-sm">
                Buscar en todo el catálogo
              </ButtonLink>
              <ButtonLink href="/solicitudes" variant="outline">
                Avisar cuando llegue uno →
              </ButtonLink>
            </div>
            </div>
            <PortadasEncabezado listings={portadas} />
          </section>

          {secciones.length > 0 ? (
            secciones.map((s) => (
              <section key={s.id} id={s.id} className="mb-14 scroll-mt-24">
                <h2 className="font-display text-2xl font-bold text-ink">{s.titulo}</h2>
                <p className="text-sm text-ink-muted mt-1 mb-5">{s.bajada}</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {s.listings.map((l) => <ListingCard key={l.id} listing={l} />)}
                </div>
              </section>
            ))
          ) : (
            <section className="mb-16 bg-white border border-cream-dark rounded-2xl p-8 text-center">
              <p className="font-display text-xl text-ink mb-2">No hay ejemplares disponibles hoy</p>
              <p className="text-sm text-ink-muted mb-6">Crea una solicitud y te aviso cuando aparezca uno.</p>
              <ButtonLink href="/solicitudes">Solicitar un libro de psicología</ButtonLink>
            </section>
          )}

          <section className="mb-16 bg-white border border-cream-dark rounded-2xl p-8 md:p-10">
            <h2 className="font-display text-2xl font-bold text-ink mb-3">¿Buscas uno que no está?</h2>
            <p className="text-sm text-ink-muted leading-relaxed max-w-xl mb-6">
              Déjame el título en el &quot;Se busca&quot;. Cuando alguien lo publique, te aviso por correo. Sirve también para la
              bibliografía entera de un ramo: pides los libros uno por uno y te llegan los avisos a medida que aparecen.
            </p>
            <ButtonLink href="/solicitudes" variant="outline">
              Pedir un libro →
            </ButtonLink>
          </section>

          <section className="mb-16 bg-ink text-cream rounded-2xl p-8 md:p-10">
            <h2 className="font-display text-2xl font-bold mb-3">¿Te titulaste y te quedaron los manuales?</h2>
            <p className="text-cream/80 text-sm leading-relaxed max-w-xl mb-6">
              Alguien que parte la carrera los está buscando. Publicar es gratis y solo cobro 8% cuando se vende por la plataforma.
            </p>
            <ButtonLink href="/publish">
              Publicar mis libros →
            </ButtonLink>
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
              <Link href="/filosofia" className="text-sm text-brand-600 font-medium hover:text-brand-700 underline underline-offset-2 transition-colors">Filosofía</Link>
              <span className="text-ink-muted">·</span>
              <Link href="/el-arte-de-amar" className="text-sm text-brand-600 font-medium hover:text-brand-700 underline underline-offset-2 transition-colors">El arte de amar, de Erich Fromm</Link>
              <span className="text-ink-muted">·</span>
              <Link href="/espiritualidad" className="text-sm text-brand-600 font-medium hover:text-brand-700 underline underline-offset-2 transition-colors">Espiritualidad</Link>
              <span className="text-ink-muted">·</span>
              <Link href="/categoria/no-ficcion-humanidades" className="text-sm text-brand-600 font-medium hover:text-brand-700 underline underline-offset-2 transition-colors">Humanidades</Link>
            </div>
          </section>
        </main>
      </div>
    </>
  );
}
