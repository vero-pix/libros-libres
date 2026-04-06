"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import type { ListingWithBook } from "@/types";
import { SERVICE_FEE } from "@/lib/mercadopago";

interface ShippingQuote {
  service: string;
  serviceCode: number;
  deliveryTime: string;
  price: number;
}

// Fallback cuando no hay API de Chilexpress o falla la cotización
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
  { value: "in_person" as const, label: "Encuentro en persona", desc: "Gratis — coordinas con el vendedor", icon: "🤝", enabled: true },
  { value: "pickup_point" as const, label: "Punto de retiro", desc: "Gratis — acuerdan un lugar", icon: "📍", enabled: true },
  { value: "courier" as const, label: "Envío por courier con etiqueta", desc: "Próximamente — estamos integrando couriers", icon: "📦", enabled: false },
];

export default function CheckoutForm({ listing, buyerAddress, buyerName }: Props) {
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>("courier");
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
  const serviceFee = isCourier ? SERVICE_FEE : 0;
  const total = bookPrice + shippingCost + serviceFee;

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
        // Seleccionar el más barato por defecto
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

  // Cotizar al cargar si ya tenemos dirección
  useEffect(() => {
    if (buyerAddress) {
      fetchQuotes(buyerAddress);
    }
  }, [buyerAddress, fetchQuotes]);

  // Debounce: cotizar cuando el usuario deja de escribir
  useEffect(() => {
    if (!address || address === buyerAddress) return;
    const timer = setTimeout(() => fetchQuotes(address), 800);
    return () => clearTimeout(timer);
  }, [address, buyerAddress, fetchQuotes]);

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
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Dirección completa (calle, número, comuna, ciudad)"
            required
            className="w-full px-4 py-2.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
          {quoting && (
            <p className="text-xs text-gray-400 mt-2 flex items-center gap-1.5">
              <span className="w-3 h-3 border-2 border-gray-300 border-t-brand-500 rounded-full animate-spin" />
              Cotizando opciones de envío...
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
                      {q.deliveryTime}{(q as any).courier ? ` — ${(q as any).courier}` : ""}
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
          {serviceFee > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-600">Cargo por servicio</span>
              <span className="text-gray-900">${serviceFee.toLocaleString("es-CL")}</span>
            </div>
          )}
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

      <button
        type="submit"
        disabled={loading || (isCourier && (!address || !selectedQuote))}
        className="w-full bg-brand-500 hover:bg-brand-600 disabled:bg-gray-300 text-white font-semibold py-3 rounded-lg text-sm transition-colors"
      >
        {loading
          ? "Procesando..."
          : !isCourier
            ? `Pagar $${(bookPrice + serviceFee).toLocaleString("es-CL")} con MercadoPago`
            : selectedQuote
              ? `Pagar $${total.toLocaleString("es-CL")} con MercadoPago`
              : "Ingresa dirección para cotizar envío"}
      </button>

      <p className="text-xs text-gray-400 text-center">
        Serás redirigido a MercadoPago para completar el pago de forma segura.
      </p>
    </form>
  );
}
