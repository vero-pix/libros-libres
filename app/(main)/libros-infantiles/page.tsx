import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import ListingCard from "@/components/listings/ListingCard";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import { ordenarParaGrilla } from "@/lib/sortListings";
import { libroUrl } from "@/lib/urls";
import type { ListingWithBook } from "@/types";

export const revalidate = 300;

const URL = "https://tuslibros.cl/libros-infantiles";

/** Valor exacto de books.category. El mismo que usa /categoria/infantil-juvenil. */
const CATEGORIA = "infantil-juvenil";
const SUB_INFANTIL = "infantil-juvenil-infantil";
const SUB_JUVENIL = "infantil-juvenil-juvenil";

export const metadata: Metadata = {
  title: "Libros infantiles y juveniles usados en Chile",
  description:
    "Libros infantiles y juveniles usados en Chile: Papelucho, cuentos ilustrados, lectura complementaria y novela juvenil. Fotos reales del ejemplar, los precios más bajos del catálogo y envío a todo el país.",
  alternates: { canonical: URL },
  keywords: [
    "libros infantiles",
    "libros infantiles usados",
    "libro infantil",
    "libros para niños",
    "libros para niños baratos",
    "cuentos infantiles usados",
    "libros juveniles usados",
    "novela juvenil usada",
    "lectura complementaria usada",
    "papelucho",
    "libros infantiles chile",
    "comprar libros infantiles usados",
    "libros de niños segunda mano",
    "libros usados para niños chile",
  ],
  openGraph: {
    title: "Libros infantiles y juveniles usados en Chile",
    description:
      "Papelucho, cuentos ilustrados, lectura complementaria y novela juvenil de segunda mano. Con fotos reales y el estado a la vista.",
    url: URL,
    siteName: "tuslibros.cl",
    locale: "es_CL",
    type: "website",
  },
};

const faqs = [
  {
    q: "¿Por qué comprar usados los libros de niños?",
    a: "Porque son los que menos duran en una casa. El libro perfecto a los siete años sobra a los nueve, y casi siempre queda en buen estado: se leyó dos veranos y se guardó. Es la categoría más barata del sitio, con muchos títulos entre $2.000 y $6.000, y la que más sentido hace comprar de segunda mano.",
  },
  {
    q: "¿Se consigue la lectura complementaria del colegio?",
    a: "Es de lo que más circula, sobre todo entre marzo y mayo. Si el título de la lista de tu curso no aparece hoy, créame una solicitud en /solicitudes: cuando alguien lo publique te aviso por correo. No tienes que pasar revisando el sitio.",
  },
  {
    q: "¿En qué estado llegan?",
    a: "Cada publicación trae fotos reales del ejemplar y la condición declarada por quien lo vende. En libros de niños es normal encontrar una esquina doblada o un nombre escrito en la primera página; si lo tiene, está dicho. Mira las fotos antes de comprar.",
  },
  {
    q: "¿Desde qué edad sirven los que tienen acá?",
    a: "Hay desde cuentos ilustrados para quien recién empieza a leer solo —Papelucho, Perrault, los de la colección Barco de Vapor— hasta novela juvenil para adolescentes: romance, fantasía y distopías. Cada ficha dice la editorial y el año, que suele ser la mejor pista de para qué edad es.",
  },
  {
    q: "¿Hacen envíos a regiones?",
    a: "A todo Chile por courier. Los libros de niños son livianos, así que el despacho sale barato, y sobre $20.000 de compra el envío va gratis. También puedes coordinar retiro en mano con el vendedor: en cada ficha aparece su comuna.",
  },
  {
    q: "Tengo los libros que mis hijos ya no leen, ¿los puedo vender?",
    a: "Sí, y es lo que más me piden. Publicar es gratis: fotos, precio y en qué estado está. Solo cobro 8% cuando la venta pasa por MercadoPago o por despacho con courier; si lo entregas en mano, no pago nada. Una caja de libros que ya nadie abre en tu casa es exactamente lo que otra mamá anda buscando.",
  },
];

