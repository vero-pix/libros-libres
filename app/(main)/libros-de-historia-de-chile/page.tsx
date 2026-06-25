import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import ListingCard from "@/components/listings/ListingCard";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import { sortListingsForDisplay } from "@/lib/sortListings";
import type { ListingWithBook } from "@/types";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Libros de Historia de Chile Usados | tuslibros.cl",
  description:
    "Compra libros de historia de Chile usados: la Unidad Popular, la dictadura, la Guerra del Pacífico, los pueblos originarios, el salitre y más. Segunda mano, muchos agotados, envío a todo Chile.",
  alternates: { canonical: "https://tuslibros.cl/libros-de-historia-de-chile" },
  keywords: [
    "libros de historia de chile",
    "historia de chile usados",
    "libros historia de chile segunda mano",
    "comprar libros historia de chile",
    "libros unidad popular",
    "libros dictadura chile",
    "guerra del pacifico libros",
    "frias valenzuela historia de chile",
  ],
  openGraph: {
    title: "Libros de Historia de Chile Usados | tuslibros.cl",
    description:
      "Historia de Chile usada: Unidad Popular, dictadura, Guerra del Pacífico, pueblos originarios, salitre y más. Muchos títulos agotados. Envío a todo Chile.",
    url: "https://tuslibros.cl/libros-de-historia-de-chile",
    siteName: "tuslibros.cl",
    locale: "es_CL",
    type: "website",
  },
};

// Historia de Chile: por título o autor (combina con subcategoría/tags de historia).
const CHILE_NEEDLES = [
  "chile", "chilena", "chileno", "pinochet", "allende", "unidad popular",
  "dictadura", "guerra del pacifico", "guerra del pacífico", "mapuche",
  "santiago antiguo", "historia de chile", "frias valenzuela", "frías valenzuela",
  "villalobos", "jocelyn-holt", "gabriel salazar", "araucan", "conquista de chile",
  "independencia de chile", "o'higgins", "ohiggins", "balmaceda", "portales",
  "vicuña mackenna", "vicuna mackenna", "salitre", "régimen militar", "regimen militar",
];

const faqs = [
  {
    q: "¿Qué libros de historia de Chile encuentro acá?",
    a: "De todo el espectro: la Unidad Popular y el gobierno de Allende, la dictadura militar y sus memorias, la Guerra del Pacífico, los pueblos originarios y el mundo mapuche, el ciclo del salitre, la Independencia, y clásicos como Vicuña Mackenna o Frías Valenzuela. Muchos están agotados en librerías nuevas.",
  },
  {
    q: "¿Por qué comprar historia de Chile usada?",
    a: "Porque buena parte de los títulos importantes ya no se reeditan: ediciones de los 70, 80 y 90 que solo circulan de segunda mano. Acá los consigues a precio de usado, muchas veces a la mitad o menos de lo que costarían nuevos si existieran.",
  },
  {
    q: "¿Sirven para la universidad o el colegio?",
    a: "Sí. Hay manuales y textos de estudio (como el clásico de Francisco Frías Valenzuela) además de ensayo histórico y fuentes. Útiles para Historia en el colegio, pedagogía, periodismo y carreras de humanidades.",
  },
  {
    q: "¿Cómo compro y recibo el libro?",
    a: "Pagas protegido con MercadoPago: tu dinero queda retenido hasta que confirmas que recibiste el libro. Eliges retiro en mano gratis con el vendedor o despacho por courier a todo Chile.",
  },
  {
    q: "¿No está el título que busco?",
    a: "Déjalo en la sección Se busca: publicas el libro de historia de Chile que andas persiguiendo y te avisamos por correo cuando alguien lo suba. Es la economía al revés — tú pides, los vendedores responden.",
  },
];

