import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import ListingCard from "@/components/listings/ListingCard";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import { ButtonLink } from "@/components/ui/Button";
import { ordenarParaGrilla } from "@/lib/sortListings";
import { obtenerTarifasCoordinado } from "@/lib/shipping/coordinado";
import type { ListingWithBook } from "@/types";

export const revalidate = 300;

const URL = "https://tuslibros.cl/libros-usados-baratos";

/*
 * Rehecha el 27-09-2026. En 90 días de Search Console la consulta que trae
 * gente acá es «libros baratos» (157 impresiones, posición 7,9, 3 clics), no
 * «libros usados baratos» (posición 33). Por eso el title y el H1 abren con
 * «Libros baratos».
 *
 * La versión anterior mostraba los 12 libros más baratos a secas (casi todos
 * del mismo vendedor, siempre los mismos) y prometía dos cosas falsas: que
 * MercadoPago retiene el pago hasta que confirmas (con split el vendedor cobra
 * al instante) y despacho por Starken/Chilexpress/Blue Express/99 Minutos (era
 * Shipit, apagado el 15-09). Ahora la grilla es de todo lo bajo $5.000,
 * repartida por vendedor y rotando cada día, y el despacho sale de las tarifas
 * vigentes en `site_config`.
 */
export const metadata: Metadata = {
  // "desde $1.000" prometía algo que el catálogo no sostiene (27 jul). El
  // 27-09 había 114 libros entre $1.000 y $3.000 y 489 bajo $5.000, de 54
  // vendedores: "cientos bajo $5.000" se cumple al aterrizar.
  title: "Libros baratos en Chile: cientos de usados bajo $5.000",
  description:
    "Libros baratos usados: cientos bajo $5.000 y la mitad del catálogo bajo $10.000. Novela, infantiles, historia y escolares de decenas de vendedores de todo Chile. Retiro en mano o despacho.",
  alternates: { canonical: URL },
  keywords: [
    "libros baratos",
    "libros baratos chile",
    "libros usados baratos",
    "comprar libros baratos",
    "donde comprar libros baratos",
    "libros economicos chile",
    "libros de segunda mano baratos",
    "libros baratos online",
  ],
  openGraph: {
    title: "Libros baratos en Chile: cientos de usados bajo $5.000",
    description:
      "Cientos de libros usados bajo $5.000, de vendedores de todo Chile. Retiro en mano o despacho.",
    url: URL,
    siteName: "tuslibros.cl",
    locale: "es_CL",
    type: "website",
  },
};

// Bajo $1.000 no hay precio real en el catálogo: son errores de tipeo ($10,
// $20) que quedaban primeros en la grilla. Saneamiento, no dato de negocio.
const PRECIO_MINIMO_CREIBLE = 1000;
const TOPE_BARATO = 5000;
const EN_GRILLA = 24;

const TRAMOS = [
  { hasta: 3000, label: "Bajo $3.000" },
  { hasta: 5000, label: "Bajo $5.000" },
  { hasta: 10000, label: "Bajo $10.000" },
];

// Slugs de `books.category` (los que usa /search?category=).
const CATEGORIAS = [
  { slug: "ficcion", label: "Novela y cuentos" },
  { slug: "no-ficcion", label: "Historia, ensayo y no ficción" },
  { slug: "infantil-juvenil", label: "Infantiles y juveniles" },
  { slug: "academico", label: "Académicos" },
  { slug: "idiomas", label: "Idiomas" },
];

const clp = (n: number) => `$${n.toLocaleString("es-CL")}`;
const buscar = (params: Record<string, string | number>) =>
  `/search?${new URLSearchParams({ sort: "price_asc", ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])) })}`;

