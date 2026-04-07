"use client";

import { useState } from "react";
import Image from "next/image";
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
  const [clearing, setClearing] = useState(false);

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

  async function handleClearCart() {
    if (!confirm("¿Vaciar todo el carrito?")) return;
    setClearing(true);
    await Promise.all(
      items.map((item) =>
        fetch("/api/cart", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ listing_id: item.listing_id }),
        })
      )
    );
    setItems([]);
    setClearing(false);
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
      {/* Header with clear button */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink-muted">
          {items.length} libro{items.length !== 1 ? "s" : ""} en tu carrito
        </p>
        <button
          onClick={handleClearCart}
          disabled={clearing}
          className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50 font-medium"
        >
          {clearing ? "Vaciando..." : "Vaciar carrito"}
        </button>
      </div>

      {items.map((item) => {
        const { listing } = item;
        const cover = listing.cover_image_url ?? listing.book.cover_url;
        const unavailable = listing.status !== "active";

        return (
          <div
            key={item.id}
            className={`bg-white rounded-xl border border-cream-dark/30 p-4 ${
              unavailable ? "opacity-50" : ""
            }`}
          >
            <div className="flex gap-4">
              {/* Cover */}
              <div className="relative w-14 h-20 bg-cream-warm rounded flex-shrink-0 overflow-hidden flex items-center justify-center">
                {cover ? (
                  <Image src={cover} alt={item.listing.book.title} fill className="object-cover" sizes="56px" />
                ) : (
                  <svg className="w-8 h-8 text-brand-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.331 0 4.473.89 6.074 2.356M12 6.042a8.968 8.968 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.356M12 6.042V20.356" />
                  </svg>
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
                    Vendedor: <Link href={`/vendedor/${listing.seller.id}`} className="hover:text-brand-600">{listing.seller.full_name ?? "—"}</Link>
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

            {/* Checkout button per item */}
            {!unavailable && (
              <Link
                href={`/checkout/${listing.id}`}
                className="mt-3 block w-full text-center bg-brand-500 hover:bg-brand-600 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
              >
                Comprar — ${(listing.price ?? 0).toLocaleString("es-CL")}
              </Link>
            )}
          </div>
        );
      })}

      {/* Summary */}
      <div className="bg-white rounded-xl border border-cream-dark/30 p-5 mt-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-ink-muted text-sm">
            {activeItems.length} libro{activeItems.length !== 1 ? "s" : ""} disponible{activeItems.length !== 1 ? "s" : ""}
          </span>
          <span className="font-display text-xl font-bold text-ink">
            Total: ${total.toLocaleString("es-CL")}
          </span>
        </div>
        <p className="text-xs text-ink-muted mb-4">
          Cada libro se compra por separado al vendedor correspondiente. Después de pagar uno, vuelve aquí para comprar el siguiente.
        </p>
        {activeItems.length > 0 && (
          <Link
            href={`/checkout/${activeItems[0].listing.id}?next=/carrito`}
            className="block w-full text-center bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white font-bold py-3.5 rounded-xl transition-all text-base shadow-md hover:shadow-lg"
          >
            Comprar siguiente — ${(activeItems[0].listing.price ?? 0).toLocaleString("es-CL")}
          </Link>
        )}
      </div>
    </div>
  );
}
