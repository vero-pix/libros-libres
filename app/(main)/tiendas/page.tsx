import Link from "next/link";
import Image from "next/image";
import { unstable_cache } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tiendas y librerías",
  description:
    "Las librerías y vendedores con más libros usados publicados en tuslibros.cl. Explora sus catálogos y compra directo con pago protegido.",
  alternates: { canonical: "https://tuslibros.cl/tiendas" },
};

export const revalidate = 300;

interface Store {
  id: string;
  full_name: string | null;
  username: string | null;
  city: string | null;
  avatar_url: string | null;
  _count: number;
}

// Ranking de tiendas por publicaciones activas (dato honesto hoy; ventas quedan fuera
// mientras sean ~0). Cacheado. Idea de Carlos (CIMLibros).
const getStoreRanking = unstable_cache(
  async (): Promise<Store[]> => {
    const supabase = createPublicClient();
    const { data: listings } = await supabase
      .from("listings")
      .select("seller_id")
      .eq("status", "active");
    const counts = new Map<string, number>();
    for (const l of listings ?? []) counts.set(l.seller_id, (counts.get(l.seller_id) ?? 0) + 1);
    const ranked = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
    const ids = ranked.map(([id]) => id);
    if (ids.length === 0) return [];
    const { data: users } = await supabase
      .from("users")
      .select("id, full_name, username, city, avatar_url")
      .in("id", ids);
    const byId = new Map((users ?? []).map((u) => [u.id, u]));
    return ranked
      .map(([id, count]) => {
        const u = byId.get(id);
        return u ? { ...u, _count: count } : null;
      })
      .filter((s): s is Store => s !== null);
  },
  ["store-ranking-v1"],
  { revalidate: 300 }
);

export default async function TiendasPage() {
  const stores = await getStoreRanking();
  const medal = (i: number) => (i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : null);

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
        <ol className="space-y-3">
          {stores.map((s, i) => (
            <li key={s.id}>
              <Link
                href={`/vendedor/${s.username ?? s.id}`}
                className="group flex items-center gap-4 bg-white rounded-2xl border border-cream-dark p-4 hover:border-coral/40 hover:shadow-sm transition-all"
              >
                <div className="w-7 text-center flex-shrink-0">
                  {medal(i) ? (
                    <span className="text-xl">{medal(i)}</span>
                  ) : (
                    <span className="font-display text-lg font-bold text-ink-muted">{i + 1}</span>
                  )}
                </div>
                <div className="w-12 h-12 rounded-full bg-ink text-white flex items-center justify-center text-base font-bold flex-shrink-0 overflow-hidden">
                  {s.avatar_url ? (
                    <Image src={s.avatar_url} alt={s.full_name ?? "Tienda"} width={48} height={48} className="object-cover w-full h-full" />
                  ) : (
                    (s.full_name ?? "?")[0]?.toUpperCase()
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-ink truncate">{s.full_name ?? "Tienda"}</p>
                  {s.city && <p className="text-xs text-ink-muted mt-0.5">{s.city}</p>}
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-display text-lg font-bold text-ink tabular-nums leading-none">{s._count}</p>
                  <p className="text-[10px] font-mono uppercase tracking-wider text-ink-muted mt-1">libros</p>
                </div>
                <span className="text-sm font-semibold text-brand-600 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 hidden sm:block">
                  Ver →
                </span>
              </Link>
            </li>
          ))}
        </ol>

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
