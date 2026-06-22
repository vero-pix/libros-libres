"use client";

import Image from "next/image";
import Link from "next/link";
import { memo, useState, useCallback, useTransition } from "react";
import dynamic from "next/dynamic";
import type { ListingWithBook } from "@/types";
import { libroUrl } from "@/lib/urls";

const QuickViewModal = dynamic(() => import("./QuickViewModal"), {
  ssr: false,
});

/* ----------------------------------------------------------------
   Helpers
---------------------------------------------------------------- */

const BLUR_PLACEHOLDER =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjI2NyIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjVmMGU4Ii8+PC9zdmc+";

/* Paletas de cubierta para el objeto-libro SIN foto (fallback con identidad). */
const COVER_GRADIENTS: Record<string, string> = {
  ink: "linear-gradient(160deg,#23489f,#16307a)",
  coral: "linear-gradient(160deg,#df5239,#a8331f)",
  gold: "linear-gradient(160deg,#e0990c,#9e6a00)",
  green: "linear-gradient(160deg,#33684f,#1b3d2e)",
  ox: "linear-gradient(160deg,#8a3131,#5e1d1d)",
  night: "linear-gradient(160deg,#1c2333,#0c1018)",
  cream: "linear-gradient(160deg,#f3ead7,#ddcfb2)",
  teal: "linear-gradient(160deg,#1f5f63,#0f3a3d)",
  sand: "linear-gradient(160deg,#cda86a,#9c7a3e)",
  plum: "linear-gradient(160deg,#5b3a72,#3a2350)",
};
const COVER_KEYS = Object.keys(COVER_GRADIENTS);
const LIGHT_COVERS = new Set(["cream", "sand", "gold"]);

/* Variante estable por título → mismo libro, mismo color siempre. */
function coverVariant(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return COVER_KEYS[h % COVER_KEYS.length];
}

function isRecent(createdAt: string) {
  const diff = Date.now() - new Date(createdAt).getTime();
  return diff < 7 * 24 * 60 * 60 * 1000;
}

function hasDiscount(listing: ListingWithBook) {
  const orig = (listing as unknown as Record<string, unknown>).original_price;
  return orig != null && Number(orig) > (listing.price ?? 0);
}

function formatCLP(value: number) {
  return `$${value.toLocaleString("es-CL")}`;
}

function formatDistance(km: number | null | undefined): string | null {
  if (km == null || Number.isNaN(km)) return null;
  if (km < 1) return `${Math.round(km * 1000)} m`;
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
}

/* ----------------------------------------------------------------
   Pick ONE badge — strict priority, nunca apilados
---------------------------------------------------------------- */

type Badge = { label: string; className: string };

function pickPrimaryBadge(listing: ListingWithBook): Badge | null {
  if (listing.status === "completed") return null;

  // 1. Featured
  if (listing._featured) {
    return { label: "Destacado", className: "bg-gold text-[#3a2700]" };
  }

  // 2. Oferta (descuento activo)
  if (hasDiscount(listing)) {
    const orig = Number((listing as unknown as Record<string, unknown>).original_price);
    const price = listing.price ?? 0;
    const off = orig > 0 ? Math.round(((orig - price) / orig) * 100) : 0;
    return {
      label: off > 0 ? `-${off}%` : "Oferta",
      className: "bg-coral text-white",
    };
  }

  // 3. Recién publicado
  if (isRecent(listing.created_at)) {
    return { label: "Nuevo aquí", className: "bg-ink text-white" };
  }

  // 4. Coleccionable
  if ((listing as unknown as Record<string, unknown>).is_collectible) {
    return { label: "Colección", className: "bg-green text-white" };
  }

  return null;
}

/* ----------------------------------------------------------------
   Component
---------------------------------------------------------------- */

interface Props {
  listing: ListingWithBook;
  showDistance?: boolean;
}

