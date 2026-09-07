import Link from "next/link";

const secciones = [
  { href: "/ayuda", label: "Ayuda" },
  { href: "/ayuda/vender", label: "Quiero vender" },
  { href: "/ayuda/comprar", label: "Quiero comprar" },
  { href: "/ayuda/preguntas", label: "Preguntas frecuentes" },
];

export default function AyudaNav({ actual }: { actual: string }) {
  return (
    <nav aria-label="Secciones de ayuda" className="flex flex-wrap gap-2 justify-center mb-10">
      {secciones.map((s) => {
        const activa = s.href === actual;
        return (
          <Link
            key={s.href}
            href={s.href}
            aria-current={activa ? "page" : undefined}
            className={
              activa
                ? "px-4 py-2 rounded-full text-sm font-semibold bg-brand-600 text-white"
                : "px-4 py-2 rounded-full text-sm font-medium bg-white border border-cream-dark text-ink-muted hover:text-brand-600 hover:border-brand-600 transition-colors"
            }
          >
            {s.label}
          </Link>
        );
      })}
    </nav>
  );
}
