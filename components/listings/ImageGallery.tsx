"use client";

import { useEffect, useState } from "react";
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
  // Se deduplica por URL: la portada casi siempre es TAMBIÉN la primera de
  // `listing_images` —así la deja el formulario de publicar—, y sin esto la
  // ficha mostraba "1/2" con la misma foto dos veces y una flecha que no
  // llevaba a ninguna parte. Eran 25 fichas activas. (13-09-2026)
  const vistas = new Set<string>();
  const allImages = [
    ...(mainImage && mainImage.trim() ? [{ id: "main", image_url: mainImage }] : []),
    ...images.filter((img) => img.image_url && img.image_url.trim()),
  ].filter((img) => {
    const url = img.image_url.trim();
    if (vistas.has(url)) return false;
    vistas.add(url);
    return true;
  });

  const [activeIdx, setActiveIdx] = useState(0);
  const [errorIds, setErrorIds] = useState<Set<string>>(new Set());
  // Foto a pantalla completa (25-09-2026). En la ficha la foto va recortada
  // dentro del "libro" dibujado y no se podía ampliar: justo lo que quiere ver
  // quien compra un antiguo (manchas, lomo, páginas de adentro).
  const [grande, setGrande] = useState(false);
  const [ampliada, setAmpliada] = useState<{ x: number; y: number } | null>(null);

  const visibleImages = allImages.filter((img) => !errorIds.has(img.id));

  // Con la foto grande abierta: Esc cierra, las flechas cambian de foto y la
  // página de atrás no se mueve.
  useEffect(() => {
    if (!grande) return;
    const n = visibleImages.length;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setGrande(false); setAmpliada(null); }
      if (e.key === "ArrowLeft" && n > 1) { setAmpliada(null); setActiveIdx((i) => (i > 0 ? i - 1 : n - 1)); }
      if (e.key === "ArrowRight" && n > 1) { setAmpliada(null); setActiveIdx((i) => (i < n - 1 ? i + 1 : 0)); }
    };
    const overflowAntes = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = overflowAntes; };
  }, [grande, visibleImages.length]);

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
  const total = visibleImages.length;
  const anterior = () => { setAmpliada(null); setActiveIdx((i) => (i > 0 ? i - 1 : total - 1)); };
  const siguiente = () => { setAmpliada(null); setActiveIdx((i) => (i < total - 1 ? i + 1 : 0)); };
  const cerrar = () => { setGrande(false); setAmpliada(null); };

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
          <button
            type="button"
            onClick={() => setGrande(true)}
            aria-label="Ver la foto en grande"
            className="absolute inset-0 z-[3] cursor-zoom-in"
          />
        </div>

        <button
          type="button"
          onClick={() => setGrande(true)}
          aria-label="Ver la foto en grande"
          className="absolute top-3 right-3 z-10 w-8 h-8 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-card hover:bg-white hover:scale-110 transition-all"
        >
          <svg className="w-4 h-4 text-ink" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2} aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M10.5 7.5v6m-3-3h6M18 10.5a7.5 7.5 0 11-15 0 7.5 7.5 0 0115 0z" />
          </svg>
        </button>

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

      {grande && current && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={imgAlt(safeIdx)}
          className="fixed inset-0 z-[100] bg-[#0b1433]/[0.98] flex items-center justify-center animate-fade-in"
          onClick={cerrar}
        >
          <div
            className="relative w-full h-full max-w-5xl mx-auto overflow-hidden"
            onClick={(e) => {
              e.stopPropagation();
              // Escritorio: un clic amplía al doble donde apuntaste; otro vuelve.
              // En el celular sirve el zoom con los dedos del navegador.
              if (ampliada) { setAmpliada(null); return; }
              const r = e.currentTarget.getBoundingClientRect();
              setAmpliada({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
            }}
          >
            <Image
              key={`grande-${current.id}`}
              src={current.image_url}
              alt={imgAlt(safeIdx)}
              fill
              sizes="100vw"
              quality={90}
              className={`object-contain transition-transform duration-300 ${ampliada ? "cursor-zoom-out" : "cursor-zoom-in"}`}
              style={ampliada ? { transform: "scale(2)", transformOrigin: `${ampliada.x}% ${ampliada.y}%` } : undefined}
            />
          </div>

          <button
            type="button"
            onClick={cerrar}
            aria-label="Cerrar"
            className="absolute top-4 right-4 w-11 h-11 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {total > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); anterior(); }}
                aria-label="Foto anterior"
                className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); siguiente(); }}
                aria-label="Foto siguiente"
                className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </button>
              <div className="absolute bottom-5 left-1/2 -translate-x-1/2 bg-white/15 text-white text-xs font-mono px-3 py-1 rounded-full">
                {safeIdx + 1}/{total}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
