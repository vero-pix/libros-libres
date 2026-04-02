import Link from "next/link";

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
    <aside className="w-64 shrink-0 hidden lg:block">
      <h2 className="font-bold text-sm uppercase tracking-wider text-gray-900 mb-4">
        Categorías
      </h2>
      <ul className="space-y-1">
        <li>
          <Link
            href="/"
            className={`block text-sm py-1.5 transition-colors ${
              !activeGenre
                ? "text-brand-600 font-medium"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Todos
          </Link>
        </li>
        {categories.map((cat) => (
          <li key={cat.genre}>
            <Link
              href={`/?genre=${encodeURIComponent(cat.genre)}`}
              className={`block text-sm py-1.5 transition-colors ${
                activeGenre === cat.genre
                  ? "text-brand-600 font-medium"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {cat.genre}{" "}
              <span className="text-gray-400">({cat.count})</span>
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}
