"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import type { ListingWithBook } from "@/types";
import { addRecentlyViewed } from "./RecentlyViewed";
import { createClient } from "@/lib/supabase/client";
import AddToCartButton from "@/components/ui/AddToCartButton";
import ImageGallery from "./ImageGallery";
import ShareButtons from "./ShareButtons";
import ContactSellerButton from "@/components/messages/ContactSellerButton";
import PriceCompare from "@/components/listings/PriceCompare";
import SellerOtherListings from "./SellerOtherListings";
import { libroUrl } from "@/lib/urls";
import { trackEvent } from "@/utils/analytics";
import { translateGenre } from "@/lib/genres";

function WhatsAppButton({
  phone,
  title,
  listingId,
  variant = "primary",
}: {
  phone: string | null;
  title: string;
  listingId: string;
  variant?: "primary" | "secondary";
}) {
  if (!phone) {
    if (variant === "secondary") return null;
    return (
      <p className="text-center text-sm text-gray-400 py-1">
        El vendedor no ha registrado un número de contacto.
      </p>
    );
  }

  // Solo dígitos para la URL de wa.me
  const cleanPhone = phone.replace(/\D/g, "");
  const message = encodeURIComponent(
    `Hola, vi tu libro "${title}" en tuslibros.cl y me interesa. ¿Está disponible?`
  );
  const waUrl = `https://wa.me/${cleanPhone}?text=${message}`;
  const track = () =>
    trackEvent("click_contact", { listing_id: listingId, book_title: title });

  // Secundario: link chico y discreto — "Comprar" manda, WhatsApp es solo para dudas.
  if (variant === "secondary") {
    return (
      <a
        href={waUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={track}
        className="flex items-center justify-center gap-1.5 w-full text-sm text-ink-muted hover:text-green-600 py-1.5 transition-colors"
      >
        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" xmlns="http://www.w3.org/2000/svg">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
        ¿Dudas? Escríbele al vendedor por WhatsApp
      </a>
    );
  }

  return (
    <a
      href={waUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={track}
      className="flex items-center justify-center gap-2 w-full border-2 border-green-500 text-green-600 hover:bg-green-50 font-semibold py-3 rounded-xl transition-colors"
    >
      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" xmlns="http://www.w3.org/2000/svg">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
      </svg>
      Contactar por WhatsApp
    </a>
  );
}

const MODALITY_LABELS = {
  sale: "Venta",
  loan: "Arriendo",
  both: "Venta y arriendo",
};

const CONDITION_LABELS: Record<string, string> = {
  new: "Como nuevo",
  good: "Buen estado",
  fair: "Estado regular",
  poor: "Con detalles",
};

interface ListingWithRentalFields extends ListingWithBook {
  rental_price?: number | null;
  rental_deposit?: number | null;
  rental_period_days?: number | null;
}

interface Props {
  listing: ListingWithBook;
  images?: { id: string; image_url: string }[];
}

export default function ListingDetail({ listing, images = [] }: Props) {
  const { book } = listing;
  const coverUrl = listing.cover_image_url ?? book.cover_url;
  const sellerName = listing.seller?.full_name?.split(" ")[0] ?? "Vendedor";
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => {
      if (data.user?.id === listing.seller_id) setIsOwner(true);
    });
  }, [listing.seller_id]);

  useEffect(() => {
    trackEvent("view_listing", {
      listing_id: listing.id,
      book_title: book.title,
      author: book.author,
    });

    addRecentlyViewed({
      id: listing.id,
      slug: listing.slug,
      title: book.title,
      cover_url: coverUrl,
      price: listing.price,
      genre: book.genre,
      author: book.author,
      seller_username: listing.seller?.username,
    });
  }, [listing.id, listing.slug, book.title, coverUrl, listing.price, book.genre, book.author, listing.seller?.username]);

  const isSold = listing.status === "completed";

  return (
    <div className="bg-paper-card rounded-2xl border border-line overflow-hidden relative pb-24 sm:pb-0">
      {isSold && (
        <div className="absolute top-4 right-4 z-10 bg-coral text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg uppercase tracking-wider">
          Vendido
        </div>
      )}
      {/* Cover + Info — mobile: imagen arriba centrada, desktop: lado a lado */}
      <div className={`flex flex-col sm:flex-row gap-6 sm:gap-8 p-5 sm:p-8 ${isSold ? "opacity-75" : ""}`}>
        {/* Cover / Gallery */}
        <div className="flex-shrink-0 flex justify-center sm:justify-start">
          <ImageGallery
            mainImage={coverUrl}
            images={images}
            alt={book.title}
            author={book.author}
          />
        </div>

        {/* Info */}
        <div className="flex-1">
          {/* Breadcrumb categoría */}
          {(book as any).category && (
            <div className="flex items-center gap-1.5 mb-3 text-[10px] font-mono uppercase tracking-widest text-ink-muted">
              <Link href={`/search?category=${(book as any).category}`} className="hover:text-brand-600 transition-colors">
                {translateGenre((book as any).category)}
              </Link>
              {(book as any).subcategory && (
                <>
                  <span>/</span>
                  <Link href={`/search?subcategory=${(book as any).subcategory}`} className="hover:text-brand-600 transition-colors">
                    {translateGenre((book as any).subcategory)}
                  </Link>
                </>
              )}
            </div>
          )}

          {/* Título + editar */}
          <div className="flex items-start justify-between gap-2">
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink leading-tight">{book.title}</h1>
            {isOwner && (
              <Link
                href={`/mis-libros?edit=${listing.id}`}
                className="flex-shrink-0 text-xs text-brand-600 hover:bg-brand-50 px-3 py-1.5 rounded-lg border border-brand-200 transition-colors"
              >
                Editar
              </Link>
            )}
          </div>
          <Link
            href={`/search?author=${encodeURIComponent(book.author)}`}
            className="block font-display italic text-sm text-ink-muted hover:text-brand-600 transition-colors mt-1"
          >
            {book.author}
            {(book as any).publisher && <span className="not-italic"> · {(book as any).publisher}</span>}
            {book.published_year && <span className="not-italic"> · {book.published_year}</span>}
          </Link>

          {/* Tags */}
          {((book as any).tags ?? []).length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {((book as any).tags as string[]).map((tag: string) => (
                <Link
                  key={tag}
                  href={`/?tag=${tag}`}
                  className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-cream-warm text-ink-muted hover:bg-brand-50 hover:text-brand-600 transition-colors"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          )}

          {/* Precio — grande, con descuento */}
          {listing.price != null && listing.modality !== "loan" && (() => {
            const originalPrice = (listing as unknown as Record<string, unknown>).original_price != null
              ? Number((listing as unknown as Record<string, unknown>).original_price)
              : null;
            const hasDiscount = originalPrice != null && originalPrice > listing.price;
            const discountPct = hasDiscount
              ? Math.round(((originalPrice - listing.price) / originalPrice) * 100)
              : 0;
            return (
              <div className="mt-5 flex items-baseline gap-3 flex-wrap">
                <span className="font-display text-3xl sm:text-4xl font-bold text-ink tabular-nums">
                  ${listing.price.toLocaleString("es-CL")}
                </span>
                {hasDiscount && (
                  <>
                    <span className="text-base text-ink-muted line-through tabular-nums">
                      ${originalPrice!.toLocaleString("es-CL")}
                    </span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[--coral]/10 text-[--coral]">
                      -{discountPct}%
                    </span>
                  </>
                )}
              </div>
            );
          })()}

          {/* Grid de metadata */}
          <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3">
            {listing.condition && (
              <div>
                <p className="text-[10px] font-mono uppercase tracking-wider text-ink-muted">Estado</p>
                <p className="text-sm font-medium text-ink mt-0.5">{CONDITION_LABELS[listing.condition] ?? listing.condition}</p>
              </div>
            )}
            {(book as any).binding && (
              <div>
                <p className="text-[10px] font-mono uppercase tracking-wider text-ink-muted">Encuadernación</p>
                <p className="text-sm font-medium text-ink mt-0.5">{(book as any).binding === "hardcover" ? "Tapa dura" : "Tapa blanda"}</p>
              </div>
            )}
            {(book as any).publisher && (
              <div>
                <p className="text-[10px] font-mono uppercase tracking-wider text-ink-muted">Editorial</p>
                <p className="text-sm font-medium text-ink mt-0.5">{(book as any).publisher}</p>
              </div>
            )}
            {(book as any).pages && (
              <div>
                <p className="text-[10px] font-mono uppercase tracking-wider text-ink-muted">Páginas</p>
                <p className="text-sm font-medium text-ink mt-0.5">{(book as any).pages}</p>
              </div>
            )}
            {book.published_year && (
              <div>
                <p className="text-[10px] font-mono uppercase tracking-wider text-ink-muted">Año</p>
                <p className="text-sm font-medium text-ink mt-0.5">{book.published_year}</p>
              </div>
            )}
            {book.isbn && (
              <div>
                <p className="text-[10px] font-mono uppercase tracking-wider text-ink-muted">ISBN</p>
                <p className="text-sm font-mono text-ink mt-0.5">{book.isbn}</p>
              </div>
            )}
          </div>

          {/* Nota del vendedor — styled como quote */}
          {listing.notes && (
            <blockquote className="mt-5 pl-4 border-l-2 border-brand-200">
              <p className="font-display italic text-sm text-ink-muted leading-relaxed">{listing.notes}</p>
              <footer className="text-[11px] font-mono text-ink-muted mt-1">— {sellerName}, dueño del libro</footer>
            </blockquote>
          )}

          {/* Opciones de entrega */}
          <div className="mt-5">
            <p className="text-[10px] font-mono uppercase tracking-wider text-ink-muted mb-2">Cómo lo recibes</p>
            <div className="space-y-2">
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-line bg-cream-warm/40">
                <span className="text-base">🤝</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink">Encuentro en persona</p>
                  <p className="text-[11px] text-ink-muted">Coordina lugar y hora con el vendedor</p>
                </div>
                <span className="text-xs font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded-full">Gratis</span>
              </div>
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-line">
                <span className="text-base">📦</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink">Despacho courier</p>
                  <p className="text-[11px] text-ink-muted">Starken · Chilexpress · 24-48h</p>
                </div>
                <span className="text-[11px] font-mono text-ink-muted">cotiza al comprar</span>
              </div>
            </div>
          </div>

          {/* Comparador de precios — solo para el dueño (referencia de precio).
              Al comprador NO se lo mostramos: mandaba a Buscalibre/MercadoLibre con
              target="_blank" encima del buybox → fuga directa a la competencia. */}
          {isOwner && (
            <PriceCompare
              title={book.title}
              author={book.author}
              isbn={book.isbn}
              currentPrice={listing.price}
              variant="seller"
              listingId={listing.id}
            />
          )}

          {/* Seller card */}
          <div className="mt-5 flex items-center gap-3 p-4 bg-paper-card rounded-xl border border-line">
            <div className="w-10 h-10 rounded-full bg-ink text-white flex items-center justify-center text-sm font-bold flex-shrink-0 overflow-hidden">
              {listing.seller?.avatar_url ? (
                <Image src={listing.seller.avatar_url} alt={sellerName} width={40} height={40} className="object-cover w-full h-full" />
              ) : (
                sellerName[0].toUpperCase()
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-ink truncate">{listing.seller?.full_name ?? sellerName}</p>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                {listing.address && (
                  <span className="text-[11px] text-ink-muted">{listing.address.split(",")[1]?.trim()}</span>
                )}
                {listing.seller?.mercadopago_user_id && (
                  <span className="text-[10px] font-semibold text-[#009EE3]">· Pago seguro</span>
                )}
              </div>
            </div>
            <Link
              href={`/vendedor/${listing.seller?.username ?? listing.seller_id}`}
              className="flex-shrink-0 text-xs font-semibold text-brand-600 hover:underline"
            >
              Ver tienda →
            </Link>
          </div>

          {/* Share */}
          <div className="mt-4">
            <ShareButtons
              title={book.title}
              author={book.author}
              url={`https://tuslibros.cl${libroUrl(listing)}`}
              price={listing.price}
            />
          </div>
        </div>
      </div>

      <DescriptionSection listing={listing} />

      {/* Buybox */}
      {listing.price != null && listing.modality !== "loan" && (
        <div className="border-t border-line px-6 py-5 space-y-3">
          {isSold ? (
            <div className="text-center py-4">
              <p className="font-display text-xl font-bold text-[--coral]">Este libro ya fue vendido</p>
              <p className="text-sm text-ink-muted mt-1">Busca otros similares o contacta al vendedor por si tiene más.</p>
            </div>
          ) : (listing.seller as any)?.on_vacation ? (
            <div className="space-y-3">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                <span className="text-2xl leading-none mt-0.5" aria-hidden>🌴</span>
                <div>
                  <p className="font-display text-base font-bold text-amber-900">El vendedor está en modo vacaciones</p>
                  <p className="text-sm text-amber-800 mt-1 leading-relaxed">
                    {(listing.seller as any)?.vacation_message?.trim()
                      ? (listing.seller as any).vacation_message
                      : "Vuelve pronto. Por ahora este libro no se puede comprar, pero puedes escribirle y dejar tu interés para cuando regrese."}
                  </p>
                </div>
              </div>
              <WhatsAppButton phone={listing.seller?.phone ?? null} title={book.title} listingId={listing.id} />
            </div>
          ) : (listing.seller as any)?.mercadopago_user_id ? (
            <>
              <Link
                href={`/checkout/${listing.id}`}
                className="flex items-center justify-center gap-2 w-full bg-coral hover:bg-coral-deep text-white font-bold py-4 rounded-xl transition-all text-base shadow-sm"
              >
                Comprar con MercadoPago — ${listing.price.toLocaleString("es-CL")}
              </Link>
              {/* Confianza: el pago protegido resuelve el "¿y si no me llega?" antes de que se vaya por WhatsApp */}
              <div className="flex items-start gap-2 bg-[#009EE3]/5 border border-[#009EE3]/20 rounded-xl px-3 py-2.5">
                <span className="text-base leading-none mt-0.5" aria-hidden>🛡️</span>
                <p className="text-xs text-ink leading-snug">
                  <span className="font-semibold">Compra protegida.</span> Tu pago queda retenido en
                  MercadoPago y el vendedor lo recibe recién cuando confirmas que el libro llegó bien.
                </p>
              </div>
              <AddToCartButton listingId={listing.id} price={listing.price ?? 0} title={book.title} />
              <WhatsAppButton phone={listing.seller?.phone ?? null} title={book.title} listingId={listing.id} variant="secondary" />
            </>
          ) : (
            <div className="space-y-2">
              <WhatsAppButton phone={listing.seller?.phone ?? null} title={book.title} listingId={listing.id} />
              <ContactSellerButton sellerId={listing.seller_id} listingId={listing.id} sellerName={sellerName} bookTitle={book.title} />
            </div>
          )}
        </div>
      )}

      {/* Rental CTA */}
      {(listing as ListingWithRentalFields).rental_price != null && listing.modality !== "sale" && (
        <RentalSection listing={listing as ListingWithRentalFields} />
      )}

      {/* Publicar uno igual — solo visible para quien NO es el dueño */}
      {!isOwner && (
        <div className="border-t border-line px-6 py-4 bg-cream-warm/30">
          <Link
            href={`/publish?book_id=${(listing.book as any)?.id ?? (listing as any).book_id}`}
            className="flex items-center justify-center gap-2 w-full text-sm text-ink-muted hover:text-brand-600 hover:bg-brand-50 border border-dashed border-line-strong hover:border-coral/40 py-2.5 rounded-xl transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            ¿Tienes este libro? Véndelo tú también
          </Link>
        </div>
      )}

      <div className="px-6 sm:px-8 pb-4">
        <SellerOtherListings sellerId={listing.seller_id} sellerUsername={listing.seller?.username} currentListingId={listing.id} />
      </div>

      {/* Mobile Sticky Buy Bar */}
      {listing.price != null && listing.modality !== "loan" && !isSold && (
        <div className="sm:hidden fixed bottom-0 left-0 right-0 p-4 bg-paper-card border-t border-line shadow-[0_-8px_16px_rgba(0,0,0,0.05)] z-50 flex items-center justify-between gap-4 animate-in slide-in-from-bottom-full duration-300">
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Precio</span>
            <span className="text-xl font-bold text-black leading-none">${listing.price.toLocaleString("es-CL")}</span>
          </div>
          <div className="flex-1">
            {listing.seller?.mercadopago_user_id ? (
              <Link
                href={`/checkout/${listing.id}`}
                className="flex items-center justify-center w-full bg-coral active:bg-coral-deep text-white font-bold py-3.5 rounded-xl transition-all shadow-md text-base"
              >
                Comprar ahora
              </Link>
            ) : (
              <WhatsAppButton
                phone={listing.seller?.phone ?? null}
                title={book.title}
                listingId={listing.id}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function DescriptionSection({ listing }: { listing: ListingWithBook }) {
  const { book } = listing;

  return (
    <div className="border-t border-line">
      <div className="px-5 sm:px-6 pt-4">
        <h2 className="text-sm font-semibold text-ink">Descripción</h2>
      </div>
      <div className="px-5 sm:px-6 py-4">
        {book.description ? (
          <p className="text-sm text-black-soft leading-relaxed">{book.description}</p>
        ) : (
          <p className="text-sm text-ink-muted italic">Sin sinopsis disponible. Consulta al vendedor por más detalles.</p>
        )}
      </div>
    </div>
  );
}

function RentalSection({ listing }: { listing: ListingWithRentalFields }) {
  const [periodDays, setPeriodDays] = useState<7 | 14 | 30>(
    (listing.rental_period_days as 7 | 14 | 30) ?? 14
  );
  const [deliveryMethod, setDeliveryMethod] = useState<"in_person" | "pickup_point" | "courier">("in_person");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const basePrice = Number(listing.rental_price);
  const basePeriod = listing.rental_period_days ?? 14;
  // Precio proporcional al período seleccionado
  const rentalPrice = Math.round((basePrice / basePeriod) * periodDays);
  const deposit = Number(listing.rental_deposit ?? 0);

  const deliveryOptions = [
    { value: "in_person" as const, label: "Encuentro en persona", desc: "Coordina lugar y hora con el vendedor — gratis", icon: "🤝", disabled: false },
    // Punto de retiro: reactivar cuando haya convenios con lugares específicos
    // { value: "pickup_point" as const, label: "Punto de retiro", desc: "Retira en un punto convenido", icon: "📍", disabled: false },
    { value: "courier" as const, label: "Envío courier", desc: "Próximamente", icon: "📦", disabled: true },
  ];

  async function handleRent() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/rentals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listing_id: listing.id,
          period_days: periodDays,
          delivery_method: deliveryMethod,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Error al crear arriendo");
        return;
      }
      if (data.init_point) {
        window.location.href = data.init_point;
      }
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="border-t border-line px-6 py-5 bg-brand-50/50">
      <h3 className="font-semibold text-gray-900 mb-3">Arrendar este libro</h3>

      {/* Período */}
      <div className="mb-3">
        <p className="text-xs font-medium text-gray-500 mb-2">Período</p>
        <div className="grid grid-cols-3 gap-2">
          {([7, 14, 30] as const).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setPeriodDays(d)}
              className={`py-2 rounded-lg border text-sm font-medium transition-all ${
                periodDays === d
                  ? "border-brand-500 bg-white text-brand-700 ring-1 ring-brand-400"
                  : "border-gray-200 text-gray-600 bg-white hover:border-gray-300"
              }`}
            >
              {d} días
            </button>
          ))}
        </div>
      </div>

      {/* Entrega */}
      <div className="mb-4">
        <p className="text-xs font-medium text-gray-500 mb-2">Forma de entrega</p>
        <div className="space-y-2">
          {deliveryOptions.map((opt) => (
            <label
              key={opt.value}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                opt.disabled
                  ? "border-gray-100 bg-gray-50 cursor-not-allowed opacity-60"
                  : deliveryMethod === opt.value
                    ? "border-brand-500 bg-white cursor-pointer"
                    : "border-gray-200 bg-white hover:border-gray-300 cursor-pointer"
              }`}
            >
              <input
                type="radio"
                name="delivery"
                value={opt.value}
                checked={deliveryMethod === opt.value}
                onChange={() => !opt.disabled && setDeliveryMethod(opt.value)}
                disabled={opt.disabled}
                className="accent-brand-500"
              />
              <span className="text-lg">{opt.icon}</span>
              <div>
                <p className={`text-sm font-medium ${opt.disabled ? "text-gray-400" : "text-gray-800"}`}>{opt.label}</p>
                <p className="text-xs text-gray-400">{opt.desc}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Desglose */}
      <div className="bg-white rounded-lg border border-gray-200 p-3 mb-4 text-sm space-y-1">
        <div className="flex justify-between">
          <span className="text-gray-500">Arriendo ({periodDays} días)</span>
          <span className="text-gray-900">${rentalPrice.toLocaleString("es-CL")}</span>
        </div>
        {deposit > 0 && (
          <div className="flex justify-between">
            <span className="text-gray-500">Garantía (reembolsable)</span>
            <span className="text-gray-900">${deposit.toLocaleString("es-CL")}</span>
          </div>
        )}
        <div className="flex justify-between font-bold border-t border-line pt-1">
          <span>Total</span>
          <span>${(rentalPrice + deposit).toLocaleString("es-CL")}</span>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 mb-3">{error}</p>
      )}

      <button
        onClick={handleRent}
        disabled={loading}
        className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors"
      >
        {loading ? "Procesando..." : `Arrendar — $${(rentalPrice + deposit).toLocaleString("es-CL")}`}
      </button>
    </div>
  );
}
