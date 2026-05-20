"use client";

import Link from "next/link";

interface Banner {
  title: string;
  subtitle: string;
  href: string;
  gradient: string;
  icon: string;
}

const BANNERS: Banner[] = [
  {
    title: "Libros Escolares",
    subtitle: "Básica, Media y textos de estudio",
    href: "/search?subcategory=academico-escolar",
    gradient: "from-[#1a2b4b] to-[#2e4a8a]",
    icon: "🎒",
  },
  {
    title: "Lectura Complementaria",
    subtitle: "Listas MINEDUC e infantil",
    href: "/search?subcategory=infantil-juvenil-infantil",
    gradient: "from-[#2d5a4c] to-[#4a8a6a]",
    icon: "📚",
  },
  {
    title: "Poesía y Teatro",
    subtitle: "Clásicos y contemporáneos",
    href: "/search?subcategory=ficcion-poesia",
    gradient: "from-[#6b2d5a] to-[#8a4a7a]",
    icon: "🖋️",
  },
  {
    title: "Novela Policial",
    subtitle: "Suspenso, Thriller y Crimen",
    href: "/search?subcategory=ficcion-policial",
    gradient: "from-[#151522] to-[#2d2d4a]",
    icon: "🔍",
  },
  {
    title: "Novela y Ficción",
    subtitle: "Borges, Kundera, Musil",
    href: "/search?subcategory=ficcion-novela",
    gradient: "from-[#4a5a8a] to-[#6a7a9a]",
    icon: "✨",
  },
  {
    title: "Historia y Ensayo",
    subtitle: "Política, memoria, ideas",
    href: "/search?subcategory=no-ficcion-historia",
    gradient: "from-amber-700 to-amber-600",
    icon: "🗺️",
  },
  {
    title: "Menos de $5.000",
    subtitle: "Libros buenos, precio honesto",
    href: "/search?price_max=5000",
    gradient: "from-green-800 to-green-700",
    icon: "💚",
  },
];

export default function CollectionBanners() {
  return (
    <section className="py-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-base font-semibold text-ink">Para cuando sabes lo que buscas</h2>
        <span className="text-[11px] font-mono text-ink-muted uppercase tracking-wider">Desliza →</span>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin snap-x snap-mandatory">
        {BANNERS.map((banner) => (
          <Link
            key={banner.title}
            href={banner.href}
            className={`snap-start flex-shrink-0 w-44 sm:w-52 rounded-xl bg-gradient-to-br ${banner.gradient} p-4 sm:p-5 text-white hover:scale-[1.03] transition-transform duration-200 shadow-md hover:shadow-lg group`}
          >
            <span className="text-2xl">{banner.icon}</span>
            <h3 className="font-display font-bold text-sm sm:text-base mt-2 leading-tight">
              {banner.title}
            </h3>
            <p className="text-[11px] text-white/70 mt-1 leading-snug">
              {banner.subtitle}
            </p>
            <span className="inline-block mt-3 text-[10px] font-semibold uppercase tracking-wider text-white/90 border border-white/30 rounded-full px-2.5 py-0.5 group-hover:bg-white/20 transition-colors">
              Ver más →
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
