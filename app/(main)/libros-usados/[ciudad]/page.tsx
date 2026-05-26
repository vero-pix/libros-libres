import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createPublicClient } from "@/lib/supabase/public";
import ListingCard from "@/components/listings/ListingCard";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import { sortListingsForDisplay } from "@/lib/sortListings";
import type { ListingWithBook } from "@/types";
import { CIUDADES, COORDS, ORDEN } from "../ciudades";

export const revalidate = 3600;

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function generateStaticParams() {
  return Object.keys(CIUDADES).map((ciudad) => ({ ciudad }));
}

export async function generateMetadata({ params }: { params: { ciudad: string } }): Promise<Metadata> {
  const city = CIUDADES[params.ciudad];
  if (!city) return { title: "Ciudad no encontrada — tuslibros.cl" };

  const title = `Libros usados en ${city.label} | Compra y venta | tuslibros.cl`;
  const url = `https://tuslibros.cl/libros-usados/${params.ciudad}`;

  return {
    title,
    description: city.intro,
    alternates: { canonical: url },
    openGraph: {
      title: `Libros usados en ${city.label} — tuslibros.cl`,
      description: city.intro,
      url,
      siteName: "tuslibros.cl",
      type: "website",
      locale: "es_CL",
    },
  };
}

async function getListings(slug: string): Promise<ListingWithBook[]> {
  const geo = COORDS[slug];
  if (!geo) return [];
  const { lat, lng, radiusKm } = geo;

  const supabase = createPublicClient();
  // Bounding box ~radiusKm: 1° lat ≈ 111km, 1° lng ≈ 111km·cos(lat)
  const dLat = radiusKm / 111;
  const dLng = radiusKm / (111 * Math.cos((lat * Math.PI) / 180));

  const { data } = await supabase
    .from("listings")
    .select(`*, book:books(*), seller:users(id, full_name, avatar_url, username, mercadopago_user_id)`)
    .eq("status", "active")
    .not("latitude", "is", null)
    .not("longitude", "is", null)
    .gte("latitude", lat - dLat)
    .lte("latitude", lat + dLat)
    .gte("longitude", lng - dLng)
    .lte("longitude", lng + dLng)
    .order("created_at", { ascending: false })
    .limit(200);

  const near = ((data as unknown as ListingWithBook[]) ?? []).filter((l) => {
    const lLat = (l as any).latitude;
    const lLng = (l as any).longitude;
    return lLat != null && lLng != null && haversineKm(lat, lng, lLat, lLng) <= radiusKm;
  });

  return sortListingsForDisplay(near).slice(0, 18);
}

