"use client";

import Link from "next/link";

interface LogoProps {
  className?: string;
  withTagline?: boolean;
}

export default function Logo({ className = "", withTagline = false }: LogoProps) {
  return (
    <Link href="/" className={`flex items-center gap-3 group ${className}`}>
      {/* Isotipo: Pila de Libros (SVG optimizado basado en el Brand Board) */}
      <div className="relative w-10 h-10 flex-shrink-0">
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-sm group-hover:scale-105 transition-transform duration-300"
        >
          {/* Libro Superior (Navy) */}
          <path
            d="M20 35L50 20L80 35L50 50L20 35Z"
            fill="#1F2A44"
            stroke="#1F2A44"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path d="M20 35V45L50 60V50L20 35Z" fill="#1F2A44" />
          <path d="M80 35V45L50 60V50L80 35Z" fill="#1F2A44" opacity="0.9" />

          {/* Libro Medio (Mostaza) */}
          <path
            d="M20 50L50 35L80 50L50 65L20 50Z"
            fill="#D69B12"
            stroke="#D69B12"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path d="M20 50V60L50 75V65L20 50Z" fill="#D69B12" />
          <path d="M80 50V60L50 75V65L80 50Z" fill="#D69B12" opacity="0.9" />

          {/* Libro Inferior (Verde Bosque) */}
          <path
            d="M20 65L50 50L80 65L50 80L20 65Z"
            fill="#3D6B5B"
            stroke="#3D6B5B"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path d="M20 65V75L50 90V80L20 65Z" fill="#3D6B5B" />
          <path d="M80 65V75L50 90V80L80 65Z" fill="#3D6B5B" opacity="0.9" />
        </svg>
      </div>

      {/* Logotipo: Texto */}
      <div className="flex flex-col">
        <div className="flex items-baseline">
          <span className="font-display text-2xl font-bold text-ink tracking-tight">
            tuslibros
          </span>
          <span className="font-display text-2xl font-bold text-brand-500">.cl</span>
        </div>
        {withTagline && (
          <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-ink-muted leading-none -mt-0.5">
            Los que ya leíste, los que te faltan
          </span>
        )}
      </div>
    </Link>
  );
}
