"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import type { ListingWithBook } from "@/types";
import { addRecentlyViewed } from "./RecentlyViewed";
import AddToCartButton from "@/components/ui/AddToCartButton";
import AdSlot from "@/components/ui/AdSlot";
import ImageGallery from "./ImageGallery";
import ShareButtons from "./ShareButtons";
import ContactSellerButton from "@/components/messages/ContactSellerButton";

function WhatsAppButton({ phone, title }: { phone: string | null; title: string }) {
  if (!phone) {
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

  return (
    <a
      href={waUrl}
      target="_blank"
      rel="noopener noreferrer"
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
  loan: "Préstamo",
  both: "Venta y préstamo",
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

  useEffect(() => {
    addRecentlyViewed({
      id: listing.id,
      title: book.title,
      cover_url: coverUrl,
      price: listing.price,
      genre: book.genre,
      author: book.author,
    });
  }, [listing.id, book.title, coverUrl, listing.price, book.genre, book.author]);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      {/* Cover + Info — mobile: imagen arriba centrada, desktop: lado a lado */}
      <div className="flex flex-col sm:flex-row gap-6 sm:gap-8 p-5 sm:p-8">
        {/* Cover / Gallery */}
        <div className="flex-shrink-0 flex justify-center sm:justify-start">
          <ImageGallery
            mainImage={coverUrl}
            images={images}
            alt={book.title}
          />
        </div>

        {/* Info */}
        <div className="flex-1">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{book.title}</h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">{book.author}</p>

          <div className="flex flex-wrap gap-2 mt-3">
            {book.genre && (
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-brand-50 text-brand-600 border border-brand-100">
                {book.genre}
              </span>
            )}
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 border border-gray-200">
              {CONDITION_LABELS[listing.condition] ?? listing.condition}
            </span>
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-brand-100 text-brand-700 border border-brand-200">
              {MODALITY_LABELS[listing.modality]}
            </span>
          </div>

          {listing.price != null && listing.modality !== "loan" && (() => {
            const originalPrice = (listing as unknown as Record<string, unknown>).original_price != null
              ? Number((listing as unknown as Record<string, unknown>).original_price)
              : null;
            const hasDiscount = originalPrice != null && originalPrice > listing.price;
            const discountPct = hasDiscount
              ? Math.round(((originalPrice - listing.price) / originalPrice) * 100)
              : 0;

            return (
              <div className="mt-4 inline-flex items-center gap-2 flex-wrap">
                {hasDiscount && (
                  <span className="text-base sm:text-lg text-gray-400 line-through">
                    ${originalPrice.toLocaleString("es-CL")}
                  </span>
                )}
                <span className="bg-brand-500 text-white font-bold text-lg sm:text-xl px-4 py-1.5 rounded-lg">
                  ${listing.price.toLocaleString("es-CL")}
                </span>
                {hasDiscount && (
                  <span className="text-xs font-bold px-2 py-1 rounded-full bg-red-100 text-red-600">
                    -{discountPct}%
                  </span>
                )}
                <span className="text-xs text-gray-400 uppercase tracking-wider">Precio de venta</span>
              </div>
            );
          })()}

          {(listing as ListingWithRentalFields).rental_price != null && listing.modality !== "sale" && (
            <p className="text-sm text-brand-600 font-semibold mt-1">
              Arriendo: ${Number((listing as ListingWithRentalFields).rental_price).toLocaleString("es-CL")} / {(listing as ListingWithRentalFields).rental_period_days ?? 14} días
              {(listing as ListingWithRentalFields).rental_deposit != null && (
                <span className="text-gray-400 font-normal">
                  {" "}+ ${Number((listing as ListingWithRentalFields).rental_deposit).toLocaleString("es-CL")} garantía
                </span>
              )}
            </p>
          )}

          {listing.notes && (
            <div className="mt-4 bg-gray-50 rounded-xl p-3">
              <p className="text-xs font-semibold text-gray-500 mb-1">Notas del vendedor</p>
              <p className="text-sm text-gray-600">{listing.notes}</p>
            </div>
          )}

          {listing.address && (
            <p className="text-sm text-gray-500 mt-3 flex items-start gap-1">
              <span className="mt-0.5">📍</span>
              <span>{listing.address.split(",").slice(1, 2).join("").trim() || listing.address.split(",")[0]}</span>
            </p>
          )}

          {/* Vendedor */}
          <Link
            href={`/vendedor/${listing.seller_id}`}
            className="inline-flex items-center gap-2 mt-4 px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors group"
          >
            <div className="w-7 h-7 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
              {sellerName[0].toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 group-hover:text-brand-600 transition-colors">
                {sellerName}
              </p>
              <p className="text-[10px] text-gray-400">Ver todos sus libros</p>
            </div>
          </Link>

          {/* Share */}
          <div className="mt-4">
            <ShareButtons
              title={book.title}
              author={book.author}
              url={`https://tuslibros.cl/listings/${listing.id}`}
              price={listing.price}
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <DetailTabs listing={listing} />

      {/* Buy CTA */}
      {listing.price != null && listing.modality !== "loan" && (
        <div className="border-t border-gray-100 px-6 py-4 bg-gray-50 space-y-3">
          <Link
            href={`/checkout/${listing.id}`}
            className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white font-bold py-4 rounded-xl transition-all text-lg shadow-md hover:shadow-lg"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
            </svg>
            Comprar — ${listing.price.toLocaleString("es-CL")}
          </Link>
          <AddToCartButton listingId={listing.id} />
        </div>
      )}

      {/* Rental CTA */}
      {(listing as ListingWithRentalFields).rental_price != null && listing.modality !== "sale" && (
        <RentalSection listing={listing as ListingWithRentalFields} />
      )}

      {/* Messaging CTA */}
      <div className="border-t border-gray-100 px-6 py-5 bg-brand-50/30">
        <p className="text-xs font-semibold text-gray-500 mb-2 text-center">Envía un mensaje al vendedor</p>
        <ContactSellerButton
          sellerId={listing.seller_id}
          listingId={listing.id}
          sellerName={sellerName}
        />
      </div>

      {/* Contact CTA */}
      <div className="border-t border-gray-100 px-6 py-5 bg-green-50/50">
        <p className="text-xs font-semibold text-gray-500 mb-2 text-center">Coordinar sin MercadoPago — gratis, sin comisiones</p>
        <div className="space-y-2">
          <WhatsAppButton
            phone={listing.seller?.phone ?? null}
            title={book.title}
          />
          {listing.seller?.instagram && (
            <a
              href={`https://instagram.com/${listing.seller.instagram}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full border-2 border-pink-400 text-pink-500 hover:bg-pink-50 font-semibold py-3 rounded-xl transition-colors"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
              </svg>
              Contactar por Instagram
            </a>
          )}
          {listing.seller?.public_email && (
            <a
              href={`mailto:${listing.seller.public_email}?subject=${encodeURIComponent(`Consulta sobre "${book.title}" en tuslibros.cl`)}`}
              className="flex items-center justify-center gap-2 w-full border-2 border-blue-400 text-blue-500 hover:bg-blue-50 font-semibold py-3 rounded-xl transition-colors"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-current" xmlns="http://www.w3.org/2000/svg" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="M22 4l-10 8L2 4" />
              </svg>
              Contactar por Email
            </a>
          )}
        </div>
        <p className="text-[11px] text-gray-400 text-center mt-2">
          Contacta al vendedor directamente. Sin comisiones para ninguna de las partes.
        </p>
      </div>

      {/* Ad — only render wrapper if AdSense is configured */}
      {process.env.NEXT_PUBLIC_ADSENSE_CLIENT && (
        <div className="border-t border-gray-100 px-6 py-4">
          <AdSlot slot="listing-detail" format="horizontal" />
        </div>
      )}
    </div>
  );
}

function DetailTabs({ listing }: { listing: ListingWithBook }) {
  const [activeTab, setActiveTab] = useState<"descripcion" | "ubicacion" | "vendedor">("descripcion");
  const { book } = listing;
  const sellerName = listing.seller?.full_name?.split(" ")[0] ?? "Vendedor";

  const tabs = [
    { key: "descripcion" as const, label: "Descripción" },
    { key: "ubicacion" as const, label: "Ubicación" },
    { key: "vendedor" as const, label: "Vendedor" },
  ];

  return (
    <div className="border-t border-gray-100">
      <div className="flex border-b border-gray-100">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "text-brand-600 border-b-2 border-brand-500"
                : "text-ink-muted hover:text-ink"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="px-5 sm:px-6 py-4">
        {activeTab === "descripcion" && (
          book.description ? (
            <p className="text-sm text-gray-600 leading-relaxed">{book.description}</p>
          ) : (
            <p className="text-sm text-gray-400 italic">Sin sinopsis disponible. Consulta al vendedor por más detalles.</p>
          )
        )}
        {activeTab === "ubicacion" && (
          <p className="text-sm text-gray-600">
            {listing.address
              ? listing.address.split(",").slice(0, 2).join(",").trim()
              : "Ubicación no especificada"}
          </p>
        )}
        {activeTab === "vendedor" && (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center font-bold flex-shrink-0">
              {sellerName[0].toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">{sellerName}</p>
              <Link
                href={`/vendedor/${listing.seller_id}`}
                className="text-xs text-brand-600 hover:text-brand-700 transition-colors"
              >
                Ver tienda del vendedor
              </Link>
            </div>
          </div>
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

  const rentalPrice = Number(listing.rental_price);
  const deposit = Number(listing.rental_deposit ?? 0);

  const deliveryOptions = [
    { value: "in_person" as const, label: "Encuentro en persona", desc: "Gratis", icon: "🤝" },
    { value: "pickup_point" as const, label: "Punto de retiro", desc: "Acuerdan un lugar", icon: "📍" },
    { value: "courier" as const, label: "Envío courier", desc: "Costo adicional", icon: "📦" },
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
    <div className="border-t border-gray-100 px-6 py-5 bg-brand-50/50">
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
              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                deliveryMethod === opt.value
                  ? "border-brand-500 bg-white"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <input
                type="radio"
                name="delivery"
                value={opt.value}
                checked={deliveryMethod === opt.value}
                onChange={() => setDeliveryMethod(opt.value)}
                className="accent-brand-500"
              />
              <span className="text-lg">{opt.icon}</span>
              <div>
                <p className="text-sm font-medium text-gray-800">{opt.label}</p>
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
        <div className="flex justify-between font-bold border-t border-gray-100 pt-1">
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
