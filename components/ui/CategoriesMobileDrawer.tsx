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
}

export default function CategoriesMobileDrawer({ categories, activeGenre }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:hidden mb-4">
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 text-sm font-medium text-ink bg-white border border-cream-dark/30 rounded-xl px-4 py-2.5 shadow-sm active:scale-[0.98] transition-transform"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-ink-muted">
          <path d="M2 4h12M4 8h8M6 12h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        {activeGenre ? translateGenre(activeGenre) : "Categorías"}
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-40 animate-in fade-in duration-200"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer from bottom */}
      <div
        className={`fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-2xl shadow-2xl transition-transform duration-300 ease-out max-h-[70vh] flex flex-col ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-cream-dark/40" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-cream-dark/20">
          <h2 className="font-display font-bold text-base text-ink">Categorías</h2>
          <button
            onClick={() => setOpen(false)}
            className="text-ink-muted text-sm hover:text-ink"
          >
            Cerrar
          </button>
        </div>

        {/* List */}
        <div className="overflow-y-auto flex-1 px-3 py-3">
          <ul className="space-y-0.5">
            <li>
              <Link
                href="/"
                onClick={() => setOpen(false)}
                className={`block text-sm py-3 px-4 rounded-xl transition-colors ${
                  !activeGenre
                    ? "bg-brand-50 text-brand-600 font-medium"
                    : "text-ink-muted active:bg-cream-warm"
                }`}
              >
                Todos
              </Link>
            </li>
            {(() => {
              const countMap = new Map(categories.map((c) => [c.genre, c.count]));
              const groupedGenres = new Set(CATEGORY_GROUPS.flatMap((g) => g.genres));
              const groups = CATEGORY_GROUPS
                .map((group) => ({
                  ...group,
                  items: group.genres.filter((g) => countMap.has(g)).map((g) => ({ genre: g, count: countMap.get(g)! })),
                }))
                .filter((g) => g.items.length > 0);
              const ungrouped = categories.filter((c) => !groupedGenres.has(c.genre));

              return [...groups.map((group) => (
                <li key={group.label}>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted/50 px-4 pt-3 pb-1">{group.label}</p>
                  <ul className="space-y-0.5">
                    {group.items.map((cat) => (
                      <li key={cat.genre}>
                        <Link href={`/?genre=${encodeURIComponent(cat.genre)}`} onClick={() => setOpen(false)}
                          className={`flex items-center justify-between text-sm py-2.5 px-4 rounded-xl transition-colors ${activeGenre === cat.genre ? "bg-brand-50 text-brand-600 font-medium" : "text-ink-muted active:bg-cream-warm"}`}>
                          <span>{translateGenre(cat.genre)}</span>
                          <span className="text-xs text-ink-light bg-cream-warm rounded-full px-2 py-0.5">{cat.count}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </li>
              )), ...ungrouped.map((cat) => (
                <li key={cat.genre}>
                  <Link href={`/?genre=${encodeURIComponent(cat.genre)}`} onClick={() => setOpen(false)}
                    className={`flex items-center justify-between text-sm py-2.5 px-4 rounded-xl transition-colors ${activeGenre === cat.genre ? "bg-brand-50 text-brand-600 font-medium" : "text-ink-muted active:bg-cream-warm"}`}>
                    <span>{translateGenre(cat.genre)}</span>
                    <span className="text-xs text-ink-light bg-cream-warm rounded-full px-2 py-0.5">{cat.count}</span>
                  </Link>
                </li>
              ))];
            })()}
          </ul>
        </div>
      </div>
    </div>
  );
}
