import Link from "next/link";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface Props {
  items: BreadcrumbItem[];
}

export default function Breadcrumbs({ items }: Props) {
  return (
    <nav className="flex items-center gap-1.5 text-sm text-ink-muted mb-4" aria-label="Breadcrumbs">
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && <span className="text-ink-muted/50">/</span>}
            {isLast || !item.href ? (
              <span className="text-ink font-medium truncate max-w-[200px]">{item.label}</span>
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
