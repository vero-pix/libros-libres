import Link from "next/link";

interface Props {
  currentPage: number;
  totalPages: number;
  buildHref: (page: number) => string;
}

export default function Pagination({ currentPage, totalPages, buildHref }: Props) {
  if (totalPages <= 1) return null;

  // Build page numbers to show
  const pages: (number | "...")[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 ||
      i === totalPages ||
      (i >= currentPage - 1 && i <= currentPage + 1)
    ) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== "...") {
      pages.push("...");
    }
  }

  return (
    <nav className="flex items-center justify-center gap-1 mt-8" aria-label="Paginación">
      {currentPage > 1 && (
        <Link
          href={buildHref(currentPage - 1)}
          className="px-3 py-1.5 text-sm text-ink-muted hover:text-brand-600 border border-cream-dark rounded-lg hover:border-brand-300 transition-colors"
        >
          Anterior
        </Link>
      )}

      {pages.map((p, i) =>
        p === "..." ? (
          <span key={`dots-${i}`} className="px-2 text-sm text-ink-muted">
            ...
          </span>
        ) : (
          <Link
            key={p}
            href={buildHref(p)}
            className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
              p === currentPage
                ? "bg-brand-500 text-white border-brand-500 font-semibold"
                : "text-ink-muted hover:text-brand-600 border-cream-dark hover:border-brand-300"
            }`}
          >
            {p}
          </Link>
        )
      )}

      {currentPage < totalPages && (
        <Link
          href={buildHref(currentPage + 1)}
          className="px-3 py-1.5 text-sm text-ink-muted hover:text-brand-600 border border-cream-dark rounded-lg hover:border-brand-300 transition-colors"
        >
          Siguiente
        </Link>
      )}
    </nav>
  );
}
