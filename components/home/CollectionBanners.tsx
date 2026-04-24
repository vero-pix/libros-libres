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
    title: "Filosofía",
    subtitle: "Jaeger, Séneca, Plutarco, Urban",
    href: "/?genre=Filosof%C3%ADa",
    gradient: "from-slate-800 to-slate-600",
    icon: "🏛️",
  },
  {
    title: "Novela Negra",
    subtitle: "Montalbán, Ellroy, Black",
    href: "/?genre=Novela+Negra",
    gradient: "from-gray-900 to-gray-700",
    icon: "🔍",
  },
  {
    title: "Menos de $5.000",
    subtitle: "Lectura accesible",
    href: "/?price_max=5000",
    gradient: "from-amber-600 to-amber-500",
    icon: "💰",
  },
  {
    title: "Arrienda un libro",
    subtitle: "Léelo y devuélvelo",
    href: "/?modality=loan",
    gradient: "from-brand-700 to-brand-500",
    icon: "📖",
  },
  {
    title: "Ficción Literaria",
    subtitle: "Borges, Kundera, Musil",
    href: "/?genre=Ficcion+Literaria",
    gradient: "from-indigo-800 to-indigo-600",
    icon: "✨",
  },
  {
    title: "Ensayo e Historia",
    subtitle: "Hobsbawm, Krauze, Koestler",
    href: "/?genre=Ensayo",
    gradient: "from-stone-700 to-stone-500",
    icon: "📜",
  },
  {
    title: "Piezas de colección",
    subtitle: "Ediciones raras y antiguas",
    href: "/?price_min=15000",
    gradient: "from-yellow-700 to-amber-500",
    icon: "👑",
  },
];

export default function CollectionBanners() {
  return (
    <section className="py-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-lg font-bold text-ink">Colecciones</h2>
        <span className="text-xs text-ink-muted">Desliza →</span>
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
