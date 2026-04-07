"use client";

import { useState } from "react";
import Image from "next/image";

interface Props {
  mainImage: string | null;
  images: { id: string; image_url: string }[];
  alt: string;
}

export default function ImageGallery({ mainImage, images, alt }: Props) {
  const allImages = [
    ...(mainImage ? [{ id: "main", image_url: mainImage }] : []),
    ...images,
  ];

  const [activeIdx, setActiveIdx] = useState(0);

  if (allImages.length === 0) {
    return (
      <div className="w-full aspect-[3/4] max-w-[280px] bg-gradient-to-br from-brand-100 to-brand-50 rounded-lg flex flex-col items-center justify-center gap-3">
        <svg className="w-12 h-12 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.331 0 4.473.89 6.074 2.356M12 6.042a8.968 8.968 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.356M12 6.042V20.356" />
        </svg>
        <span className="text-sm text-brand-500 font-medium">Sin portada</span>
      </div>
    );
  }

  const current = allImages[activeIdx];

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Main image */}
      <div className="relative w-full max-w-[280px] aspect-[3/4]">
        <Image
          src={current.image_url}
          alt={`${alt} - foto ${activeIdx + 1}`}
          fill
          className="object-cover rounded-lg shadow-md"
          sizes="280px"
        />

        {/* Navigation arrows */}
        {allImages.length > 1 && (
          <>
            <button
              type="button"
              aria-label="Foto anterior"
              onClick={() => setActiveIdx((i) => (i > 0 ? i - 1 : allImages.length - 1))}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 backdrop-blur rounded-full flex items-center justify-center shadow hover:bg-white transition-colors"
            >
              <svg className="w-4 h-4 text-ink" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
            <button
              type="button"
              aria-label="Foto siguiente"
              onClick={() => setActiveIdx((i) => (i < allImages.length - 1 ? i + 1 : 0))}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 backdrop-blur rounded-full flex items-center justify-center shadow hover:bg-white transition-colors"
            >
              <svg className="w-4 h-4 text-ink" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>

            {/* Counter */}
            <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full">
              {activeIdx + 1}/{allImages.length}
            </div>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {allImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto max-w-[280px] pb-1">
          {allImages.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setActiveIdx(i)}
              className={`relative flex-shrink-0 w-12 h-16 rounded overflow-hidden border-2 transition-colors ${
                i === activeIdx ? "border-brand-500" : "border-transparent opacity-60 hover:opacity-100"
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
