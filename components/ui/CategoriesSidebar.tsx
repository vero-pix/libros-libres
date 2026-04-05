import Link from "next/link";
import { translateGenre } from "@/lib/genres";

interface CategoryCount {
  genre: string;
  count: number;
}

interface Props {
  categories: CategoryCount[];
  activeGenre?: string;
}

export default function CategoriesSidebar({ categories, activeGenre }: Props) {
  return (
    <aside className="w-56 shrink-0 hidden lg:block sticky top-4 self-start max-h-[calc(100vh-2rem)] overflow-y-auto">
      <h2 className="font-display font-bold text-base text-ink mb-5 tracking-tight">
        Categorías
      </h2>
      <ul className="space-y-1">
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
        {categories.map((cat) => (
          <li key={cat.genre}>
            <Link
              href={`/?genre=${encodeURIComponent(cat.genre)}`}
              className={`block text-sm py-2 px-3 rounded-lg transition-colors ${
                activeGenre === cat.genre
                  ? "bg-brand-50 text-brand-600 font-medium"
                  : "text-ink-muted hover:bg-cream-warm hover:text-ink"
              }`}
            >
              {translateGenre(cat.genre)}{" "}
              <span className="text-ink-light">({cat.count})</span>
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}
