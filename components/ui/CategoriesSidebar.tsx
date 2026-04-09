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
  { tag: "BibliotecaDeBabel", label: "Biblioteca de Babel" },
  { tag: "Clasico", label: "Clásico" },
  { tag: "PrimeraEdicion", label: "Primera edición" },
  { tag: "Borges", label: "Borges" },
  { tag: "NovelaNegra", label: "Novela negra" },
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

      {categoryTree.map((group, idx) => {
        if (group.count === 0) return null;
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
                {group.children.map((sub) => {
                  if (sub.count === 0) return null;
                  return (
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
                  );
                })}
              </ul>
            )}
          </div>
        );
      })}

      {/* Tags destacados */}
      <div className="mt-6 pt-4 border-t border-cream-dark/20">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted/60 px-3 mb-2">
          Tags destacados
        </p>
        <div className="flex flex-wrap gap-1.5 px-3">
          {FEATURED_TAGS.map((t) => (
            <Link
              key={t.tag}
              href={`/?tag=${t.tag}`}
              className={`text-[11px] px-2.5 py-1 rounded-full transition-colors ${
                activeTag === t.tag
                  ? "bg-brand-500 text-white"
                  : "bg-cream-warm text-ink-muted hover:bg-brand-50 hover:text-brand-600"
              }`}
            >
              #{t.label}
            </Link>
          ))}
        </div>
      </div>
    </aside>
  );
}
