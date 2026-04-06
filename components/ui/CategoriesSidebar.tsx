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

export default function CategoriesSidebar({ categories, activeGenre }: Props) {
  // Build a lookup: genre → count
  const countMap = new Map(categories.map((c) => [c.genre, c.count]));

  // Group categories that actually have books
  const groups = CATEGORY_GROUPS
    .map((group) => ({
      ...group,
      items: group.genres
        .filter((g) => countMap.has(g))
        .map((g) => ({ genre: g, count: countMap.get(g)! })),
    }))
    .filter((group) => group.items.length > 0);

  // Ungrouped categories (exist in data but not in any group)
  const groupedGenres = new Set(CATEGORY_GROUPS.flatMap((g) => g.genres));
  const ungrouped = categories.filter((c) => !groupedGenres.has(c.genre));

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

      {groups.map((group) => (
        <div key={group.label} className="mt-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted/60 px-3 mb-1">
            {group.label}
          </p>
          <ul className="space-y-0.5">
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
        </div>
      ))}

      {ungrouped.length > 0 && (
        <div className="mt-4">
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
    </aside>
  );
}
