"use client";

import Link from "next/link";
import Image from "next/image";

interface LogoProps {
  className?: string;
  withTagline?: boolean;
}

export default function Logo({ className = "", withTagline = false }: LogoProps) {
  return (
    <Link href="/" className={`flex items-center gap-2.5 group ${className}`}>
      {/* Isotipo: Los libritos que te gustaron */}
      <div className="relative w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0 overflow-hidden">
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
