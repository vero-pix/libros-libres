import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import ListingCard from "@/components/listings/ListingCard";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import { sortListingsForDisplay } from "@/lib/sortListings";
import type { ListingWithBook } from "@/types";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "El Arte de Amar de Fromm — Libro Usado en Chile | tuslibros.cl",
  description:
    "Compra El Arte de Amar de Erich Fromm usado en Chile. Ejemplares disponibles con envío a todo el país o retiro en mano. Pago seguro con MercadoPago desde $4.000.",
  alternates: { canonical: "https://tuslibros.cl/el-arte-de-amar" },
  keywords: [
    "el arte de amar",
    "el arte de amar fromm",
    "erich fromm",
    "el arte de amar libro",
    "comprar el arte de amar chile",
    "el arte de amar libro usado",
  ],
  openGraph: {
    title: "El Arte de Amar de Fromm — Libro Usado en Chile | tuslibros.cl",
    description: "El Arte de Amar de Erich Fromm, usado en Chile. Envío a todo el país.",
    url: "https://tuslibros.cl/el-arte-de-amar",
    siteName: "tuslibros.cl",
    locale: "es_CL",
    type: "website",
  },
};

const faqs = [
  {
    q: "¿De qué trata El Arte de Amar de Erich Fromm?",
    a: "Fromm argumenta que el amor no es un sentimiento pasivo ni una suerte de encuentro casual, sino una habilidad que se aprende y practica. El libro analiza distintas formas de amor (materno, fraternal, erótico, propio, a Dios) y propone que la incapacidad de amar es el problema central de la sociedad moderna. Publicado en 1956, sigue siendo uno de los ensayos de psicología más vendidos del siglo XX.",
  },
  {
    q: "¿Cuánto cuesta El Arte de Amar usado en Chile?",
    a: "En tuslibros.cl los ejemplares usados se encuentran generalmente entre $4.000 y $12.000 según el estado y la edición. El libro nuevo en librerías chilenas ronda los $16.000–$22.000. Es un texto corto (unas 160 páginas), por lo que las ediciones de bolsillo son abundantes y económicas.",
  },
  {
    q: "¿Qué edición de El Arte de Amar se consigue usada?",
    a: "Las ediciones más comunes en Chile son las de Paidós (la más frecuente en el mercado de segunda mano), Fondo de Cultura Económica y Espasa. El contenido es idéntico en todas las ediciones en español. Para primera lectura, cualquier ejemplar en buen estado sirve.",
  },
  {
    q: "¿Es difícil leer El Arte de Amar?",
    a: "No. Es uno de los ensayos más accesibles de la psicología del siglo XX. Fromm escribe con claridad y sin jerga técnica excesiva. Tiene 160 páginas y se puede leer en una tarde. Es una lectura común en liceos, universidades y para quienes se inician en la psicología o la filosofía.",
  },
  {
    q: "¿Puedo vender mi ejemplar de El Arte de Amar en tuslibros.cl?",
    a: "Sí. El Arte de Amar tiene demanda constante. Publicar es gratis — subes una foto de la portada, ingresas los datos y quedas visible para compradores en todo Chile. La comisión es 8% solo cuando el libro se vende.",
  },
];