export default async function LibrosUsadosBaratosPage() {
  const supabase = await createClient();

  const [{ data: raw }, { count: bajo10k }, tarifas] = await Promise.all([
    supabase
      .from("listings")
      .select(`*, book:books(*), seller:users(id, full_name, avatar_url, username)`)
      .eq("status", "active")
      .neq("deprioritized", true)
      .gte("price", PRECIO_MINIMO_CREIBLE)
      .lte("price", TOPE_BARATO)
      // Techo de 1.000 filas de Supabase: hoy son ~490, sobra.
      .limit(1000),
    supabase
      .from("listings")
      .select("id", { count: "exact", head: true })
      .eq("status", "active")
      .gte("price", PRECIO_MINIMO_CREIBLE)
      .lte("price", 10000),
    obtenerTarifasCoordinado(supabase),
  ]);

  const todos = ((raw ?? []) as unknown as ListingWithBook[]).filter((l) => l.book);
  const bajo5k = todos.length;
  const bajo3k = todos.filter((l) => (l.price ?? 0) <= 3000).length;
  const vendedores = new Set(todos.map((l) => l.seller_id)).size;
  const conteo: Record<number, number | null> = { 3000: bajo3k, 5000: bajo5k, 10000: bajo10k };

  const porCategoria = CATEGORIAS.map((c) => ({
    ...c,
    n: todos.filter((l) => l.book.category === c.slug).length,
  })).filter((c) => c.n > 0);

  // Repartida por vendedor y con rotación diaria: sin esto, la grilla eran
  // siempre los mismos 12 libros, casi todos de un solo vendedor.
  const grilla = ordenarParaGrilla(todos).slice(0, EN_GRILLA);

  const faqs = [
    {
      q: "¿Dónde comprar libros baratos en Chile?",
      a: `En tuslibros.cl, un marketplace chileno donde personas y librerías de viejo venden sus libros usados. Hoy hay ${bajo5k} libros bajo $5.000 y ${bajo3k} bajo $3.000, publicados por ${vendedores} vendedores distintos. Mirar no requiere registro.`,
    },
    {
      q: "¿Cómo encuentro los libros más baratos?",
      a: "En el buscador ordenas por precio de menor a mayor, o filtras por un tope de precio. Si ya sabes qué título quieres, búscalo por nombre y ordena por precio: puede haber más de un ejemplar a distinto valor.",
    },
    {
      q: "¿Un libro barato está en mal estado?",
      a: "No necesariamente. Muchos están en muy buen estado: su dueño solo quiere que circulen. Cada publicación declara la condición del ejemplar (como nuevo, muy bueno, bueno, aceptable) y tiene fotos. Si tienes una duda, le escribes al vendedor por mensaje antes de comprar.",
    },
    {
      q: "¿El despacho no me encarece el libro?",
      a: tarifas
        ? `Puede, y por eso conviene mirar el retiro en mano: el mapa te muestra los libros más cerca tuyo. Si necesitas despacho, cuesta ${clp(tarifas.santiago)} dentro de Santiago y ${clp(tarifas.otra_region)} a otra región, y el vendedor lo manda por el courier que elija. Si compras varios libros del mismo vendedor, pagas un solo despacho.`
        : "Puede, y por eso conviene mirar el retiro en mano: el mapa te muestra los libros más cerca tuyo. Si compras varios libros del mismo vendedor, coordinas un solo envío.",
    },
    {
      q: "¿Cómo se paga?",
      a: "Según lo que acepte cada vendedor: con MercadoPago dentro del sitio, por transferencia (el vendedor te manda sus datos por mensaje) o en efectivo al retirar. Si pagaste por MercadoPago y el libro llega dañado o distinto a lo publicado, tienes 7 días para pedir la devolución.",
    },
    {
      q: "¿Y si el libro que busco no está?",
      a: "Déjalo en Se busca: anotas el título y te aviso por correo cuando alguien lo publique.",
    },
  ];

  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Libros baratos en Chile",
    description: `${bajo5k} libros usados bajo $5.000 en tuslibros.cl.`,
    url: URL,
  };
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: "https://tuslibros.cl" },
      { "@type": "ListItem", position: 2, name: "Libros baratos", item: URL },
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
          <Breadcrumbs items={[{ label: "Inicio", href: "/" }, { label: "Libros baratos" }]} />

          <section className="mt-8 mb-10 max-w-3xl animate-fade-in-up">
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-ink leading-[1.05] tracking-tight">
              Libros baratos —{" "}
              <span className="italic text-brand-600">usados, y cientos bajo $5.000.</span>
            </h1>
            <p className="mt-6 text-lg text-ink-muted leading-relaxed">
              ¿Cuánto cuesta un libro que alguien ya leyó y quiere que siga circulando? Acá, muchas
              veces menos que un café con torta. Junto los libros usados que publican personas y
              librerías de viejo de todo Chile, y en esta página te dejo solo los más baratos.
            </p>
          </section>

          {/* Tramos de precio */}
          <section className="mb-12" aria-label="Buscar por precio">
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {TRAMOS.map((t) => (
                <Link
                  key={t.hasta}
                  href={buscar({ price_max: t.hasta })}
                  className="group bg-white border border-cream-dark rounded-xl p-3 sm:p-5 hover:border-brand-500 hover:-translate-y-0.5 hover:shadow-card transition-all"
                >
                  <p className="font-display text-base sm:text-2xl font-bold text-ink group-hover:text-brand-600 transition-colors">
                    {t.label}
                  </p>
                  <p className="mt-1 text-xs sm:text-sm text-ink-muted">
                    {conteo[t.hasta] ? `${conteo[t.hasta]!.toLocaleString("es-CL")} libros` : "Ver libros"} →
                  </p>
                </Link>
              ))}
            </div>
          </section>

          {grilla.length > 0 && (
            <section className="mb-12">
              <div className="flex items-baseline justify-between mb-5 gap-4">
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-ink">Bajo $5.000, hoy</h2>
                <span className="text-sm text-ink-muted shrink-0">
                  {bajo5k} libros · {vendedores} vendedores
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {grilla.map((l) => (
                  <ListingCard key={l.id} listing={l} />
                ))}
              </div>
              <div className="mt-8 text-center">
                <ButtonLink href={buscar({ price_max: TOPE_BARATO })}>
                  Ver los {bajo5k} libros bajo $5.000 →
                </ButtonLink>
              </div>
            </section>
          )}

          {porCategoria.length > 0 && (
            <section className="mb-16">
              <h2 className="font-display text-2xl font-bold text-ink mb-5">Baratos por tema</h2>
              <div className="flex flex-wrap gap-3">
                {porCategoria.map((c) => (
                  <Link
                    key={c.slug}
                    href={buscar({ category: c.slug, price_max: TOPE_BARATO })}
                    className="inline-flex items-center gap-2 bg-white border border-cream-dark rounded-full px-4 py-2 text-sm text-ink hover:border-brand-500 hover:text-brand-600 transition-colors"
                  >
                    {c.label}
                    <span className="text-ink-muted font-mono text-xs">{c.n}</span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <section className="mb-16">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-ink mb-6">¿Por qué tan baratos?</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl p-6 border border-cream-dark">
                <h3 className="font-display text-lg font-bold text-ink mb-2">Lo vende quien lo leyó</h3>
                <p className="text-sm text-ink-muted leading-relaxed">
                  No hay bodega ni cadena de por medio. El precio lo pone cada vendedor, y quien
                  quiere hacer espacio en la repisa suele cobrar poco.
                </p>
              </div>
              <div className="bg-white rounded-xl p-6 border border-cream-dark">
                <h3 className="font-display text-lg font-bold text-ink mb-2">Comparas antes de comprar</h3>
                <p className="text-sm text-ink-muted leading-relaxed">
                  Cada ficha trae enlaces para buscar el mismo libro en Buscalibre, MercadoLibre e
                  IberLibro. Ves con tus ojos cuánto te ahorras.
                </p>
              </div>
              <div className="bg-white rounded-xl p-6 border border-cream-dark">
                <h3 className="font-display text-lg font-bold text-ink mb-2">El despacho, si lo evitas, mejor</h3>
                <p className="text-sm text-ink-muted leading-relaxed">
                  En un libro de $3.000 el envío puede costar más que el libro. El{" "}
                  <Link href="/mapa" className="text-brand-600 underline underline-offset-2 hover:text-brand-700">
                    mapa
                  </Link>{" "}
                  te muestra los que están cerca, para retirar en mano.
                </p>
              </div>
            </div>
          </section>

          <section className="mb-16 bg-ink text-cream rounded-2xl p-8 md:p-12">
            <h2 className="font-display text-2xl sm:text-3xl font-bold mb-4">¿Buscas un título puntual? Pídelo.</h2>
            <p className="text-cream/80 max-w-2xl leading-relaxed mb-6">
              En Se busca dejas el título que andas persiguiendo y te aviso por correo cuando alguien
              lo publique. A veces aparece a precio de usado a la semana.
            </p>
            <ButtonLink href="/solicitudes">Dejar mi pedido →</ButtonLink>
          </section>

          <section className="mb-12">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-ink mb-6">Preguntas frecuentes</h2>
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
              <Link href="/lotes-de-libros" className="text-sm text-brand-600 font-medium hover:text-brand-700 underline underline-offset-2 transition-colors">Lotes de libros</Link>
              <span className="text-ink-muted">·</span>
              <Link href="/libros-infantiles" className="text-sm text-brand-600 font-medium hover:text-brand-700 underline underline-offset-2 transition-colors">Libros infantiles</Link>
              <span className="text-ink-muted">·</span>
              <Link href="/libros-escolares" className="text-sm text-brand-600 font-medium hover:text-brand-700 underline underline-offset-2 transition-colors">Libros escolares</Link>
              <span className="text-ink-muted">·</span>
              <Link href="/libros-usados-chile" className="text-sm text-brand-600 font-medium hover:text-brand-700 underline underline-offset-2 transition-colors">Libros usados en Chile</Link>
            </div>
          </section>
        </main>
      </div>
    </>
  );
}
