import type { SupabaseClient } from "@supabase/supabase-js";

export interface CategoryNode {
  slug: string;
  name: string;
  count: number;
  children: CategoryNode[];
}

/**
 * Construye el árbol de categorías con conteos de libros activos.
 */
export async function buildCategoryTree(
  supabase: SupabaseClient,
  listings: { book: { category?: string | null; subcategory?: string | null } }[],
): Promise<CategoryNode[]> {
  const { data: dbCategories } = await supabase
    .from("categories")
    .select("slug, name, parent_slug, sort_order")
    .order("sort_order", { ascending: true });

  const catCount = new Map<string, number>();
  const subCount = new Map<string, number>();
  for (const l of listings) {
    const b = l.book as any;
    if (b.category) catCount.set(b.category, (catCount.get(b.category) ?? 0) + 1);
    if (b.subcategory) subCount.set(b.subcategory, (subCount.get(b.subcategory) ?? 0) + 1);
  }

  return (dbCategories ?? [])
    .filter((c) => !c.parent_slug)
    .map((root) => ({
      slug: root.slug,
      name: root.name,
      count: catCount.get(root.slug) ?? 0,
      children: (dbCategories ?? [])
        .filter((c) => c.parent_slug === root.slug)
        .map((sub) => ({
          slug: sub.slug,
          name: sub.name,
          count: subCount.get(sub.slug) ?? 0,
          children: [],
        }))
        .sort((a, b) => b.count - a.count),
    }));
}