export default async function LibrosHistoriaChilePage() {
  const supabase = await createClient();

  const { data: raw } = await supabase
    .from("listings")
    .select(`*, book:books(*), seller:users(id, full_name, avatar_url, username, mercadopago_user_id)`)
    .eq("status", "active")
    .limit(1000);

  const matched = ((raw ?? []) as any[]).filter((item) => {
    if (!item.book) return false;
    const hay = `${item.book.title ?? ""} ${item.book.author ?? ""}`
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "");
    return CHILE_NEEDLES.some((n) => hay.includes(n.normalize("NFD").replace(/[̀-ͯ]/g, "")));
  }) as unknown as ListingWithBook[];

  const listings = sortListingsForDisplay(matched).slice(0, 8);

  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Libros de Historia de Chile Usados",
    description:
      "Catálogo de libros de historia de Chile de segunda mano: Unidad Popular, dictadura, Guerra del Pacífico, pueblos originarios, salitre y más.",
    url: "https://tuslibros.cl/libros-de-historia-de-chile",
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: "https://tuslibros.cl" },
      { "@type": "ListItem", position: 2, name: "Libros de Historia de Chile", item: "https://tuslibros.cl/libros-de-historia-de-chile" },
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
          <Breadcrumbs items={[{ label: "Inicio", href: "/" }, { label: "Libros de Historia de Chile" }]} />

          <section className="mt-8 mb-12 max-w-3xl">
            <h1 className="font-display text-4xl sm:text-5xl font-bold text-ink leading-[1.05] tracking-tight">
              Libros de Historia de Chile,{" "}
              <span className="italic text-brand-600">usados y muchos agotados.</span>
            </h1>
            <p className="mt-6 text-lg text-ink-muted leading-relaxed">
              La Unidad Popular, la dictadura, la Guerra del Pacífico, el mundo mapuche, el
              salitre, la Independencia. Buena parte de los grandes libros de historia de
              Chile ya no se reeditan: solo circulan de segunda mano, entre lectores. Acá
              los encuentras a precio de usado, con pago protegido por MercadoPago y envío
              a todo Chile.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/search?q=historia%20de%20chile" className="inline-flex items-center px-6 py-3 bg-brand-500 text-white text-sm font-semibold rounded-xl hover:bg-brand-600 transition-colors shadow-sm">
                Ver disponibles
              </Link>
              <Link href="/solicitudes" className="inline-flex items-center px-6 py-3 bg-white border border-ink/20 text-ink text-sm font-semibold rounded-xl hover:border-brand-500 hover:text-brand-600 transition-colors">
                Pedir uno que no está
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
                <Link href="/search?q=historia%20de%20chile" className="text-sm text-brand-600 font-semibold hover:text-brand-700 transition-colors">
                  Ver todos →
                </Link>
              </div>
            </section>
          ) : (
            <section className="mb-16 bg-white border border-cream-dark rounded-2xl p-8 text-center">
              <p className="text-ink-muted mb-4">Por ahora no hay títulos cargados. Pide el que buscas y te avisamos.</p>
              <Link href="/solicitudes" className="inline-flex items-center px-5 py-2.5 bg-brand-500 text-white text-sm font-semibold rounded-lg hover:bg-brand-600 transition-colors">
                Dejar mi pedido
              </Link>
            </section>
          )}

          <section className="mb-16">
            <h2 className="font-display text-2xl font-bold text-ink mb-4">Temas que más se buscan</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                "Unidad Popular y Allende",
                "Dictadura y memorias",
                "Guerra del Pacífico",
                "Pueblos originarios y mundo mapuche",
                "El ciclo del salitre",
                "Independencia y siglo XIX",
              ].map((t) => (
                <div key={t} className="bg-white border border-cream-dark rounded-xl px-4 py-3 text-sm text-ink">
                  {t}
                </div>
              ))}
            </div>
          </section>

          <section className="mb-16 bg-ink text-cream rounded-2xl p-8 md:p-10">
            <h2 className="font-display text-2xl font-bold mb-3">¿Tienes historia de Chile que ya leíste?</h2>
            <p className="text-white/80 max-w-2xl leading-relaxed mb-5">
              Hay demanda todo el año, de estudiantes a coleccionistas. Publicar es gratis
              y cobramos una comisión pequeña solo cuando el libro se vende.
            </p>
            <Link href="/publish" className="inline-flex items-center px-6 py-3 bg-brand-500 text-white text-sm font-semibold rounded-xl hover:bg-brand-600 transition-colors">
              Publicar un libro →
            </Link>
          </section>

          <section className="mb-12">
            <h2 className="font-display text-2xl font-bold text-ink mb-6">Preguntas frecuentes</h2>
            <div className="space-y-4">
              {faqs.map((f, i) => (
                <details key={i} className="group bg-white border border-cream-dark/50 rounded-xl p-5 cursor-pointer">
                  <summary className="font-semibold text-ink list-none flex justify-between items-center">
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
    </>
  );
}
