"use client";

import { useState } from "react";
import Image from "next/image";

interface Props {
  mainImage: string | null;
  images: { id: string; image_url: string }[];
  alt: string;
  author?: string;
}

export default function ImageGallery({ mainImage, images, alt, author }: Props) {
  // Filter out empty/invalid URLs
  const allImages = [
    ...(mainImage && mainImage.trim() ? [{ id: "main", image_url: mainImage }] : []),
    ...images.filter((img) => img.image_url && img.image_url.trim()),
  ];

  const [activeIdx, setActiveIdx] = useState(0);
  const [errorIds, setErrorIds] = useState<Set<string>>(new Set());

  const visibleImages = allImages.filter((img) => !errorIds.has(img.id));

  if (visibleImages.length === 0) {
    // Parse title and author from alt (format: "Title")
    const title = alt;
    return (
      <div className="w-full aspect-[3/4] max-w-[280px] bg-gradient-to-br from-amber-50 via-cream to-brand-50 rounded-lg flex flex-col items-center justify-center p-6 border border-brand-100 relative overflow-hidden">
        {/* Decorative top bar */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-brand-500 via-amber-500 to-brand-600" />
        {/* Decorative lines */}
        <div className="absolute top-8 left-6 right-6 border-t border-brand-200/50" />
        <div className="absolute bottom-8 left-6 right-6 border-t border-brand-200/50" />
        {/* Book icon */}
        <svg className="w-8 h-8 text-brand-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.331 0 4.473.89 6.074 2.356M12 6.042a8.968 8.968 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.356M12 6.042V20.356" />
        </svg>
        {/* Title & Author */}
        <h3 className="font-display text-base font-bold text-ink text-center leading-tight line-clamp-4">
          {title}
        </h3>
        {author && (
          <p className="text-xs text-ink-muted mt-2 text-center italic">{author}</p>
        )}
        {/* Brand watermark */}
        <span className="absolute bottom-3 text-[9px] tracking-widest uppercase text-brand-300 font-medium">
          tuslibros.cl
        </span>
      </div>
    );
  }

  const safeIdx = activeIdx < visibleImages.length ? activeIdx : 0;
  const current = visibleImages[safeIdx];

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Main image */}
      <div className="relative w-full max-w-[280px] aspect-[3/4]">
        <Image
          key={current.id}
          src={current.image_url}
          alt={`${alt} - foto ${safeIdx + 1}`}
          fill
          className="object-cover rounded-lg shadow-md"
          sizes="280px"
          onError={() => {
            setErrorIds((prev) => new Set(prev).add(current.id));
            setActiveIdx(0);
          }}
        />

        {/* Navigation arrows */}
        {visibleImages.length > 1 && (
          <>
            <button
              type="button"
              aria-label="Foto anterior"
              onClick={() => setActiveIdx((i) => (i > 0 ? i - 1 : visibleImages.length - 1))}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 backdrop-blur rounded-full flex items-center justify-center shadow hover:bg-white transition-colors"
            >
              <svg className="w-4 h-4 text-ink" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
            <button
              type="button"
              aria-label="Foto siguiente"
              onClick={() => setActiveIdx((i) => (i < visibleImages.length - 1 ? i + 1 : 0))}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 backdrop-blur rounded-full flex items-center justify-center shadow hover:bg-white transition-colors"
            >
              <svg className="w-4 h-4 text-ink" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>

            {/* Counter */}
            <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full">
              {safeIdx + 1}/{visibleImages.length}
            </div>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {visibleImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto max-w-[280px] pb-1">
          {visibleImages.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setActiveIdx(i)}
              className={`relative flex-shrink-0 w-12 h-16 rounded overflow-hidden border-2 transition-colors ${
                i === safeIdx ? "border-brand-500" : "border-transparent opacity-60 hover:opacity-100"
              }`}
            >
              <Image src={img.image_url} alt={`${alt} - miniatura ${i + 1}`} fill className="object-cover" sizes="48px" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
