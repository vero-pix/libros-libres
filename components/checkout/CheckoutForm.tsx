"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import type { ListingWithBook } from "@/types";

interface ShippingQuote {
  service: string;
  serviceCode: number;
  deliveryTime: string;
  price: number;
  courier?: string;
}

// Fallback cuando no hay API de courier o falla la cotización
const FALLBACK_OPTIONS: ShippingQuote[] = [
  {
    service: "Estándar",
    serviceCode: 0,
    deliveryTime: "3-5 días hábiles",
    price: 2900,
  },
];

interface Props {
  listing: ListingWithBook;
  buyerAddress: string;
  buyerName: string;
}

type DeliveryMethod = "courier" | "in_person" | "pickup_point";

const DELIVERY_OPTIONS = [
  { value: "in_person" as const, label: "Encuentro en persona", desc: "Gratis — coordina lugar y hora con el vendedor", icon: "🤝", enabled: true },
  // Punto de retiro: reactivar cuando haya convenios con lugares específicos
  // { value: "pickup_point" as const, label: "Punto de retiro", desc: "Retira en un punto convenido", icon: "📍", enabled: true },
  { value: "courier" as const, label: "Envío courier", desc: "Recibe en tu domicilio vía Shipit", icon: "📦", enabled: true },
];

export default function CheckoutForm({ listing, buyerAddress, buyerName }: Props) {
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>("in_person");
  const [address, setAddress] = useState(buyerAddress);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Shipping quotes
  const [quotes, setQuotes] = useState<ShippingQuote[]>([]);
  const [selectedService, setSelectedService] = useState<number | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  const { book } = listing;
  const bookPrice = listing.price ?? 0;

  const isCourier = deliveryMethod === "courier";
  const selectedQuote = isCourier ? quotes.find((q) => q.serviceCode === selectedService) : null;
  const shippingCost = selectedQuote?.price ?? 0;
  const total = bookPrice + shippingCost;

  const fetchQuotes = useCallback(
    async (addr: string) => {
      if (!addr.trim() || addr.trim().length < 5) return;

      setQuoting(true);
      setQuoteError(null);

      try {
        const res = await fetch("/api/shipping/quote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            listing_id: listing.id,
            buyer_address: addr,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          setQuoteError(data.error ?? "Error al cotizar envío");
          setQuotes(FALLBACK_OPTIONS);
          setSelectedService(FALLBACK_OPTIONS[0].serviceCode);
          return;
        }

        const q = data.quotes as ShippingQuote[];
        setQuotes(q);
        if (q.length > 0) {
          const cheapest = q.reduce((a, b) => (a.price < b.price ? a : b));
          setSelectedService(cheapest.serviceCode);
        }
      } catch {
        setQuoteError("Error de conexión al cotizar");
        setQuotes(FALLBACK_OPTIONS);
        setSelectedService(FALLBACK_OPTIONS[0].serviceCode);
      } finally {
        setQuoting(false);
      }
    },
    [listing.id]
  );

  // Cotizar al cargar si ya tenemos dirección guardada
  useEffect(() => {
    if (buyerAddress && buyerAddress.trim().length >= 10) {
      fetchQuotes(buyerAddress);
    }
  }, [buyerAddress, fetchQuotes]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isCourier && !selectedQuote) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listing_id: listing.id,
          shipping_speed: "standard",
          shipping_cost_override: isCourier ? selectedQuote!.price : 0,
          shipping_service: isCourier ? selectedQuote!.service : deliveryMethod === "in_person" ? "Entrega en persona" : "Punto de retiro",
          shipping_courier: isCourier ? selectedQuote!.courier : undefined,
          buyer_address: isCourier ? address : deliveryMethod,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Error al procesar el pedido");
        return;
      }

      if (data.init_point) {
        window.location.href = data.init_point;
      }
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Book summary */}
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-900 mb-4">Resumen del libro</h2>
        <div className="flex gap-4">
          <div className="w-16 h-20 bg-gray-50 rounded flex-shrink-0 flex items-center justify-center overflow-hidden">
            {book.cover_url ? (
              <Image
                src={book.cover_url}
                alt={book.title}
                width={64}
                height={80}
                className="object-contain"
              />
            ) : (
              <span className="text-2xl">📚</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-gray-900 text-sm truncate">{book.title}</h3>
            <p className="text-xs text-gray-500">{book.author}</p>
            <p className="text-xs text-gray-400 mt-1">
              Vendido por {listing.seller?.full_name ?? "Vendedor"}
            </p>
          </div>
          <p className="font-bold text-gray-900 whitespace-nowrap">
            ${bookPrice.toLocaleString("es-CL")}
          </p>
        </div>
      </div>

      {/* Delivery method */}
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-900 mb-4">Forma de entrega</h2>
        <div className="space-y-2">
          {DELIVERY_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                !opt.enabled
                  ? "opacity-50 cursor-not-allowed border-gray-200"
                  : deliveryMethod === opt.value
                    ? "border-brand-500 bg-brand-50 cursor-pointer"
                    : "border-gray-200 hover:border-gray-300 cursor-pointer"
              }`}
            >
              <input
                type="radio"
                name="delivery"
                value={opt.value}
                checked={deliveryMethod === opt.value}
                onChange={() => opt.enabled && setDeliveryMethod(opt.value)}
                disabled={!opt.enabled}
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

      {/* Shipping address — only for courier */}
      {isCourier && (
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Dirección de envío</h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Ej: San Pío X 2555, Providencia"
              required
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
            <button
              type="button"
              onClick={() => fetchQuotes(address)}
              disabled={quoting || address.trim().length < 5}
              className="px-4 py-2.5 bg-brand-500 hover:bg-brand-600 disabled:bg-gray-300 text-white text-sm font-medium rounded-md transition-colors whitespace-nowrap"
            >
              {quoting ? "Cotizando..." : "Cotizar"}
            </button>
          </div>
          {quoting && (
            <p className="text-xs text-gray-400 mt-2 flex items-center gap-1.5">
              <span className="w-3 h-3 border-2 border-gray-300 border-t-brand-500 rounded-full animate-spin" />
              Consultando couriers disponibles...
            </p>
          )}
        </div>
      )}

      {/* Shipping options — only for courier */}
      {isCourier && quotes.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Opciones de envío</h2>
          {quoteError && (
            <p className="text-xs text-amber-600 mb-3">
              {quoteError} — mostrando precio estimado.
            </p>
          )}
          <div className="space-y-3">
            {quotes.map((q) => (
              <label
                key={q.serviceCode}
                className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedService === q.serviceCode
                    ? "border-brand-500 bg-brand-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="shipping"
                    value={q.serviceCode}
                    checked={selectedService === q.serviceCode}
                    onChange={() => setSelectedService(q.serviceCode)}
                    className="accent-brand-500"
                  />
                  <div>
                    <p className="font-medium text-gray-900 text-sm">
                      {q.service}
                    </p>
                    <p className="text-xs text-gray-500">
                      {q.deliveryTime}{q.courier ? ` — ${q.courier}` : ""}
                    </p>
                  </div>
                </div>
                <span className="font-semibold text-gray-900 text-sm">
                  ${q.price.toLocaleString("es-CL")}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Price breakdown */}
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-900 mb-4">Detalle del pago</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Libro</span>
            <span className="text-gray-900">${bookPrice.toLocaleString("es-CL")}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">
              {isCourier
                ? `Envío${selectedQuote ? ` (${selectedQuote.service})` : ""}`
                : "Entrega"}
            </span>
            <span className="text-gray-900">
              {isCourier
                ? selectedQuote
                  ? `$${shippingCost.toLocaleString("es-CL")}`
                  : "Ingresa dirección"
                : "Gratis"}
            </span>
          </div>
          {/* Comisión se maneja internamente en split payment, no se muestra al comprador */}
          <div className="border-t border-gray-200 pt-2 mt-2 flex justify-between font-bold">
            <span className="text-gray-900">Total</span>
            <span className="text-gray-900">
              {isCourier
                ? selectedQuote
                  ? `$${total.toLocaleString("es-CL")}`
                  : "—"
                : `$${total.toLocaleString("es-CL")}`}
            </span>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-4">
          {error}
        </div>
      )}

      {/* MercadoPago button — only if seller has MP connected */}
      {(listing.seller as any)?.mercadopago_user_id && (
        <>
          <button
            type="submit"
            disabled={loading || (isCourier && (!address || !selectedQuote))}
            className="w-full bg-brand-500 hover:bg-brand-600 disabled:bg-gray-300 text-white font-semibold py-3 rounded-lg text-sm transition-colors"
          >
            {loading
              ? "Procesando..."
              : isCourier
                ? selectedQuote
                  ? `Pagar $${total.toLocaleString("es-CL")} con MercadoPago`
                  : "Ingresa dirección para cotizar envío"
                : `Pagar $${bookPrice.toLocaleString("es-CL")} con MercadoPago`}
          </button>
          <p className="text-xs text-gray-400 text-center">
            Serás redirigido a MercadoPago para completar el pago de forma segura.
          </p>
        </>
      )}

      {/* WhatsApp button */}
      {!isCourier && listing.seller?.phone && (
        <>
          {(listing.seller as any)?.mercadopago_user_id && (
            <div className="flex items-center gap-3 text-xs text-gray-400">
              <span className="flex-1 border-t border-gray-200" />
              o
              <span className="flex-1 border-t border-gray-200" />
            </div>
          )}
          <a
            href={`https://wa.me/${listing.seller.phone.replace(/\D/g, "")}?text=${encodeURIComponent(
              `Hola! Me interesa "${book.title}" a $${bookPrice.toLocaleString("es-CL")} en tuslibros.cl. ¿Podemos coordinar la entrega?`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1da851] text-white font-semibold py-3 rounded-lg text-sm transition-colors"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            Coordinar por WhatsApp — sin comisión
          </a>
          <p className="text-xs text-gray-400 text-center">
            Coordinas directamente con el vendedor. Sin costo adicional.
          </p>
        </>
      )}

      {/* No payment method available */}
      {!(listing.seller as any)?.mercadopago_user_id && !listing.seller?.phone && (
        <p className="text-sm text-gray-500 text-center bg-gray-50 rounded-lg p-4">
          Este vendedor aún no tiene métodos de pago configurados. Puedes contactarlo a través de las preguntas en la ficha del libro.
        </p>
      )}
    </form>
  );
}
