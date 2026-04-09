"use client";

import { useState } from "react";
import Link from "next/link";
import { translateGenre, CATEGORY_GROUPS } from "@/lib/genres";

interface CategoryCount {
  genre: string;
  count: number;
}

interface Props {
  categories: CategoryCount[];
  activeGenre?: string;
  uncategorizedCount?: number;
}

export default function CategoriesSidebar({ categories, activeGenre, uncategorizedCount }: Props) {
  const countMap = new Map(categories.map((c) => [c.genre, c.count]));

  const groups = CATEGORY_GROUPS
    .map((group) => ({
      ...group,
      items: group.genres
        .filter((g) => countMap.has(g))
        .map((g) => ({ genre: g, count: countMap.get(g)! })),
    }))
    .filter((group) => group.items.length > 0);

  const groupedGenres = new Set(CATEGORY_GROUPS.flatMap((g) => g.genres));
  const ungrouped = categories.filter((c) => !groupedGenres.has(c.genre));

  // Determine which group is initially open (the one containing active genre, or first)
  const activeGroupIdx = activeGenre
    ? groups.findIndex((g) => g.items.some((i) => i.genre === activeGenre))
    : 0;

  const [openGroups, setOpenGroups] = useState<Set<number>>(() => {
    const initial = new Set<number>();
    if (activeGroupIdx >= 0) initial.add(activeGroupIdx);
    else if (groups.length > 0) initial.add(0);
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
              !activeGenre
                ? "bg-brand-50 text-brand-600 font-medium"
                : "text-ink-muted hover:bg-cream-warm hover:text-ink"
            }`}
          >
            Todos
          </Link>
        </li>
      </ul>

      {groups.map((group, idx) => {
        const isOpen = openGroups.has(idx);
        const groupCount = group.items.reduce((sum, i) => sum + i.count, 0);
        return (
          <div key={group.label} className="mt-3">
            <button
              onClick={() => toggleGroup(idx)}
              className="w-full flex items-center justify-between px-3 py-1.5 group"
            >
              <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted/60 group-hover:text-ink-muted transition-colors">
                {group.label}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="text-[10px] text-ink-muted/40">{groupCount}</span>
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
            {isOpen && (
              <ul className="space-y-0.5 mt-0.5">
                {group.items.map((cat) => (
                  <li key={cat.genre}>
                    <Link
                      href={`/?genre=${encodeURIComponent(cat.genre)}`}
                      className={`block text-sm py-1.5 px-3 rounded-lg transition-colors ${
                        activeGenre === cat.genre
                          ? "bg-brand-50 text-brand-600 font-medium"
                          : "text-ink-muted hover:bg-cream-warm hover:text-ink"
                      }`}
                    >
                      {translateGenre(cat.genre)}{" "}
                      <span className="text-ink-light text-xs">({cat.count})</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}

      {ungrouped.length > 0 && (
        <div className="mt-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted/60 px-3 mb-1">
            Otros
          </p>
          <ul className="space-y-0.5">
            {ungrouped.map((cat) => (
              <li key={cat.genre}>
                <Link
                  href={`/?genre=${encodeURIComponent(cat.genre)}`}
                  className={`block text-sm py-1.5 px-3 rounded-lg transition-colors ${
                    activeGenre === cat.genre
                      ? "bg-brand-50 text-brand-600 font-medium"
                      : "text-ink-muted hover:bg-cream-warm hover:text-ink"
                  }`}
                >
                  {translateGenre(cat.genre)}{" "}
                  <span className="text-ink-light text-xs">({cat.count})</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {(uncategorizedCount ?? 0) > 0 && (
        <div className="mt-3">
          <ul className="space-y-0.5">
            <li>
              <Link
                href="/?genre=sin-categoria"
                className={`block text-sm py-1.5 px-3 rounded-lg transition-colors ${
                  activeGenre === "sin-categoria"
                    ? "bg-brand-50 text-brand-600 font-medium"
                    : "text-ink-muted hover:bg-cream-warm hover:text-ink"
                }`}
              >
                Sin categoría{" "}
                <span className="text-ink-light text-xs">({uncategorizedCount})</span>
              </Link>
            </li>
          </ul>
        </div>
      )}
    </aside>
  );
}
