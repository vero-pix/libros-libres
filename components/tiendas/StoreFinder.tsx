"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";

export interface StoreRow {
  id: string;
  full_name: string | null;
  username: string | null;
  city: string | null;
  region: string | null;
  avatar_url: string | null;
  _count: number;
  /** Posición en el ranking global, guardada antes de filtrar: así la medalla no
   *  cambia de dueño cuando se busca por región. */
  rank: number;
}

function normalizar(s: string) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

/**
 * Buscador de tiendas: por nombre o comuna, y por región.
 *
 * La lista sola no alcanzaba: con más de cien tiendas, encontrar una era
 * imposible sin recorrerlas todas. El 28-08-2026 Vero no pudo llegar a la tienda
 * de una vendedora suya — el único camino era buscar un libro y entrar por la
 * ficha.
 */
export default function StoreFinder({ stores }: { stores: StoreRow[] }) {
  const [q, setQ] = useState("");
  const [region, setRegion] = useState<string | null>(null);

  // Solo las regiones que existen de verdad, ordenadas por cantidad de tiendas.
  const regiones = useMemo(() => {
    const c = new Map<string, number>();
    for (const s of stores) if (s.region) c.set(s.region, (c.get(s.region) ?? 0) + 1);
    return Array.from(c.entries()).sort((a, b) => b[1] - a[1]);
  }, [stores]);

  const visibles = useMemo(() => {
    const termino = normalizar(q);
    return stores.filter((s) => {
      if (region && s.region !== region) return false;
      if (!termino) return true;
      return (
        normalizar(s.full_name ?? "").includes(termino) ||
        normalizar(s.username ?? "").includes(termino) ||
        normalizar(s.city ?? "").includes(termino)
      );
    });
  }, [stores, q, region]);

  const medal = (i: number) => (i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : null);

  return (
    <>
      <div className="mb-6 space-y-3">
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted" aria-hidden>
            🔎
          </span>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Busca una tienda o una comuna — ej: Lorena, Concepción"
            aria-label="Buscar tienda por nombre o comuna"
            className="w-full bg-white border border-cream-dark rounded-2xl pl-11 pr-4 py-3 text-sm text-ink placeholder:text-ink-muted/70 focus:outline-none focus:border-coral/50 transition-colors"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setRegion(null)}
            className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
              region === null
                ? "bg-ink text-white border-ink"
                : "bg-white text-ink-muted border-cream-dark hover:border-coral/40"
            }`}
          >
            Todo Chile ({stores.length})
          </button>
          {regiones.map(([r, n]) => (
            <button
              key={r}
              type="button"
              onClick={() => setRegion(r === region ? null : r)}
              className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
                region === r
                  ? "bg-ink text-white border-ink"
                  : "bg-white text-ink-muted border-cream-dark hover:border-coral/40"
              }`}
            >
              {r} ({n})
            </button>
          ))}
        </div>
      </div>

      {visibles.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-cream-dark">
          <p className="text-ink font-semibold">No hay tiendas que calcen con eso.</p>
          <p className="text-sm text-ink-muted mt-2">
            Prueba con otra comuna, o{" "}
            <button
              type="button"
              onClick={() => {
                setQ("");
                setRegion(null);
              }}
              className="text-brand-600 underline"
            >
              mira todas las tiendas
            </button>
            .
          </p>
        </div>
      ) : (
        <ol className="space-y-3">
          {visibles.map((s) => (
            <li key={s.id}>
              <Link
                href={`/vendedor/${s.username ?? s.id}`}
                className="group flex items-center gap-4 bg-white rounded-2xl border border-cream-dark p-4 hover:border-coral/40 hover:shadow-sm transition-all"
              >
                <div className="w-7 text-center flex-shrink-0">
                  {medal(s.rank) ? (
                    <span className="text-xl">{medal(s.rank)}</span>
                  ) : (
                    <span className="font-display text-lg font-bold text-ink-muted">{s.rank + 1}</span>
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
                  {s.city && (
                    <p className="text-xs text-ink-muted mt-0.5">
                      {s.city}
                      {s.region && s.region !== s.city ? ` · ${s.region}` : ""}
                    </p>
                  )}
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
      )}
    </>
  );
}
