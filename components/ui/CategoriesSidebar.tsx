"use client";

import { useState } from "react";
import Link from "next/link";

interface CategoryNode {
  slug: string;
  name: string;
  count: number;
  children: CategoryNode[];
}

const FEATURED_TAGS = [
  { tag: "Coleccionable", label: "Coleccionable" },
  { tag: "Poesia", label: "Poesía" },
  { tag: "Suspenso", label: "Suspenso" },
  { tag: "NovelaChilena", label: "Novela Chilena" },
  { tag: "BibliotecaDeBabel", label: "Biblioteca de Babel" },
  { tag: "Clasico", label: "Clásico" },
  { tag: "PrimeraEdicion", label: "1ª Edición" },
  { tag: "Borges", label: "Borges" },
  { tag: "NovelaNegra", label: "Novela Negra" },
  { tag: "Biografia", label: "Biografías" },
  { tag: "Comics", label: "Cómics" },
  { tag: "Humanidades", label: "Humanidades" },
];

interface Props {
  categoryTree: CategoryNode[];
  activeCategory?: string;
  activeSubcategory?: string;
  activeTag?: string;
  totalCount?: number;
}

export default function CategoriesSidebar({
  categoryTree,
  activeCategory,
  activeSubcategory,
  activeTag,
  totalCount,
}: Props) {
  // Open the group that contains the active subcategory
  const activeGroupIdx = activeCategory
    ? categoryTree.findIndex((c) => c.slug === activeCategory)
    : -1;

  const [openGroups, setOpenGroups] = useState<Set<number>>(() => {
    const initial = new Set<number>();
    if (activeGroupIdx >= 0) initial.add(activeGroupIdx);
    return initial;
  });

  function toggleGroup(idx: number) {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  }

  return (
    <aside className="w-56 shrink-0 hidden lg:block sticky top-20 self-start max-h-[calc(100vh-6rem)] overflow-y-auto">
      <h2 className="font-display font-bold text-base text-ink mb-4 tracking-tight">
        Categorías
      </h2>

      <ul className="space-y-0.5">
        <li>
          <Link
            href="/"
            className={`block text-sm py-2 px-3 rounded-lg transition-colors ${
              !activeCategory && !activeTag
                ? "bg-brand-50 text-brand-600 font-medium"
                : "text-ink-muted hover:bg-cream-warm hover:text-ink"
            }`}
          >
            Todos {totalCount != null && <span className="text-ink-light text-xs">({totalCount})</span>}
          </Link>
        </li>
      </ul>

      {categoryTree
        .map((group, idx) => {
        // Nota: mostramos TODAS las categorías de la taxonomía curada,
        // independiente del conteo. El count es solo informativo.
        const isOpen = openGroups.has(idx);
        return (
          <div key={group.slug} className="mt-3">
            <button
              onClick={() => toggleGroup(idx)}
              className="w-full flex items-center justify-between px-3 py-1.5 group"
            >
              <Link
                href={`/?category=${group.slug}`}
                onClick={(e) => e.stopPropagation()}
                className={`text-[11px] font-semibold uppercase tracking-wider transition-colors ${
                  activeCategory === group.slug && !activeSubcategory
                    ? "text-brand-600"
                    : "text-ink-muted/60 group-hover:text-ink-muted"
                }`}
              >
                {group.name}
              </Link>
              <span className="flex items-center gap-1.5">
                <span className="text-[10px] text-ink-muted/40">{group.count}</span>
                <svg
                  className={`w-3 h-3 text-ink-muted/40 transition-transform ${isOpen ? "rotate-180" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </span>
            </button>
            {isOpen && group.children.length > 0 && (
              <ul className="space-y-0.5 mt-0.5">
                {group.children.map((sub) => (
                    <li key={sub.slug}>
                      <Link
                        href={`/?category=${group.slug}&subcategory=${sub.slug}`}
                        className={`block text-sm py-1.5 px-3 rounded-lg transition-colors ${
                          activeSubcategory === sub.slug
                            ? "bg-brand-50 text-brand-600 font-medium"
                            : "text-ink-muted hover:bg-cream-warm hover:text-ink"
                        }`}
                      >
                        {sub.name}{" "}
                        <span className="text-ink-light text-xs">({sub.count})</span>
                      </Link>
                    </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}

      {/* Filtros de Precio */}
      <div className="mt-8 pt-4 border-t border-cream-dark/20">
        <p className="text-[11px] font-bold uppercase tracking-wider text-ink-muted/80 px-3 mb-3">
          Rango de Precio
        </p>
        <div className="space-y-1.5 px-1">
          {[
            { label: "Menos de $10.000", min: 0, max: 10000 },
            { label: "$10.000 - $25.000", min: 10000, max: 25000 },
            { label: "Más de $25.000", min: 25000, max: 1000000 },
          ].map((range) => (
            <Link
              key={range.label}
              href={`/?price_min=${range.min}&price_max=${range.max}`}
              className="block text-sm py-1.5 px-3 rounded-lg text-ink-muted hover:bg-cream-warm hover:text-ink transition-colors"
            >
              {range.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Filtro de Estado */}
      <div className="mt-8 pt-4 border-t border-cream-dark/20">
        <p className="text-[11px] font-bold uppercase tracking-wider text-ink-muted/80 px-3 mb-3">
          Estado del libro
        </p>
        <div className="space-y-1 px-1">
          {[
            { value: "new", label: "Como nuevo" },
            { value: "good", label: "Buen estado" },
            { value: "fair", label: "Estado regular" },
          ].map((cond) => (
            <Link
              key={cond.value}
              href={`/?condition=${cond.value}`}
              className="block text-sm py-1.5 px-3 rounded-lg text-ink-muted hover:bg-cream-warm hover:text-ink transition-colors"
            >
              {cond.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Temas Sugeridos (Tag Cloud) */}
      <div className="mt-8 pt-4 border-t border-cream-dark/20">
        <p className="text-[11px] font-bold uppercase tracking-wider text-ink-muted/80 px-3 mb-3">
          Temas sugeridos
        </p>
        <div className="flex flex-wrap gap-1.5 px-1">
          {FEATURED_TAGS.map((item) => (
            <Link
              key={item.tag}
              href={`/search?tag=${item.tag}`}
              className={`text-[10px] font-medium px-2 py-1 rounded-full border transition-all ${
                activeTag === item.tag
                  ? "bg-brand-500 text-white border-brand-600 shadow-sm"
                  : "bg-cream-warm text-ink-muted border-cream-dark/30 hover:bg-white hover:text-brand-600 hover:border-brand-200"
              }`}
            >
              #{item.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Limpiar Filtros */}
      {(activeCategory || activeTag) && (
        <div className="mt-8 px-3">
          <Link
            href="/"
            className="block text-center py-2 border border-cream-dark/40 text-ink-muted text-xs font-semibold rounded-xl hover:bg-white hover:text-brand-600 transition-colors"
          >
            Limpiar todos los filtros
          </Link>
        </div>
      )}
    </aside>
  );
}
