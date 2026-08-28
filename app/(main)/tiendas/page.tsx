import Link from "next/link";
import Image from "next/image";
import { unstable_cache } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import type { Metadata } from "next";
import StoreFinder, { type StoreRow } from "@/components/tiendas/StoreFinder";

export const metadata: Metadata = {
  // Estaba en posición 3.9 con CTR 0% (131 impresiones, 0 clics en 28 días): el
  // título "Tiendas y librerías" no decía libros usados ni ciudad, y la query que
  // la trae es "librerías de libros usados en santiago de chile".
  title: "Librerías de libros usados en Chile — compra directo",
  description:
    "Las librerías y vendedores con más libros usados de Chile: Santiago, Concepción, Talca y más. Explora sus catálogos y compra con pago protegido.",
  alternates: { canonical: "https://tuslibros.cl/tiendas" },
};

export const revalidate = 300;



// Ranking de tiendas por publicaciones activas (dato honesto hoy; ventas quedan fuera
// mientras sean ~0). Cacheado. Idea de Carlos (CIMLibros).
const getStoreRanking = unstable_cache(
  async (): Promise<StoreRow[]> => {
    const supabase = createPublicClient();
    // Paginado: Supabase corta en 1.000 filas y el ranking salía calculado sobre
    // media biblioteca. Ver [[reference_supabase_techo_1000_filas]]. (28-08-2026)
    const listings: { seller_id: string }[] = [];
    for (let desde = 0; ; desde += 1000) {
      const { data } = await supabase
        .from("listings")
        .select("seller_id")
        .eq("status", "active")
        .range(desde, desde + 999);
      listings.push(...(data ?? []));
      if (!data || data.length < 1000) break;
    }
    const counts = new Map<string, number>();
    for (const l of listings) counts.set(l.seller_id, (counts.get(l.seller_id) ?? 0) + 1);
    const ranked = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
    const ids = ranked.map(([id]) => id);
    if (ids.length === 0) return [];
    const { data: users } = await supabase
      .from("users")
      .select("id, full_name, username, city, avatar_url")
      .in("id", ids);
    const byId = new Map((users ?? []).map((u) => [u.id, u]));

    // La región no vive en `users` (city es la comuna): se resuelve con la tabla
    // `cities`, que es la fuente de verdad de la taxonomía geográfica.
    const { data: cities } = await supabase.from("cities").select("name, region");
    const regionPorComuna = new Map(
      (cities ?? []).map((c) => [(c.name ?? "").toLowerCase(), c.region as string | null])
    );

    return ranked
      .map(([id, count], i) => {
        const u = byId.get(id);
        if (!u) return null;
        return {
          ...u,
          _count: count,
          rank: i,
          region: regionPorComuna.get((u.city ?? "").toLowerCase()) ?? null,
        };
      })
      .filter((s): s is StoreRow => s !== null);
  },
  ["store-ranking-v2"],
  { revalidate: 300 }
);

export default async function TiendasPage() {
  const stores = await getStoreRanking();

  return (
    <div className="min-h-screen bg-cream">
      <section className="bg-cream-warm border-b border-cream-dark">
        <div className="max-w-3xl mx-auto px-6 py-12 text-center">
          <p className="text-[11px] font-mono uppercase tracking-[0.25em] text-brand-600 mb-3">
            Gente de confianza
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-ink leading-tight">
            Tiendas y librerías
          </h1>
          <p className="text-ink-muted mt-3 max-w-xl mx-auto leading-relaxed">
            {stores.length} tiendas activas publicando libros usados en Chile. Estas son las
            que más han subido — entra a su catálogo y compra directo con pago protegido.
          </p>
        </div>
      </section>

      <main className="max-w-3xl mx-auto px-6 py-8">
        <StoreFinder stores={stores} />

        <div className="text-center mt-10">
          <p className="text-sm text-ink-muted mb-3">¿Tienes libros que ya leíste? Abre tu propia tienda.</p>
          <Link
            href="/vender"
            className="inline-block bg-coral hover:bg-coral-deep text-white font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            Vender mis libros
          </Link>
        </div>
      </main>
    </div>
  );
}
