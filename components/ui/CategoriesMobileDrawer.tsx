"use client";

import { useState } from "react";
import Link from "next/link";

interface CategoryCount {
  /** slug — se usa tal cual en la URL, NO tocar (hay SEO indexado). */
  category: string;
  /** nombre legible, viene de la tabla `categories` de Supabase. */
  name: string;
  count: number;
  /** nombre de la categoría padre, para agrupar. */
  group: string;
}

interface Props {
  categories: CategoryCount[];
  activeCategory?: string;
  activeCategoryName?: string;
}

export default function CategoriesMobileDrawer({ categories, activeCategory, activeCategoryName }: Props) {
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
        {activeCategoryName ?? "Categorías"}
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
                  !activeCategory
                    ? "bg-brand-50 text-brand-600 font-medium"
                    : "text-ink-muted active:bg-cream-warm"
                }`}
              >
                Todos
              </Link>
            </li>
            {(() => {
              // Agrupa por la categoría padre que viene del árbol de Supabase,
              // preservando el orden en que llegan (sort_order de la tabla).
              const groups: { label: string; items: CategoryCount[] }[] = [];
              for (const cat of categories) {
                const existing = groups.find((g) => g.label === cat.group);
                if (existing) existing.items.push(cat);
                else groups.push({ label: cat.group, items: [cat] });
              }

              return groups.map((group) => (
                <li key={group.label}>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted/50 px-4 pt-3 pb-1">{group.label}</p>
                  <ul className="space-y-0.5">
                    {group.items.map((cat) => (
                      <li key={cat.category}>
                        <Link href={`/?category=${encodeURIComponent(cat.category)}`} onClick={() => setOpen(false)}
                          className={`flex items-center justify-between gap-3 text-sm py-2.5 px-4 rounded-xl transition-colors ${activeCategory === cat.category ? "bg-brand-50 text-brand-600 font-medium" : "text-ink-muted active:bg-cream-warm"}`}>
                          <span>{cat.name}</span>
                          <span className="shrink-0 text-xs text-ink-light bg-cream-warm rounded-full px-2 py-0.5">{cat.count}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </li>
              ));
            })()}
          </ul>
        </div>
      </div>
    </div>
  );
}
