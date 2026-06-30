import type { SupabaseClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";

export const getAvailableTags = unstable_cache(
  async (): Promise<string[]> => {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from("books")
      .select("tags")
      .not("tags", "is", null);
    if (!data) return [];
    const set = new Set<string>();
    for (const row of data) {
      if (Array.isArray(row.tags)) row.tags.forEach((t: string) => set.add(t));
    }
    return Array.from(set);
  },
  ["available-tags"],
  { revalidate: 300 }
);

export interface CategoryNode {
  slug: string;
  name: string;
  count: number;
  children: CategoryNode[];
}

/**
 * Construye el árbol de categorías con conteos reales de TODO el inventario activo.
 */
export async function buildCategoryTree(
  supabase: SupabaseClient,
  _unusedListings?: any[], // Mantener firma para no romper tipos, pero no lo usamos
): Promise<CategoryNode[]> {
  // 1. Traemos la taxonomía completa
  const { data: dbCategories } = await supabase
    .from("categories")
    .select("slug, name, parent_slug, sort_order")
    .order("sort_order", { ascending: true });

  // 2. Traemos las categorías/subcategorías de TODOS los listings activos
  const { data: activeListings } = await supabase
    .from("listings")
    .select("book:books(category, subcategory)")
    .eq("status", "active");

  const catCount = new Map<string, number>();
  const subCount = new Map<string, number>();

  if (activeListings) {
    for (const l of activeListings) {
      const b = (l as any).book;
      if (b?.category) catCount.set(b.category, (catCount.get(b.category) ?? 0) + 1);
      if (b?.subcategory) subCount.set(b.subcategory, (subCount.get(b.subcategory) ?? 0) + 1);
    }
  }

  return (dbCategories ?? [])
    .filter((c) => !c.parent_slug)
    .map((root) => {
      const children = (dbCategories ?? [])
        .filter((c) => c.parent_slug === root.slug)
        .map((sub) => ({
          slug: sub.slug,
          name: sub.name,
          count: subCount.get(sub.slug) ?? 0,
          children: [],
        }))
        .sort((a, b) => b.count - a.count);

      // La cuenta del padre debe ser al menos la suma de sus hijos
      const directCount = catCount.get(root.slug) ?? 0;
      const childrenSum = children.reduce((sum, child) => sum + child.count, 0);
      const count = Math.max(directCount, childrenSum);

      return { slug: root.slug, name: root.name, count, children };
    });
}

/**
 * Versión cacheada del árbol de categorías. El árbol es global (conteos de TODO el
 * inventario activo, no depende de filtros ni de la búsqueda actual), así que se cachea
 * una sola vez y se reusa en home y search. Antes corría un full-scan de listings en
 * CADA carga de ambas páginas.
 */
export const getCachedCategoryTree = unstable_cache(
  async (): Promise<CategoryNode[]> => buildCategoryTree(createPublicClient()),
  ["category-tree-v1"],
  { revalidate: 300 }
);
