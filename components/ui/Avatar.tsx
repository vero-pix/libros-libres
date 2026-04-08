"use client";

import Image from "next/image";
import { useState } from "react";

interface Props {
  src: string | null;
  alt: string;
  fallbackLetter: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizes = {
  sm: "w-8 h-8 text-xs",
  md: "w-16 h-16 sm:w-20 sm:h-20 text-2xl sm:text-3xl",
  lg: "w-24 h-24 text-4xl",
};

const pxSizes = { sm: 32, md: 80, lg: 96 };

export default function Avatar({ src, alt, fallbackLetter, size = "md", className = "" }: Props) {
  const [error, setError] = useState(false);

  if (!src || error) {
    return (
      <div className={`${sizes[size]} rounded-full bg-brand-100 text-brand-600 flex items-center justify-center font-bold flex-shrink-0 ${className}`}>
        {fallbackLetter.toUpperCase()}
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={pxSizes[size]}
      height={pxSizes[size]}
      className={`${sizes[size]} rounded-full object-cover border-2 border-cream-dark flex-shrink-0 ${className}`}
      onError={() => setError(true)}
    />
  );
}
