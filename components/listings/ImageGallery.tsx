"use client";

import { useState } from "react";
import Image from "next/image";
import { COVER_GRADIENTS, LIGHT_COVERS, coverVariant } from "./BookCover";

interface Props {
  mainImage: string | null;
  images: { id: string; image_url: string }[];
  alt: string;
  author?: string;
}

/* La cubierta sin foto vive en BookCover: era la misma tabla de diez
   degradados copiada literal en los dos archivos. */

const SPINE = "absolute inset-y-0 left-0 w-2.5 z-[2] bg-gradient-to-r from-black/30 via-white/10 to-black/10";

export default function ImageGallery({ mainImage, images, alt, author }: Props) {
  const allImages = [
    ...(mainImage && mainImage.trim() ? [{ id: "main", image_url: mainImage }] : []),
    ...images.filter((img) => img.image_url && img.image_url.trim()),
  ];

  const [activeIdx, setActiveIdx] = useState(0);
  const [errorIds, setErrorIds] = useState<Set<string>>(new Set());

  const visibleImages = allImages.filter((img) => !errorIds.has(img.id));

  /* ---------- Sin foto → cubierta dibujada sobre stage de papel ---------- */
  if (visibleImages.length === 0) {
    const variant = coverVariant(alt || "tuslibros");
    const light = LIGHT_COVERS.has(variant);
    return (
      <div className="relative w-[300px] max-w-full bg-gradient-to-b from-[#f1ebde] to-[#e7ddca] border border-line rounded-2xl p-9 pb-7">
        <div className="pointer-events-none absolute inset-x-[14%] bottom-6 h-6 rounded-[50%] bg-black/20 blur-md" />
        <div
          className="relative mx-auto w-[70%] aspect-[148/225] rounded-[2px_5px_5px_2px] shadow-book overflow-hidden -rotate-[1.5deg] flex flex-col justify-between p-4"
          style={{ background: COVER_GRADIENTS[variant] }}
        >
          <span aria-hidden className={SPINE} />
          <span className={`relative font-mono text-[9px] uppercase tracking-[0.16em] font-semibold ${light ? "text-black/55" : "text-white/70"}`}>tuslibros.cl</span>
          <div className="relative">
            <span className={`block w-8 h-px mb-2.5 ${light ? "bg-ink/40" : "bg-white/55"}`} />
            <h3 className={`font-display text-[16px] leading-[1.1] font-medium line-clamp-5 ${light ? "text-ink italic" : "text-white"}`}>{alt}</h3>
            {author && (
              <p className={`font-mono text-[9px] uppercase tracking-wider mt-2 ${light ? "text-ink/60" : "text-white/75"}`}>{author}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  const safeIdx = activeIdx < visibleImages.length ? activeIdx : 0;
  const current = visibleImages[safeIdx];

  const baseAlt = `${alt}${author ? ` — ${author}` : ""}, libro usado`;
  const imgAlt = (i: number) =>
    visibleImages.length > 1 ? `${baseAlt} (foto ${i + 1} de ${visibleImages.length})` : baseAlt;

  /* ---------- Con foto → libro-objeto sobre stage de papel ---------- */
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-[300px] max-w-full bg-gradient-to-b from-[#f1ebde] to-[#e7ddca] border border-line rounded-2xl p-9 pb-7">
        <div className="pointer-events-none absolute inset-x-[14%] bottom-6 h-6 rounded-[50%] bg-black/20 blur-md" />

        {/* el libro */}
        <div className="relative mx-auto w-[70%] aspect-[148/225] rounded-[2px_5px_5px_2px] shadow-book overflow-hidden -rotate-[1.5deg]">
          <Image
            key={current.id}
            src={current.image_url}
            alt={imgAlt(safeIdx)}
            fill
            className="object-cover"
            sizes="220px"
            // La portada es el LCP de la ficha. Sin `priority` next/image le
            // pone loading="lazy" y Lighthouse la medía en 6,8 s (4 sept 2026).
            priority={safeIdx === 0}
            onError={() => {
              setErrorIds((prev) => new Set(prev).add(current.id));
              setActiveIdx(0);
            }}
          />
          <span aria-hidden className={SPINE} />
        </div>

        {/* flechas + contador sobre el stage (sin rotar) */}
        {visibleImages.length > 1 && (
          <>
            <button
              type="button"
              aria-label="Foto anterior"
              onClick={() => setActiveIdx((i) => (i > 0 ? i - 1 : visibleImages.length - 1))}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-card hover:bg-white transition-colors"
            >
              <svg className="w-4 h-4 text-ink" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
            <button
              type="button"
              aria-label="Foto siguiente"
              onClick={() => setActiveIdx((i) => (i < visibleImages.length - 1 ? i + 1 : 0))}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-card hover:bg-white transition-colors"
            >
              <svg className="w-4 h-4 text-ink" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
            <div className="absolute bottom-3 right-3 z-10 bg-ink/80 text-white text-[10px] font-mono px-2 py-0.5 rounded-full">
              {safeIdx + 1}/{visibleImages.length}
            </div>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {visibleImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto max-w-[300px] pb-1">
          {visibleImages.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setActiveIdx(i)}
              className={`relative flex-shrink-0 w-12 aspect-[148/225] rounded overflow-hidden border-2 shadow-sm transition-colors ${
                i === safeIdx ? "border-ink" : "border-transparent opacity-60 hover:opacity-100"
              }`}
            >
              <Image src={img.image_url} alt={`${baseAlt} — miniatura ${i + 1}`} fill className="object-cover" sizes="48px" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
