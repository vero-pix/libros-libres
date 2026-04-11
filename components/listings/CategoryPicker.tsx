"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export interface CategoryPickerValue {
  category: string | null;
  subcategory: string | null;
}

interface Props {
  value: CategoryPickerValue;
  onChange: (value: CategoryPickerValue) => void;
  className?: string;
}

interface CatRow {
  slug: string;
  name: string;
  parent_slug: string | null;
  sort_order: number;
}

export default function CategoryPicker({ value, onChange, className = "" }: Props) {
  const [rows, setRows] = useState<CatRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("categories")
      .select("slug,name,parent_slug,sort_order")
      .order("sort_order", { ascending: true })
      .then(({ data }) => {
        setRows((data as CatRow[]) ?? []);
        setLoading(false);
      });
  }, []);

  const roots = rows.filter((c) => !c.parent_slug);
  const children = value.category
    ? rows.filter((c) => c.parent_slug === value.category)
    : [];

  const inputClass =
    "w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 bg-white";

  if (loading) {
    return (
      <div className={`text-xs text-gray-400 ${className}`}>Cargando categorías…</div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">
          Categoría principal
        </label>
        <select
          value={value.category ?? ""}
          onChange={(e) =>
            onChange({ category: e.target.value || null, subcategory: null })
          }
          className={inputClass}
        >
          <option value="">Sin categoría</option>
          {roots.map((r) => (
            <option key={r.slug} value={r.slug}>
              {r.name}
            </option>
          ))}
        </select>
      </div>

      {value.category && children.length > 0 && (
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Subcategoría <span className="text-gray-400 font-normal">(opcional)</span>
          </label>
          <select
            value={value.subcategory ?? ""}
            onChange={(e) =>
              onChange({ category: value.category, subcategory: e.target.value || null })
            }
            className={inputClass}
          >
            <option value="">Sin subcategoría</option>
            {children.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}

/** Convierte slugs de categoría/subcategoría a nombre legible (para books.genre legacy). */
export function categoryDisplayName(
  rows: CatRow[],
  category: string | null,
  subcategory: string | null
): string | null {
  if (subcategory) {
    return rows.find((r) => r.slug === subcategory)?.name ?? null;
  }
  if (category) {
    return rows.find((r) => r.slug === category)?.name ?? null;
  }
  return null;
}
