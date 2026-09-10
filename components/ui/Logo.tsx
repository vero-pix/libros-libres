"use client";

import Link from "next/link";
import Image from "next/image";
import Chupalla from "./Chupalla";

interface LogoProps {
  className?: string;
  withTagline?: boolean;
  /** Le pone la chupalla al isotipo en la semana del 18. Lo decide el servidor. */
  festivo?: boolean;
}

export default function Logo({ className = "", withTagline = false, festivo = false }: LogoProps) {
  return (
    <Link href="/" className={`flex items-center gap-2.5 group ${className}`}>
      {/* Isotipo compacto */}
      <div className="relative w-9 h-9 sm:w-10 sm:h-10 flex-shrink-0">
        <Image
          src="/logo-books.png"
          alt="tuslibros.cl logo"
          fill
          className="object-contain group-hover:scale-105 transition-transform duration-300"
          priority
        />
        {festivo && (
          <Chupalla id="chupalla-logo" className="chupalla-float absolute -top-1.5 left-0 w-7 h-auto pointer-events-none drop-shadow-sm" />
        )}
      </div>

      {/* Logotipo */}
      <div className="flex flex-col leading-none">
        <div className="flex items-baseline">
          <span className="font-display text-[22px] sm:text-[25px] font-medium text-ink tracking-[-0.02em]">
            tuslibros
          </span>
          <span className="font-display text-[22px] sm:text-[25px] font-medium italic text-coral">.cl</span>
        </div>
        {withTagline && (
          <span className="font-mono text-[8.5px] uppercase tracking-[0.18em] text-ink-muted mt-1">
            Los que ya leíste, los que te faltan
          </span>
        )}
      </div>
    </Link>
  );
}