export default async function ElArteDeAmarPage() {
  const supabase = await createClient();

  const { data: raw } = await supabase
    .from("listings")
    .select(`*, book:books(*), seller:users(id, full_name, avatar_url, username, mercadopago_user_id)`)
    .eq("status", "active")
    .ilike("book.title", "%arte de amar%")
    .order("created_at", { ascending: false })
    .limit(20);

  const listings = sortListingsForDisplay(
    ((raw ?? []).filter((item: any) => item.book !== null) as unknown as ListingWithBook[])
  ).slice(0, 8);

  const bookJsonLd = {
    "@context": "https://schema.org",
    "@type": "Book",
    name: "El Arte de Amar",
    author: { "@type": "Person", name: "Erich Fromm" },
    datePublished: "1956",
    inLanguage: "es",
    bookFormat: "https://schema.org/Paperback",
    description: "El Arte de Amar es un ensayo del psicólogo y filósofo alemán Erich Fromm publicado en 1956. Plantea que amar es un arte que requiere conocimiento y esfuerzo, y analiza las distintas formas del amor humano desde una perspectiva psicoanalítica y humanista.",
    genre: "Psicología, Ensayo",
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: "https://tuslibros.cl" },
      { "@type": "ListItem", position: 2, name: "El Arte de Amar", item: "https://tuslibros.cl/el-arte-de-amar" },
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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(bookJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      <div className="min-h-screen bg-cream">
        <main className="max-w-5xl mx-auto px-6 py-10">
          <Breadcrumbs items={[{ label: "Inicio", href: "/" }, { label: "El Arte de Amar" }]} />

          <section className="mt-8 mb-12 max-w-3xl">
            <h1 className="font-display text-4xl sm:text-5xl font-bold text-ink leading-[1.05] tracking-tight">
              El Arte de Amar —{" "}
              <span className="italic text-brand-600">usado, en Chile.</span>
            </h1>
            <p className="mt-5 text-lg text-ink-muted leading-relaxed">
              El ensayo de Erich Fromm que lleva 70 años explicando por qué amar
              no es algo que simplemente le ocurre a uno, sino algo que se aprende.
              Uno de los libros más regalados, subrayados y releídos del siglo XX.
              Envío a todo Chile o retiro en mano.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/search?q=el+arte+de+amar" className="inline-flex items-center px-6 py-3 bg-brand-500 text-white text-sm font-semibold rounded-xl hover:bg-brand-600 transition-colors shadow-sm">
                Ver ejemplares disponibles
              </Link>
              <Link href="/solicitudes" className="inline-flex items-center px-6 py-3 bg-white border border-ink/20 text-ink text-sm font-semibold rounded-xl hover:border-brand-500 hover:text-brand-600 transition-colors">
                Avisar cuando llegue uno →
              </Link>
            </div>
          </section>

          {listings.length > 0 ? (
            <section className="mb-16">
              <h2 className="font-display text-2xl font-bold text-ink mb-5">Disponibles ahora</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {listings.map((l) => <ListingCard key={l.id} listing={l} />)}
              </div>
              <div className="mt-6">
                <Link href="/search?q=fromm" className="text-sm text-brand-600 font-semibold hover:text-brand-700 transition-colors">
                  Ver otros libros de Erich Fromm →
                </Link>
              </div>
            </section>
          ) : (
            <section className="mb-16 bg-white border border-cream-dark rounded-2xl p-8 text-center">
              <p className="font-display text-xl text-ink mb-2">No hay ejemplares disponibles hoy</p>
              <p className="text-sm text-ink-muted mb-6">Crea una solicitud y te avisamos cuando aparezca uno.</p>
              <Link href="/solicitudes" className="inline-flex items-center px-5 py-2.5 bg-brand-500 text-white text-sm font-semibold rounded-lg hover:bg-brand-600 transition-colors">
                Solicitar El Arte de Amar
              </Link>
            </section>
          )}

          <section className="mb-16">
            <h2 className="font-display text-2xl font-bold text-ink mb-4">Sobre el libro</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl p-6 border border-cream-dark">
                <h3 className="font-semibold text-ink mb-2">El libro</h3>
                <p className="text-sm text-ink-muted leading-relaxed">
                  Publicado en 1956 por el psicólogo y filósofo alemán Erich Fromm, El Arte de Amar
                  es uno de los ensayos más influyentes del siglo XX. Fromm argumenta que el amor
                  es una habilidad — no una emoción pasiva — y que su ausencia en la vida moderna
                  es síntoma de una sociedad que confunde el consumir con el ser. Traducciones a
                  más de 30 idiomas, con decenas de millones de copias vendidas.
                </p>
              </div>
              <div className="bg-white rounded-xl p-6 border border-cream-dark">
                <h3 className="font-semibold text-ink mb-2">¿Para quién es?</h3>
                <p className="text-sm text-ink-muted leading-relaxed">
                  Es un libro para cualquier persona, sin importar su formación. Lo leen estudiantes
                  de psicología, personas que atraviesan relaciones difíciles, y quienes simplemente
                  quieren entender mejor cómo funciona el amor. Es corto (unas 160 páginas),
                  accesible y directo. Un punto de partida excelente para entrar al mundo de
                  Fromm antes de leer El Miedo a la Libertad o Tener o Ser.
                </p>
              </div>
            </div>
          </section>

          <section className="mb-16 bg-ink text-cream rounded-2xl p-8 md:p-10">
            <h2 className="font-display text-2xl font-bold mb-3">¿Tienes El Arte de Amar y ya no lo leerás?</h2>
            <p className="text-cream/80 text-sm leading-relaxed max-w-xl mb-6">
              Hay demanda activa. Publicar es gratis y la comisión es solo 8% cuando se vende.
            </p>
            <Link href="/publish" className="inline-flex items-center px-6 py-3 bg-brand-500 text-white text-sm font-semibold rounded-xl hover:bg-brand-600 transition-colors">
              Publicar mi libro →
            </Link>
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
              <Link href="/cien-anos-de-soledad" className="text-sm text-brand-600 font-medium hover:text-brand-700 underline underline-offset-2 transition-colors">Cien años de soledad</Link>
              <span className="text-ink-muted">·</span>
              <Link href="/rayuela" className="text-sm text-brand-600 font-medium hover:text-brand-700 underline underline-offset-2 transition-colors">Rayuela — Cortázar</Link>
              <span className="text-ink-muted">·</span>
              <Link href="/pablo-neruda" className="text-sm text-brand-600 font-medium hover:text-brand-700 underline underline-offset-2 transition-colors">Libros de Neruda</Link>
              <span className="text-ink-muted">·</span>
              <Link href="/libros-usados-chile" className="text-sm text-brand-600 font-medium hover:text-brand-700 underline underline-offset-2 transition-colors">Libros usados en Chile</Link>
            </div>
          </section>
        </main>
      </div>
    </>
  );
}
