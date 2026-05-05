"use client";

import Link from "next/link";
import Image from "next/image";

interface LogoProps {
  className?: string;
  withTagline?: boolean;
}

export default function Logo({ className = "", withTagline = false }: LogoProps) {
  return (
    <Link href="/" className={`flex items-center gap-3.5 group ${className}`}>
      {/* Isotipo: Los libritos con más presencia */}
      <div className="relative w-16 h-16 sm:w-24 sm:h-24 flex-shrink-0">
        <Image
          src="/logo-books.png"
          alt="tuslibros.cl logo"
          fill
          className="object-contain group-hover:scale-105 transition-transform duration-300"
          priority
        />
      </div>

      {/* Logotipo: Texto */}
      <div className="flex flex-col">
        <div className="flex items-baseline">
          <span className="font-display text-4xl font-bold text-ink tracking-tight">
            tuslibros
          </span>
          <span className="font-display text-4xl font-bold text-brand-500">.cl</span>
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
