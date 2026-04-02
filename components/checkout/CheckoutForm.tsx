"use client";

import { useState } from "react";
import Image from "next/image";
import type { ListingWithBook, ShippingSpeed } from "@/types";

const SERVICE_FEE = 1500;
const SHIPPING_COSTS: Record<ShippingSpeed, number> = {
  standard: 2900,
  express: 4500,
};

const SHIPPING_OPTIONS: {
  value: ShippingSpeed;
  label: string;
  description: string;
  courier: string;
}[] = [
  {
    value: "standard",
    label: "Estándar",
    description: "24-48 horas",
    courier: "Chilexpress",
  },
  {
    value: "express",
    label: "Rápido",
    description: "2-4 horas (Santiago)",
    courier: "Rappi",
  },
];

interface Props {
  listing: ListingWithBook;
  buyerAddress: string;
  buyerName: string;
}

export default function CheckoutForm({ listing, buyerAddress, buyerName }: Props) {
  const [shippingSpeed, setShippingSpeed] = useState<ShippingSpeed>("standard");
  const [address, setAddress] = useState(buyerAddress);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { book } = listing;
  const bookPrice = listing.price ?? 0;
  const shippingCost = SHIPPING_COSTS[shippingSpeed];
  const total = bookPrice + shippingCost + SERVICE_FEE;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listing_id: listing.id,
          shipping_speed: shippingSpeed,
          buyer_address: address,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Error al procesar el pedido");
        return;
      }

      // Redirect to MercadoPago
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

      {/* Shipping address */}
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
      </div>

      {/* Shipping speed */}
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-900 mb-4">Velocidad de envío</h2>
        <div className="space-y-3">
          {SHIPPING_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-colors ${
                shippingSpeed === opt.value
                  ? "border-brand-500 bg-brand-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="shipping"
                  value={opt.value}
                  checked={shippingSpeed === opt.value}
                  onChange={() => setShippingSpeed(opt.value)}
                  className="accent-brand-500"
                />
                <div>
                  <p className="font-medium text-gray-900 text-sm">{opt.label}</p>
                  <p className="text-xs text-gray-500">
                    {opt.description} — {opt.courier}
                  </p>
                </div>
              </div>
              <span className="font-semibold text-gray-900 text-sm">
                ${SHIPPING_COSTS[opt.value].toLocaleString("es-CL")}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Price breakdown */}
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-900 mb-4">Detalle del pago</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Libro</span>
            <span className="text-gray-900">${bookPrice.toLocaleString("es-CL")}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Envío</span>
            <span className="text-gray-900">${shippingCost.toLocaleString("es-CL")}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Cargo por servicio</span>
            <span className="text-gray-900">${SERVICE_FEE.toLocaleString("es-CL")}</span>
          </div>
          <div className="border-t border-gray-200 pt-2 mt-2 flex justify-between font-bold">
            <span className="text-gray-900">Total</span>
            <span className="text-gray-900">${total.toLocaleString("es-CL")}</span>
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
        disabled={loading || !address}
        className="w-full bg-brand-500 hover:bg-brand-600 disabled:bg-gray-300 text-white font-semibold py-3 rounded-lg text-sm transition-colors"
      >
        {loading ? "Procesando..." : `Pagar $${total.toLocaleString("es-CL")} con MercadoPago`}
      </button>

      <p className="text-xs text-gray-400 text-center">
        Serás redirigido a MercadoPago para completar el pago de forma segura.
      </p>
    </form>
  );
}
