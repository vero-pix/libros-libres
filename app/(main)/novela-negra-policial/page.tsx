import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import ListingCard from "@/components/listings/ListingCard";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import { sortListingsForDisplay } from "@/lib/sortListings";
import type { ListingWithBook } from "@/types";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Novela Negra y Policial Usada en Chile",
  description:
    "Compra novela negra y policial usada en Chile: Simenon y el comisario Maigret, Camilleri, Mankell, Vázquez Montalbán, Agatha Christie y más. Segunda mano, envío a todo Chile o retiro en mano.",
  alternates: { canonical: "https://tuslibros.cl/novela-negra-policial" },
  keywords: [
    "novela negra",
    "novela policial",
    "novela negra usada",
    "comprar novela negra chile",
    "policial segunda mano",
    "maigret simenon",
    "agatha christie usada",
    "novela negra nordica",
  ],
  openGraph: {
    title: "Novela Negra y Policial Usada en Chile",
    description:
      "Simenon, Camilleri, Mankell, Christie y toda la novela negra usada. Pago protegido y envío a todo Chile.",
    url: "https://tuslibros.cl/novela-negra-policial",
    siteName: "tuslibros.cl",
    locale: "es_CL",
    type: "website",
  },
};

const NEGRA_NEEDLES = [
  "simenon", "camilleri", "mankell", "vazquez montalban", "vázquez montalbán",
  "benjamin black", "raymond chandler", "dashiell hammett", "james ellroy",
  "henning", "jo nesbo", "jo nesbø", "patricia highsmith", "maigret",
  "agatha christie", "hercule poirot", "comisario", "detective", "asesinato",
  "crimen", "homicidio", "intriga policial",
];

const faqs = [
  {
    q: "¿Qué autores de novela negra encuentro acá?",
    a: "Mucho Georges Simenon con el comisario Maigret, además de Camilleri, Henning Mankell, Vázquez Montalbán, Benjamin Black, Agatha Christie y clásicos del policial. El catálogo va creciendo a medida que lectores suben los suyos.",
  },
  {
    q: "¿Por qué comprar novela negra usada?",
    a: "Porque es un género que se devora y se relee menos: hay muchísimos ejemplares en buen estado dando vueltas, a precio de usado. Perfecto para coleccionar sagas completas como Maigret o Montalbano sin pagar de nuevo.",
  },
  {
    q: "¿Cómo compro y recibo el libro?",
    a: "Pagas protegido con MercadoPago: tu dinero queda retenido hasta que confirmas que recibiste el libro. Eliges retiro en mano gratis o despacho por courier a todo Chile.",
  },
  {
    q: "¿No está el título que busco?",
    a: "Déjalo en la sección Se busca: publicas el policial que andas persiguiendo y te avisamos por correo cuando alguien lo suba.",
  },
];

export default async function NovelaNegraPage() {
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
    const tag = (item.book.tags ?? []).some((t: string) => /negra|policial|suspenso/i.test(t));
    return tag || NEGRA_NEEDLES.some((n) => hay.includes(n.normalize("NFD").replace(/[̀-ͯ]/g, "")));
  }) as unknown as ListingWithBook[];

  const listings = sortListingsForDisplay(matched).slice(0, 8);

  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Novela Negra y Policial Usada en Chile",
    description: "Catálogo de novela negra y policial de segunda mano en Chile.",
    url: "https://tuslibros.cl/novela-negra-policial",
  };
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: "https://tuslibros.cl" },
      { "@type": "ListItem", position: 2, name: "Novela Negra y Policial", item: "https://tuslibros.cl/novela-negra-policial" },
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
        <main className="max-w-6xl mx-auto px-6 py-10">
          <Breadcrumbs items={[{ label: "Inicio", href: "/" }, { label: "Novela Negra y Policial" }]} />

          <section className="mt-8 mb-12 max-w-3xl">
            <h1 className="font-display text-4xl sm:text-5xl font-bold text-ink leading-[1.05] tracking-tight">
              Novela negra y policial,{" "}
              <span className="italic text-brand-600">usada y para no soltar.</span>
            </h1>
            <p className="mt-6 text-lg text-ink-muted leading-relaxed">
              El comisario Maigret de Simenon, Montalbano de Camilleri, el frío de Mankell,
              la astucia de Agatha Christie. Toda la novela negra y policial de segunda
              mano, en buen estado y a precio de usado — ideal para completar sagas sin
              gastar de más. Pago protegido con MercadoPago y envío a todo Chile.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/search?q=novela%20negra" className="inline-flex items-center px-6 py-3 bg-brand-500 text-white text-sm font-semibold rounded-xl hover:bg-brand-600 transition-colors shadow-sm">
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
                <Link href="/search?q=novela%20negra" className="text-sm text-brand-600 font-semibold hover:text-brand-700 transition-colors">
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

          <section className="mb-16 bg-ink text-cream rounded-2xl p-8 md:p-10">
            <h2 className="font-display text-2xl font-bold mb-3">¿Tienes policiales que ya leíste?</h2>
            <p className="text-white/80 max-w-2xl leading-relaxed mb-5">
              El género negro tiene lectores fieles todo el año. Publicar es gratis y
              cobramos una comisión pequeña solo cuando el libro se vende.
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
