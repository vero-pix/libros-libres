import Link from "next/link";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface Props {
  items: BreadcrumbItem[];
}

/**
 * Las piezas del medio no se achican (tienen su tope de 200px) y la última,
 * que suele ser el título del libro, cede el espacio y se corta con "…".
 * Antes ninguna podía achicarse: con un título largo la miga medía más que la
 * pantalla y en un iPhone de 390px la ficha quedaba de 415px, con la barra
 * fija de compra corrida hacia afuera (23-09-2026).
 */
export default function Breadcrumbs({ items }: Props) {
  return (
    <nav className="flex min-w-0 items-center gap-1.5 text-sm text-ink-muted mb-4" aria-label="Breadcrumbs">
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <span key={i} className={`flex items-center gap-1.5 ${isLast ? "min-w-0" : "shrink-0"}`}>
            {i > 0 && <span className="text-ink-muted/50">/</span>}
            {isLast || !item.href ? (
              <span className="text-ink font-medium truncate min-w-0 max-w-[200px]">{item.label}</span>
            ) : (
              <Link href={item.href} className="hover:text-brand-600 transition-colors truncate max-w-[200px]">
                {item.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