const ListingCard = memo(function ListingCard({
  listing,
  showDistance = true,
}: Props) {
  const [showQuickView, setShowQuickView] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [cartState, setCartState] = useState<"idle" | "loading" | "added">("idle");
  const [, startTransition] = useTransition();
  const { book } = listing;

  const handleAddToCart = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (cartState !== "idle") return;
      setCartState("loading");
      try {
        const res = await fetch("/api/cart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ listing_id: listing.id }),
        });
        if (res.ok) {
          setCartState("added");
          window.dispatchEvent(new CustomEvent("cart-updated"));
          setTimeout(() => setCartState("idle"), 1800);
        } else {
          const data = await res.json().catch(() => ({}));
          if (data.error?.includes("No autenticado")) {
            window.location.href = `/login?next=/`;
            return;
          }
          setCartState("idle");
        }
      } catch {
        setCartState("idle");
      }
    },
    [cartState, listing.id]
  );

  /* ---------- Datos derivados ---------- */

  const coverUrl = listing.cover_image_url ?? book.cover_url;
  const sellerName = listing.seller?.full_name?.split(" ")[0] ?? "Vendedor";
  const sellerHref = `/vendedor/${listing.seller?.username ?? listing.seller_id}`;

  const distanceKm = (listing as unknown as Record<string, unknown>).distance_km as number | undefined;
  const distanceLabel = showDistance ? formatDistance(distanceKm) : null;

  const originalPrice = (listing as unknown as Record<string, unknown>).original_price as number | undefined;

  // Extraer comuna del address: "Calle 123, Providencia, Región..." → "Providencia"
  const address = (listing as unknown as Record<string, unknown>).address as string | undefined;
  const displayLocation = address ? address.split(",")[1]?.trim() || null : null;

  const badge = pickPrimaryBadge(listing);

  /* ---------- Objeto-libro: cubierta dibujada (fallback sin foto) ---------- */

  const variant = coverVariant(book.title || String(listing.id));
  const light = LIGHT_COVERS.has(variant);
  const drawnCover = (
    <div
      className="w-full h-full flex flex-col justify-between p-3"
      style={{ background: COVER_GRADIENTS[variant] }}
    >
      <span className={`font-mono text-[8px] uppercase tracking-[0.16em] font-semibold ${light ? "text-black/55" : "text-white/70"}`}>
        tuslibros
      </span>
      <div>
        <span className={`block w-7 h-px mb-2 ${light ? "bg-black/40" : "bg-white/55"}`} />
        <h4 className={`font-display ${light ? "text-ink" : "text-white"} text-[13px] leading-[1.08] font-medium ${light ? "italic" : ""}`}>
          {book.title}
        </h4>
        {book.author && (
          <div className={`font-mono text-[8px] uppercase tracking-wider mt-1.5 ${light ? "text-ink/60" : "text-white/75"}`}>
            {book.author.split(" ").slice(-1)[0]}
          </div>
        )}
      </div>
    </div>
  );

  /* ---------- Render ---------- */

  return (
    <>
      <article className="group relative bg-paper-card rounded-[3px] border border-line overflow-hidden transition-all duration-200 hover:shadow-card hover:-translate-y-0.5 hover:border-line-strong">
        <Link
          href={libroUrl(listing)}
          className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-coral/60 focus-visible:ring-offset-2 focus-visible:ring-offset-cream rounded-[3px]"
        >
          {/* PORTADA = OBJETO-LIBRO sobre fondo papel */}
          <div className="relative px-5 pt-5 pb-3.5 bg-gradient-to-b from-[#f6f0e4] to-[#efe7d6] flex justify-center overflow-hidden">
            {/* el libro */}
            <div className="relative w-[64%] aspect-[148/225] rounded-[2px_4px_4px_2px] shadow-book overflow-hidden transition-transform duration-300 group-hover:-translate-y-1">
              {coverUrl && !imgError ? (
                <Image
                  src={coverUrl}
                  alt={book.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 32vw, (max-width: 1024px) 22vw, 13vw"
                  placeholder="blur"
                  blurDataURL={BLUR_PLACEHOLDER}
                  onError={() => setImgError(true)}
                  onLoad={(e) => {
                    const img = e.currentTarget as HTMLImageElement;
                    if (img.naturalWidth < 10 || img.naturalHeight < 10) setImgError(true);
                  }}
                />
              ) : (
                drawnCover
              )}
              {/* lomo */}
              <span
                aria-hidden
                className="absolute inset-y-0 left-0 w-2 z-[2] bg-gradient-to-r from-black/30 via-white/10 to-black/10"
              />
            </div>

            {/* VENDIDO overlay */}
            {listing.status === "completed" && (
              <div className="absolute inset-0 z-[3] bg-black/40 flex items-center justify-center">
                <span className="text-white font-bold text-sm uppercase tracking-wider bg-coral px-4 py-1.5 rounded-full shadow-lg">
                  Vendido
                </span>
              </div>
            )}

            {/* MODO VACACIONES overlay */}
            {listing.status !== "completed" && (listing.seller as any)?.on_vacation && (
              <div className="absolute inset-0 z-[3] bg-amber-900/25 flex items-center justify-center">
                <span className="text-white font-bold text-[11px] uppercase tracking-wider bg-amber-600 px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5">
                  🌴 En vacaciones
                </span>
              </div>
            )}

            {/* 1 BADGE primario, top-left */}
            {badge && (
              <span className={`absolute top-3 left-3 z-[4] inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm ${badge.className}`}>
                {badge.label}
              </span>
            )}

            {/* DISTANCIA — visible si disponible (diferenciador del producto) */}
            {distanceLabel && listing.status !== "completed" && (
              <span className="absolute bottom-3 left-3 z-[4] inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/95 text-ink shadow-sm backdrop-blur-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-coral" />
                A {distanceLabel}
              </span>
            )}

            {/* QUICK VIEW + ADD TO CART — visible siempre en mobile, hover en desktop */}
            {listing.status !== "completed" && !(listing.seller as any)?.on_vacation && (
              <div className="absolute bottom-3 right-3 z-[4] flex gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    startTransition(() => setShowQuickView(true));
                  }}
                  className="w-9 h-9 flex items-center justify-center rounded-full bg-white shadow-md text-ink-muted hover:text-ink transition-colors"
                  title="Vista rápida"
                  aria-label="Vista rápida"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleAddToCart(e);
                  }}
                  disabled={cartState === "loading"}
                  className={`w-9 h-9 flex items-center justify-center rounded-full shadow-md text-white transition-colors ${
                    cartState === "added" ? "bg-green" : "bg-coral hover:bg-coral-deep"
                  } disabled:opacity-70`}
                  title={cartState === "added" ? "Agregado al carrito" : "Agregar al carrito"}
                  aria-label={cartState === "added" ? "Agregado al carrito" : "Agregar al carrito"}
                >
                  {cartState === "added" ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                    </svg>
                  )}
                </button>
              </div>
            )}
          </div>
        </Link>

        {/* CUERPO */}
        <div className="p-4">
          <Link href={libroUrl(listing)} className="block">
            <h3 className="font-display text-[16px] leading-[1.14] font-medium text-ink line-clamp-2 tracking-[-0.01em] group-hover:text-coral transition-colors">
              {book.title}
            </h3>
          </Link>

          {book.author && (
            <Link
              href={`/search?author=${encodeURIComponent(book.author)}`}
              className="block font-display italic text-[13px] text-ink-muted hover:text-ink mt-0.5 truncate transition-colors"
              aria-label={`Buscar libros de ${book.author}`}
            >
              {book.author}
            </Link>
          )}

          {/* PRECIO */}
          {listing.price != null && (
            <div className="mt-3 flex items-baseline gap-2 flex-wrap">
              <span className="font-mono text-[16px] font-semibold text-black tabular-nums">
                {formatCLP(listing.price)}
              </span>
              {originalPrice != null && originalPrice > listing.price && (
                <span className="font-mono text-[11px] text-ink-muted line-through tabular-nums">
                  {formatCLP(originalPrice)}
                </span>
              )}
            </div>
          )}

          {/* META FOOTER — vendedor + ciudad */}
          <div className="mt-3 pt-3 border-t border-line flex items-center justify-between gap-2">
            <Link
              href={sellerHref}
              className="flex items-center gap-1.5 min-w-0 text-[12px] text-ink-muted hover:text-ink transition-colors"
            >
              {listing.seller?.avatar_url ? (
                <Image
                  src={listing.seller.avatar_url}
                  alt=""
                  width={20}
                  height={20}
                  className="rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <span className="w-5 h-5 rounded-full bg-ink text-white flex items-center justify-center text-[9px] font-bold flex-shrink-0 font-mono">
                  {sellerName[0]?.toUpperCase() ?? "?"}
                </span>
              )}
              <span className="font-medium truncate">{sellerName}</span>
            </Link>
            {displayLocation && (
              <span className="font-mono text-[10px] uppercase tracking-wide text-ink-muted truncate">
                {displayLocation}
              </span>
            )}
          </div>

          {/* RATING — solo si hay reviews */}
          {(listing._review_count ?? 0) > 0 && (
            <div className="mt-2 flex items-center gap-1">
              <div className="flex" aria-hidden>
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg
                    key={star}
                    className={`w-3 h-3 ${star <= Math.round(listing._avg_rating ?? 0) ? "text-brand-500" : "text-cream-dark"}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="text-[10px] text-ink-muted font-mono">
                {(listing._avg_rating ?? 0).toFixed(1)} · {listing._review_count}
              </span>
            </div>
          )}
        </div>
      </article>

      {showQuickView && (
        <QuickViewModal listing={listing} onClose={() => setShowQuickView(false)} />
      )}
    </>
  );
});

export default ListingCard;
