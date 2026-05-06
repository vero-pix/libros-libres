"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

function CategoryRequestButton() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSend() {
    if (!text.trim()) return;
    setLoading(true);
    await fetch("/api/category-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ suggestion: text }),
    });
    setSent(true);
    setLoading(false);
  }

  if (sent) {
    return <p className="text-xs text-green-600 mt-1">¡Gracias! Lo revisamos pronto.</p>;
  }

  return (
    <div className="mt-1">
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-xs text-brand-500 hover:text-brand-700 hover:underline"
        >
          ¿No encuentras tu categoría? Sugiérela
        </button>
      ) : (
        <div className="flex gap-2 items-center mt-1">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Ej: Manga, Arquitectura..."
            className="flex-1 px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-400"
            autoFocus
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={loading || !text.trim()}
            className="text-xs bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg"
          >
            {loading ? "…" : "Enviar"}
          </button>
          <button type="button" onClick={() => setOpen(false)} className="text-xs text-gray-400 hover:text-gray-600">✕</button>
        </div>
      )}
    </div>
  );
}

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
      <CategoryRequestButton />
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
