"use client";

import { useState, useMemo, useEffect } from "react";
import type { ListingWithBook } from "@/types";
import ListingCard from "./ListingCard";

interface Props {
  listings: ListingWithBook[];
  /** slug → nombre legible, desde la tabla `categories`. */
  nombresCategoria?: Record<string, string>;
}

/** Cuántas tarjetas se pintan de una. El perfil de libro.de.ocasion tiene
 *  1.682 libros: pintarlos todos eran 442 pantallas de scroll y otras tantas
 *  portadas cargando. */
const TANDA = 48;

/** Una tienda con menos libros que esto no gana nada con mesas. */
const MINIMO_PARA_MESAS = 20;
/** Una mesa con menos de esto se ve vacía; su contenido queda en "Todos". */
const MINIMO_POR_MESA = 5;
/** Cuántas mesas temáticas, fuera de "Todos" y "Piezas". */
const MAX_MESAS = 5;

type Mesa = { id: string; nombre: string; cuantos: number };

/**
 * Las mesas de una librería de viejo: en vez de una grilla donde un atlas de
 * 1931 aparece al lado de un texto escolar, el vendedor tiene secciones.
 * Salen de lo que la tienda REALMENTE tiene (18-09-2026), no de una lista fija:
 * primero las piezas de colección, después sus categorías más pobladas.
 */
function armarMesas(listings: ListingWithBook[], nombres: Record<string, string>): Mesa[] {
  if (listings.length < MINIMO_PARA_MESAS) return [];

  const mesas: Mesa[] = [];
  const piezas = listings.filter((l) => (l as unknown as Record<string, unknown>).is_collectible).length;
  if (piezas >= 3) mesas.push({ id: "piezas", nombre: "Piezas", cuantos: piezas });

  const porCategoria = new Map<string, number>();
  for (const l of listings) {
    const cat = (l.book as unknown as Record<string, string | null>)?.subcategory
      || (l.book as unknown as Record<string, string | null>)?.category;
    if (!cat) continue;
    porCategoria.set(cat, (porCategoria.get(cat) ?? 0) + 1);
  }

  const ordenadas = Array.from(porCategoria.entries())
    .filter(([, n]) => n >= MINIMO_POR_MESA)
    .sort((a, b) => b[1] - a[1])
    .slice(0, MAX_MESAS);

  for (const [slug, n] of ordenadas) {
    mesas.push({ id: slug, nombre: nombres[slug] ?? slug, cuantos: n });
  }
  return mesas;
}

function enMesa(l: ListingWithBook, mesa: string): boolean {
  if (mesa === "todos") return true;
  if (mesa === "piezas") return !!(l as unknown as Record<string, unknown>).is_collectible;
  const libro = l.book as unknown as Record<string, string | null>;
  return libro?.subcategory === mesa || libro?.category === mesa;
}

export default function SellerListingsGrid({ listings, nombresCategoria = {} }: Props) {
  const [query, setQuery] = useState("");
  const [visibles, setVisibles] = useState(TANDA);
  const [mesa, setMesa] = useState("todos");

  const mesas = useMemo(() => armarMesas(listings, nombresCategoria), [listings, nombresCategoria]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    const base = mesa === "todos" ? listings : listings.filter((l) => enMesa(l, mesa));
    if (!q) return base;
    return base.filter((l) => {
      const title = l.book.title?.toLowerCase() ?? "";
      const author = l.book.author?.toLowerCase() ?? "";
      return title.includes(q) || author.includes(q);
    });
  }, [query, listings, mesa]);

  // En "Piezas" manda el precio, no el orden general. `is_collectible` está
  // diluido —de los 56 de Vero, veintitantos son Simenon de $7.990— así que
  // sin esto la mesa abría con lo más barato y el Plutarco de 1821 quedaba
  // enterrado. El precio no es la medida de una pieza, pero es la que hay.
  const ordenados = useMemo(() => {
    if (mesa !== "piezas") return filtered;
    return [...filtered].sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
  }, [filtered, mesa]);

  // Al cambiar la búsqueda se vuelve a la primera tanda: si no, una consulta
  // con pocos resultados heredaba el "ver más" de la anterior.
  useEffect(() => setVisibles(TANDA), [query, mesa]);

  const mostrados = ordenados.slice(0, visibles);
  const restantes = ordenados.length - mostrados.length;

  return (
    <div>
      {/* Search input */}
      <div className="relative mb-5">
        <svg
          className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted/60 pointer-events-none"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
          />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por título o autor..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-cream-dark/40 bg-cream-warm/50 text-sm text-ink placeholder:text-ink-muted/50 focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-300 transition-colors"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted/60 hover:text-ink transition-colors"
            aria-label="Limpiar búsqueda"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Las mesas. Solo aparecen si la tienda es grande: con quince libros,
          separarlos en secciones deja cada una con tres. */}
      {mesas.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {[{ id: "todos", nombre: "Todos", cuantos: listings.length }, ...mesas].map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMesa(m.id)}
              aria-pressed={mesa === m.id}
              className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
                mesa === m.id
                  ? "border-ink bg-ink text-cream"
                  : "border-cream-dark/50 bg-cream-warm/40 text-ink-muted hover:border-ink/40 hover:text-ink"
              }`}
            >
              {m.nombre}
              <span className={`ml-1.5 tabular-nums ${mesa === m.id ? "text-cream/60" : "text-ink-muted/60"}`}>
                {m.cuantos}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Cuántos hay y cuántos se están viendo */}
      <p className="text-xs text-ink-muted mb-3">
        {query ? (
          <>
            {filtered.length} {filtered.length === 1 ? "resultado" : "resultados"} para &ldquo;{query}&rdquo;
          </>
        ) : (
          <>
            {filtered.length.toLocaleString("es-CL")} libros
            {mesa !== "todos" && <> en {mesas.find((m) => m.id === mesa)?.nombre.toLowerCase()}</>}
            {restantes > 0 && <> · mostrando los primeros {mostrados.length}</>}
          </>
        )}
      </p>

      {/* Grid */}
      {filtered.length > 0 ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
            {mostrados.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
          {restantes > 0 && (
            <div className="text-center mt-8">
              <button
                type="button"
                onClick={() => setVisibles((v) => v + TANDA)}
                className="px-6 py-3 rounded-xl border border-ink/15 bg-white text-sm font-semibold text-ink hover:border-brand-300 hover:text-brand-600 transition-colors"
              >
                Ver más libros ({restantes.toLocaleString("es-CL")} {restantes === 1 ? "restante" : "restantes"})
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-10 text-ink-muted">
          <p className="text-sm">No se encontraron libros para &ldquo;{query}&rdquo;</p>
        </div>
      )}
    </div>
  );
}