const QUE_HAY = [
  {
    title: "Papelucho y los clásicos chilenos",
    desc: "Marcela Paz, Floridor Pérez, Hernán del Solar, las Mitos y Leyendas de Chile. Los mismos que leímos nosotros y que siguen en las listas del colegio.",
  },
  {
    title: "Cuentos e ilustrados",
    desc: "Perrault, Nöstlinger, la colección Barco de Vapor, los Tea Stilton. Para quien recién lee solo y todavía necesita dibujos.",
  },
  {
    title: "Novela juvenil",
    desc: "Romance y fantasía para adolescentes: Alice Kellen, Mercedes Ron, Ariana Godoy, Joana Marcús, Rebecca Yarros, Laura Gallego.",
  },
  {
    title: "Lectura complementaria",
    desc: "Los títulos que pide el colegio, que se compran en marzo y se guardan en diciembre. Acá vuelven a circular en vez de quedarse en la repisa.",
  },
];

const clp = (n: number | null | undefined) =>
  typeof n === "number" ? `$${n.toLocaleString("es-CL")}` : "";

export default async function LibrosInfantilesPage() {
  const supabase = await createClient();

  const { data: raw } = await supabase
    .from("listings")
    .select(
      `*, book:books!inner(*), seller:users(id, full_name, avatar_url, username, mercadopago_user_id, on_vacation, vacation_message)`
    )
    .eq("status", "active")
    .eq("book.category", CATEGORIA);

  const todos = (raw as unknown as ListingWithBook[]) ?? [];

  // El reparto por vendedor evita que la grilla quede copada por quien subió
  // más libros de una vez. Los 'sin subcategoría' caen en la grilla general.
  const infantiles = ordenarParaGrilla(
    todos.filter((l) => l.book?.subcategory === SUB_INFANTIL)
  ).slice(0, 16);
  const juveniles = ordenarParaGrilla(
    todos.filter((l) => l.book?.subcategory === SUB_JUVENIL)
  ).slice(0, 16);

  // Los más baratos: el gancho real de la categoría. Precio de verdad, no un
  // "desde" inventado.
  const baratos = todos
    .filter((l) => typeof l.price === "number" && l.price > 0)
    .sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
  const precioMinimo = baratos[0]?.price ?? null;

  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Libros infantiles y juveniles usados en Chile",
    description:
      "Libros infantiles y juveniles de segunda mano en Chile: Papelucho, cuentos ilustrados, lectura complementaria y novela juvenil, con fotos reales y envío a todo el país.",
    url: URL,
  };

  const destacados = [...infantiles, ...juveniles].slice(0, 20);
  const itemListJsonLd =
    destacados.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "Libros infantiles y juveniles disponibles",
          numberOfItems: destacados.length,
          itemListElement: destacados.map((l, i) => ({
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
      { "@type": "ListItem", position: 2, name: "Libros infantiles y juveniles", item: URL },
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
            items={[{ label: "Inicio", href: "/" }, { label: "Libros infantiles y juveniles" }]}
          />

          <section className="mt-8 mb-16 max-w-3xl animate-fade-up">
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-ink leading-[1.05] tracking-tight">
              Libros infantiles y juveniles usados —{" "}
              <span className="italic text-brand-600">los que se leen rápido y se pasan.</span>
            </h1>
            <p className="mt-6 text-lg text-ink-muted leading-relaxed">
              El libro que era perfecto a los siete años sobra a los nueve. Por eso esta es la
              categoría que más sentido hace comprar usada: se leyeron dos veranos, quedaron
              como nuevos y cuestan una fracción. Papelucho, cuentos ilustrados, la lectura
              complementaria del colegio y la novela juvenil que se pasan entre amigas.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={todos.length > 0 ? `/?category=${CATEGORIA}` : "/solicitudes"}
                className="inline-flex items-center px-6 py-3 bg-brand-500 text-white text-sm font-semibold rounded-xl hover:bg-brand-600 transition-colors shadow-sm"
              >
                {todos.length > 0
                  ? `Ver los ${todos.length} libros disponibles`
                  : "Pedir el libro que buscas"}
              </Link>
              <Link
                href="/publish"
                className="inline-flex items-center px-6 py-3 bg-white border border-ink/20 text-ink text-sm font-semibold rounded-xl hover:border-brand-500 hover:text-brand-600 transition-colors"
              >
                Vender los que ya no leen →
              </Link>
            </div>
            {precioMinimo !== null && (
              <p className="mt-4 text-sm text-ink-muted">
                Hoy el más barato está en{" "}
                <strong className="text-ink">{clp(precioMinimo)}</strong>.
              </p>
            )}
          </section>

          {infantiles.length > 0 && (
            <section className="mb-16">
              <h2 className="font-display text-3xl font-bold text-ink mb-3">Para los más chicos</h2>
              <p className="text-ink-muted leading-relaxed max-w-3xl mb-8">
                Cuentos, ilustrados y los chilenos de siempre. Los que se leen en voz alta antes
                de dormir y los primeros que el niño lee solo, sin que nadie lo obligue.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {infantiles.map((l) => (
                  <ListingCard key={l.id} listing={l} />
                ))}
              </div>
              <div className="mt-6">
                <Link
                  href={`/?category=${CATEGORIA}&subcategory=${SUB_INFANTIL}`}
                  className="inline-flex items-center text-brand-600 font-semibold hover:text-brand-700 transition-colors"
                >
                  Ver todos los infantiles →
                </Link>
              </div>
            </section>
          )}

          {juveniles.length > 0 && (
            <section className="mb-16">
              <h2 className="font-display text-3xl font-bold text-ink mb-3">Juvenil</h2>
              <p className="text-ink-muted leading-relaxed max-w-3xl mb-8">
                Romance, fantasía y distopías para adolescentes. Son los libros que se leen en una
                semana y se prestan al curso entero, así que llegan acá rápido y en buen estado.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {juveniles.map((l) => (
                  <ListingCard key={l.id} listing={l} />
                ))}
              </div>
              <div className="mt-6">
                <Link
                  href={`/?category=${CATEGORIA}&subcategory=${SUB_JUVENIL}`}
                  className="inline-flex items-center text-brand-600 font-semibold hover:text-brand-700 transition-colors"
                >
                  Ver todos los juveniles →
                </Link>
              </div>
            </section>
          )}

          <section className="mb-16">
            <h2 className="font-display text-2xl font-bold text-ink mb-4">Qué se encuentra acá</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {QUE_HAY.map((b) => (
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
                  ¿Tienes una caja de libros que tus hijos ya no abren?
                </h2>
                <p className="text-ink-muted leading-relaxed mb-4">
                  Es lo que más me preguntan. Esa caja que está arriba del clóset desde que el
                  menor entró a media es exactamente lo que otra mamá anda buscando en marzo,
                  con la lista del colegio en la mano.
                </p>
                <ul className="space-y-3 text-sm text-ink-muted">
                  <li><strong className="text-ink">Publicar es gratis.</strong> Foto, precio y en qué estado está. Un libro de niños se publica en cinco minutos.</li>
                  <li><strong className="text-ink">Tú pones el precio.</strong> Nadie te compra la caja entera a la baja para revenderla por unidad.</li>
                  <li><strong className="text-ink">Comisión 8% solo si se vende por la plataforma.</strong> Si lo entregas en mano, no cobro nada.</li>
                </ul>
                <Link href="/vender" className="inline-flex items-center mt-6 text-sm text-brand-600 font-semibold hover:text-brand-700 transition-colors">
                  Cómo vender en tuslibros.cl →
                </Link>
              </div>
              <div className="bg-cream p-6 rounded-xl border border-brand-100">
                <h3 className="font-display font-bold text-lg text-ink mb-2">
                  ¿Buscas un título de la lista del colegio?
                </h3>
                <p className="text-sm text-ink-muted mb-4">
                  Si hoy no está, no te quedes revisando el sitio todos los días. Déjalo pedido y
                  te escribo apenas alguien lo publique. En marzo es cuando más se mueven.
                </p>
                <Link href="/solicitudes" className="text-sm text-brand-600 font-semibold hover:text-brand-700 transition-colors">
                  Pedir un libro que no está →
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
              <Link href="/marcela-paz-libros" className="text-sm text-brand-600 font-medium hover:text-brand-700 underline underline-offset-2 transition-colors">Papelucho y Marcela Paz</Link>
              <span className="text-ink-muted">·</span>
              <Link href="/novelas-romanticas-usadas" className="text-sm text-brand-600 font-medium hover:text-brand-700 underline underline-offset-2 transition-colors">Novelas románticas</Link>
              <span className="text-ink-muted">·</span>
              <Link href="/distopias-clasicas" className="text-sm text-brand-600 font-medium hover:text-brand-700 underline underline-offset-2 transition-colors">Distopías clásicas</Link>
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