export default async function LibrosUsadosCiudadPage({ params }: { params: { ciudad: string } }) {
  const city = CIUDADES[params.ciudad];
  if (!city) notFound();

  const slug = params.ciudad;
  const url = `https://tuslibros.cl/libros-usados/${slug}`;
  const listings = await getListings(slug);
  const otras = ORDEN.filter((s) => s !== slug);

  return (
    <>
      <div className="min-h-screen bg-cream">
        <main className="max-w-6xl mx-auto px-6 py-10">
          <Breadcrumbs
            items={[
              { label: "Inicio", href: "/" },
              { label: "Libros usados", href: "/libros-usados" },
              { label: city.label },
            ]}
          />

          {/* Hero */}
          <section className="mt-8 mb-16 max-w-3xl">
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-ink leading-[1.05] tracking-tight">
              Libros usados en {city.label}.<br />
              <span className="italic text-brand-600">{city.heroSub}</span>
            </h1>
            <p className="mt-6 text-lg text-ink-muted leading-relaxed">{city.intro}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/?view=map"
                className="inline-flex items-center px-6 py-3 bg-brand-500 text-white text-sm font-semibold rounded-md hover:bg-brand-600 transition-colors shadow"
              >
                Buscar en el mapa
              </Link>
              <Link
                href="/publish"
                className="inline-flex items-center px-6 py-3 bg-white text-ink text-sm font-semibold rounded-md border border-cream-dark hover:border-brand-300 transition-colors"
              >
                Publicar un libro
              </Link>
            </div>
          </section>

          {/* Listings */}
          {listings.length > 0 ? (
            <section className="mb-16">
              <div className="flex justify-between items-end mb-6">
                <h2 className="font-display text-3xl font-bold text-ink">
                  Disponibles ahora en {city.label}
                </h2>
                <Link
                  href="/search"
                  className="hidden md:inline-flex items-center text-sm font-semibold text-brand-600 hover:text-brand-700 transition-colors"
                >
                  Ver todos los libros →
                </Link>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {listings.map((l) => (
                  <ListingCard key={l.id} listing={l} />
                ))}
              </div>
            </section>
          ) : (
            <section className="mb-16 text-center py-16 bg-white rounded-2xl border border-cream-dark">
              <p className="font-display text-2xl text-ink-light mb-2">
                Aún no hay libros publicados en {city.label}.
              </p>
              <p className="text-sm text-ink-muted mb-6">
                Si tienes libros en {city.label}, publícalos gratis y llega a compradores de la zona.
              </p>
              <Link
                href="/publish"
                className="inline-block px-6 py-2.5 bg-brand-600 text-white rounded-full text-sm font-semibold hover:bg-brand-700 transition-colors"
              >
                Publicar un libro →
              </Link>
            </section>
          )}

          {/* Beneficios */}
          <section className="mb-16">
            <div className="bg-white rounded-2xl p-8 md:p-12 border border-cream-dark">
              <h2 className="font-display text-3xl font-bold text-ink mb-8">
                Por qué comprar libros usados acá
              </h2>
              <div className="grid md:grid-cols-3 gap-8">
                <div>
                  <div className="w-10 h-10 bg-brand-100 text-brand-600 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="font-display text-lg font-bold text-ink mb-2">Retiro o despacho</h3>
                  <p className="text-sm text-ink-muted leading-relaxed">
                    Coordina retiro en persona con el vendedor de la zona o recibe el libro por courier en tu casa. Tú eliges.
                  </p>
                </div>
                <div>
                  <div className="w-10 h-10 bg-brand-100 text-brand-600 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="font-display text-lg font-bold text-ink mb-2">Buen precio</h3>
                  <p className="text-sm text-ink-muted leading-relaxed">
                    Libros usados a una fracción del valor en librería, vendidos por lectores reales que ya los disfrutaron.
                  </p>
                </div>
                <div>
                  <div className="w-10 h-10 bg-brand-100 text-brand-600 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <h3 className="font-display text-lg font-bold text-ink mb-2">Pago seguro</h3>
                  <p className="text-sm text-ink-muted leading-relaxed">
                    Pagas vía MercadoPago. El dinero se libera al vendedor solo cuando confirmas que recibiste el libro en buen estado.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* FAQ */}
          <section className="mb-16">
            <h2 className="font-display text-3xl font-bold text-ink mb-8">Preguntas frecuentes</h2>
            <div className="space-y-4">
              {city.faqs.map((f, i) => (
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

          {/* Enlazado interno entre ciudades */}
          <section className="mb-8">
            <h2 className="font-display text-2xl font-bold text-ink mb-4">Explora por ciudad</h2>
            <div className="flex flex-wrap gap-2">
              {otras.map((s) => (
                <Link
                  key={s}
                  href={`/libros-usados/${s}`}
                  className="px-4 py-2 bg-white text-ink-muted text-sm rounded-full border border-cream-dark hover:border-brand-300 hover:text-brand-600 transition-colors"
                >
                  Libros usados en {CIUDADES[s].label}
                </Link>
              ))}
              <Link
                href="/libros-usados-chile"
                className="px-4 py-2 bg-white text-ink-muted text-sm rounded-full border border-cream-dark hover:border-brand-300 hover:text-brand-600 transition-colors"
              >
                Libros usados en todo Chile
              </Link>
            </div>
          </section>
        </main>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: `Libros usados en ${city.label}`,
            description: city.intro,
            url,
            isPartOf: { "@type": "WebSite", name: "tuslibros.cl", url: "https://tuslibros.cl" },
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: city.faqs.map((f) => ({
              "@type": "Question",
              name: f.q,
              acceptedAnswer: { "@type": "Answer", text: f.a },
            })),
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Inicio", item: "https://tuslibros.cl" },
              { "@type": "ListItem", position: 2, name: "Libros usados", item: "https://tuslibros.cl/libros-usados" },
              { "@type": "ListItem", position: 3, name: `Libros usados en ${city.label}`, item: url },
            ],
          }),
        }}
      />
    </>
  );
}
