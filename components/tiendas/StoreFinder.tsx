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

  // Sin búsqueda ni región se muestra la vista por tamaño; con cualquiera de las
  // dos, la lista plana de lo que calza (quien busca quiere una tienda puntual).
  const buscando = normalizar(q) !== "" || region !== null;

  const medal = (i: number) => (i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : null);
  // La columna de la medalla existe solo si en lo que se ve hay alguna; si no,
  // queda un hueco a la izquierda de cada tienda.
  const hayMedallas = visibles.some((s) => medal(s.rank) !== null);

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

      {!buscando ? (
        <PorTamano stores={stores} medal={medal} />
      ) : visibles.length === 0 ? (
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
              <FilaTienda s={s} medalla={hayMedallas ? medal(s.rank) ?? "" : null} />
            </li>
          ))}
        </ol>
      )}
    </>
  );
}

/** Desde cuántos libros una tienda va en tarjeta, y desde cuántos entra a la lista visible. */
const GRANDE = 20;
const MEDIANA = 5;
const MEDIANAS_A_LA_VISTA = 12;

/**
 * La vista sin buscar, por tamaño (05-10-2026). Antes eran las 188 tiendas en
 * una sola lista que no terminaba nunca, y 121 tenían menos de 5 libros: el que
 * entraba a mirar librerías recorría decenas de vendedores con un libro antes
 * de llegar al final. Las chicas siguen a un clic y en el buscador.
 */
function PorTamano({ stores, medal }: { stores: StoreRow[]; medal: (i: number) => string | null }) {
  const [verMedianas, setVerMedianas] = useState(false);
  const [verChicas, setVerChicas] = useState(false);
  const grandes = stores.filter((s) => s._count >= GRANDE);
  const medianas = stores.filter((s) => s._count >= MEDIANA && s._count < GRANDE);
  const chicas = stores.filter((s) => s._count < MEDIANA);
  const medianasVisibles = verMedianas ? medianas : medianas.slice(0, MEDIANAS_A_LA_VISTA);

  return (
    <div className="space-y-10">
      {grandes.length > 0 && (
        <section>
          <h2 className="font-display text-xl font-bold text-ink mb-1">Las librerías grandes</h2>
          <p className="text-sm text-ink-muted mb-4">{grandes.length} tiendas con {GRANDE} libros o más.</p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {grandes.map((s) => (
              <li key={s.id}>
                <TarjetaTienda s={s} medalla={medal(s.rank)} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {medianas.length > 0 && (
        <section>
          <h2 className="font-display text-xl font-bold text-ink mb-1">Tiendas medianas</h2>
          <p className="text-sm text-ink-muted mb-4">{medianas.length} tiendas con entre {MEDIANA} y {GRANDE - 1} libros.</p>
          <ol className="space-y-3">
            {medianasVisibles.map((s) => (
              <li key={s.id}>
                <FilaTienda s={s} medalla={null} />
              </li>
            ))}
          </ol>
          {medianas.length > MEDIANAS_A_LA_VISTA && (
            <button
              type="button"
              onClick={() => setVerMedianas((v) => !v)}
              className="mt-4 text-sm font-semibold text-brand-600 hover:underline"
            >
              {verMedianas ? "Ver menos" : `Ver las ${medianas.length} tiendas medianas`}
            </button>
          )}
        </section>
      )}

      {chicas.length > 0 && (
        <section className="bg-cream-warm rounded-2xl border border-cream-dark p-5">
          <p className="text-sm text-ink">
            <span className="font-semibold">Y {chicas.length} vendedores que recién empiezan</span>, con menos de {MEDIANA} libros.
            Búscalos por nombre o comuna arriba.
          </p>
          <button
            type="button"
            onClick={() => setVerChicas((v) => !v)}
            className="mt-3 text-sm font-semibold text-brand-600 hover:underline"
          >
            {verChicas ? "Ocultarlos" : "Mostrarlos todos"}
          </button>
          {verChicas && (
            <ol className="space-y-3 mt-4">
              {chicas.map((s) => (
                <li key={s.id}>
                  <FilaTienda s={s} medalla={null} />
                </li>
              ))}
            </ol>
          )}
        </section>
      )}
    </div>
  );
}

function Avatar({ s, size }: { s: StoreRow; size: number }) {
  return (
    <div
      className="rounded-full bg-ink text-white flex items-center justify-center text-base font-bold flex-shrink-0 overflow-hidden"
      style={{ width: size, height: size }}
    >
      {s.avatar_url ? (
        <Image src={s.avatar_url} alt={s.full_name ?? "Tienda"} width={size} height={size} className="object-cover w-full h-full" />
      ) : (
        (s.full_name ?? "?")[0]?.toUpperCase()
      )}
    </div>
  );
}

function Lugar({ s }: { s: StoreRow }) {
  if (!s.city) return null;
  return (
    <p className="text-xs text-ink-muted mt-0.5 truncate">
      {s.city}
      {s.region && s.region !== s.city ? ` · ${s.region}` : ""}
    </p>
  );
}

function TarjetaTienda({ s, medalla }: { s: StoreRow; medalla: string | null }) {
  return (
    <Link
      href={`/vendedor/${s.username ?? s.id}`}
      className="group h-full flex items-center gap-4 bg-white rounded-2xl border border-cream-dark p-4 hover:border-coral/40 hover:shadow-sm hover:-translate-y-0.5 transition-all motion-reduce:hover:translate-y-0"
    >
      <Avatar s={s} size={56} />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-ink truncate">
          {medalla && <span className="mr-1.5" aria-hidden>{medalla}</span>}
          {s.full_name ?? "Tienda"}
        </p>
        <Lugar s={s} />
        <p className="text-xs font-semibold text-brand-600 mt-1.5">
          {s._count} libros <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
        </p>
      </div>
    </Link>
  );
}

/** `medalla`: null = sin columna de medalla; "" = columna vacía (para alinear con las que sí tienen). */
function FilaTienda({ s, medalla }: { s: StoreRow; medalla: string | null }) {
  return (
    <Link
      href={`/vendedor/${s.username ?? s.id}`}
      className="group flex items-center gap-4 bg-white rounded-2xl border border-cream-dark p-4 hover:border-coral/40 hover:shadow-sm transition-all"
    >
      {/* Solo las medallas de los 3 primeros de Chile (05-10-2026). El número
          del ranking nacional confundía al filtrar por región: en Maule la
          lista partía en "70". */}
      {medalla !== null && (
        <div className="w-7 text-center flex-shrink-0">
          {medalla && <span className="text-xl">{medalla}</span>}
        </div>
      )}
      <Avatar s={s} size={48} />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-ink truncate">{s.full_name ?? "Tienda"}</p>
        <Lugar s={s} />
      </div>
      <div className="text-right flex-shrink-0">
        <p className="font-display text-lg font-bold text-ink tabular-nums leading-none">{s._count}</p>
        <p className="text-[10px] font-mono uppercase tracking-wider text-ink-muted mt-1">libros</p>
      </div>
      <span className="text-sm font-semibold text-brand-600 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 hidden sm:block">
        Ver →
      </span>
    </Link>
  );
}
