"use client";

import { useState } from "react";
import Link from "next/link";

interface CartItem {
  id: string;
  listing_id: string;
  added_at: string;
  listing: {
    id: string;
    price: number | null;
    status: string;
    cover_image_url: string | null;
    book: { title: string; author: string; cover_url: string | null };
    seller: { id: string; full_name: string | null } | null;
  };
}

export default function CartView({ items: initialItems }: { items: CartItem[] }) {
  const [items, setItems] = useState(initialItems);
  const [removing, setRemoving] = useState<string | null>(null);

  const activeItems = items.filter((i) => i.listing.status === "active");
  const total = activeItems.reduce((sum, i) => sum + (i.listing.price ?? 0), 0);

  async function handleRemove(listingId: string) {
    setRemoving(listingId);
    await fetch("/api/cart", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listing_id: listingId }),
    });
    setItems((prev) => prev.filter((i) => i.listing_id !== listingId));
    setRemoving(null);
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-ink-muted text-lg">Tu carrito está vacío</p>
        <Link
          href="/"
          className="inline-block mt-4 text-brand-600 font-medium hover:underline text-sm"
        >
          Explorar libros
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item) => {
        const { listing } = item;
        const cover = listing.cover_image_url ?? listing.book.cover_url;
        const unavailable = listing.status !== "active";

        return (
          <div
            key={item.id}
            className={`bg-white rounded-xl border border-cream-dark/30 p-4 flex gap-4 ${
              unavailable ? "opacity-50" : ""
            }`}
          >
            {/* Cover */}
            <div className="w-14 h-20 bg-cream-warm rounded flex-shrink-0 overflow-hidden flex items-center justify-center">
              {cover ? (
                <img src={cover} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xl">📚</span>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <Link href={`/listings/${listing.id}`} className="hover:text-brand-600">
                <h3 className="font-medium text-ink text-sm truncate">{listing.book.title}</h3>
              </Link>
              <p className="text-xs text-ink-muted">{listing.book.author}</p>
              {listing.seller && (
                <p className="text-xs text-ink-muted mt-1">
                  Vendedor: {listing.seller.full_name ?? "—"}
                </p>
              )}
              {unavailable && (
                <p className="text-xs text-red-500 mt-1">No disponible</p>
              )}
            </div>

            {/* Price + remove */}
            <div className="flex flex-col items-end justify-between">
              <p className="font-bold text-ink">
                {listing.price != null ? `$${listing.price.toLocaleString("es-CL")}` : "—"}
              </p>
              <button
                onClick={() => handleRemove(item.listing_id)}
                disabled={removing === item.listing_id}
                className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50"
              >
                {removing === item.listing_id ? "..." : "Eliminar"}
              </button>
            </div>
          </div>
        );
      })}

      {/* Summary */}
      <div className="bg-white rounded-xl border border-cream-dark/30 p-5 mt-6">
        <div className="flex justify-between items-center mb-4">
          <span className="text-ink-muted text-sm">{activeItems.length} libro{activeItems.length !== 1 ? "s" : ""}</span>
          <span className="font-display text-xl font-bold text-ink">
            ${total.toLocaleString("es-CL")}
          </span>
        </div>
        <p className="text-xs text-ink-muted mb-4">
          Cada libro se compra por separado al vendedor correspondiente.
        </p>
        {activeItems.length > 0 && (
          <div className="space-y-2">
            {activeItems.map((item) => (
              <Link
                key={item.id}
                href={`/checkout/${item.listing.id}`}
                className="block w-full text-center bg-brand-500 hover:bg-brand-600 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
              >
                Comprar &ldquo;{item.listing.book.title}&rdquo; — ${(item.listing.price ?? 0).toLocaleString("es-CL")}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
