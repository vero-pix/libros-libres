"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";

interface CartItem {
  id: string;
  listing_id: string;
  added_at: string;
  listing: {
    id: string;
    slug: string | null;
    price: number | null;
    status: string;
    cover_image_url: string | null;
    book: { title: string; author: string; cover_url: string | null };
    seller: {
      id: string;
      full_name: string | null;
      username: string | null;
      mercadopago_user_id?: string | null;
      phone?: string | null;
    } | null;
  };
}

interface SellerGroup {
  sellerId: string;
  sellerName: string;
  sellerUsername: string | null;
  sellerHasMP: boolean;
  sellerPhone: string | null;
  items: CartItem[];
  subtotal: number;
}

export default function CartView({
  items: initialItems,
}: {
  items: CartItem[];
}) {
  const [items, setItems] = useState(initialItems);
  const [removing, setRemoving] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);

  const activeItems = items.filter((i) => i.listing.status === "active");

  // Agrupar por vendedor
  const sellerGroups = useMemo<SellerGroup[]>(() => {
    const map = new Map<string, SellerGroup>();
    for (const it of activeItems) {
      const s = it.listing.seller;
      if (!s) continue;
      if (!map.has(s.id)) {
        map.set(s.id, {
          sellerId: s.id,
          sellerName: s.full_name ?? "Vendedor",
          sellerUsername: s.username ?? null,
          sellerHasMP: !!s.mercadopago_user_id,
          sellerPhone: s.phone ?? null,
          items: [],
          subtotal: 0,
        });
      }
      const g = map.get(s.id)!;
      g.items.push(it);
      g.subtotal += it.listing.price ?? 0;
    }
    return Array.from(map.values());
  }, [activeItems]);

  const grandTotal = sellerGroups.reduce((sum, g) => sum + g.subtotal, 0);

  async function handleRemove(listingId: string) {
    setRemoving(listingId);
    await fetch("/api/cart", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listing_id: listingId }),
    });
    setItems((prev) => prev.filter((i) => i.listing_id !== listingId));
    setRemoving(null);
    window.dispatchEvent(new CustomEvent("cart-updated"));
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
    window.dispatchEvent(new CustomEvent("cart-updated"));
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink-muted">
          {items.length} libro{items.length !== 1 ? "s" : ""} en tu carrito
          {sellerGroups.length > 1 && (
            <>
              {" "}· {sellerGroups.length} vendedores
            </>
          )}
        </p>
        <button
          onClick={handleClearCart}
          disabled={clearing}
          className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50 font-medium"
        >
          {clearing ? "Vaciando..." : "Vaciar carrito"}
        </button>
      </div>

      {/* Items no disponibles */}
      {items
        .filter((i) => i.listing.status !== "active")
        .map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-xl border border-cream-dark/30 p-4 opacity-50"
          >
            <div className="flex gap-4 items-center">
              <div className="w-14 h-20 bg-cream-warm rounded flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-ink text-sm truncate">
                  {item.listing.book.title}
                </p>
                <p className="text-xs text-red-500 mt-1">No disponible</p>
              </div>
              <button
                onClick={() => handleRemove(item.listing_id)}
                disabled={removing === item.listing_id}
                className="text-xs text-red-500 hover:text-red-700"
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}

      {/* Bloques por vendedor */}
      {sellerGroups.map((group) => {
        const listingIds = group.items.map((i) => i.listing.id).join(",");
        const checkoutHref = `/checkout/bundle?listings=${listingIds}`;

        function waMessage() {
          const lines = group.items
            .map(
              (i, idx) =>
                `${idx + 1}. ${i.listing.book.title} — $${(i.listing.price ?? 0).toLocaleString("es-CL")}`
            )
            .join("\n");
          return encodeURIComponent(
            `Hola! Me interesan estos ${group.items.length} libros de tuslibros.cl:\n\n${lines}\n\nTotal: $${group.subtotal.toLocaleString("es-CL")}. ¿Coordinamos?`
          );
        }

        return (
          <div
            key={group.sellerId}
            className="bg-white rounded-xl border border-cream-dark/30 overflow-hidden"
          >
            {/* Header del vendedor */}
            <div className="px-5 py-3 bg-cream-warm/40 border-b border-cream-dark/20 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-ink-muted">
                  Vendedor
                </p>
                <Link
                  href={`/vendedor/${group.sellerId}`}
                  className="text-sm font-semibold text-ink hover:text-brand-600"
                >
                  {group.sellerName}
                </Link>
              </div>
              <p className="text-sm text-ink-muted">
                {group.items.length} libro{group.items.length !== 1 ? "s" : ""} · ${group.subtotal.toLocaleString("es-CL")}
              </p>
            </div>

            {/* Items del vendedor */}
            <div className="divide-y divide-cream-dark/10">
              {group.items.map((item) => {
                const { listing } = item;
                const cover = listing.cover_image_url ?? listing.book.cover_url;
                return (
                  <div key={item.id} className="p-4 flex gap-4">
                    <div className="relative w-14 h-20 bg-cream-warm rounded flex-shrink-0 overflow-hidden flex items-center justify-center">
                      {cover ? (
                        <Image
                          src={cover}
                          alt={listing.book.title}
                          fill
                          className="object-cover"
                          sizes="56px"
                        />
                      ) : (
                        <svg
                          className="w-8 h-8 text-brand-300"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={1}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.331 0 4.473.89 6.074 2.356M12 6.042a8.968 8.968 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.356M12 6.042V20.356"
                          />
                        </svg>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <Link
                        href={
                          listing.slug && group.sellerUsername
                            ? `/libro/${group.sellerUsername}/${listing.slug}`
                            : `/listings/${listing.id}`
                        }
                        className="hover:text-brand-600"
                      >
                        <h3 className="font-medium text-ink text-sm truncate">
                          {listing.book.title}
                        </h3>
                      </Link>
                      <p className="text-xs text-ink-muted">
                        {listing.book.author}
                      </p>
                    </div>

                    <div className="flex flex-col items-end justify-between">
                      <p className="font-bold text-ink">
                        {listing.price != null
                          ? `$${listing.price.toLocaleString("es-CL")}`
                          : "—"}
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
            </div>

            {/* Checkout del grupo */}
            <div className="p-5 bg-cream-warm/20 border-t border-cream-dark/20 space-y-2">
              {group.sellerHasMP && (
                <Link
                  href={checkoutHref}
                  className="block w-full text-center bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white font-bold py-3 rounded-xl transition-all text-sm shadow-md"
                >
                  Comprar {group.items.length}{" "}
                  {group.items.length === 1 ? "libro" : "libros"} — $
                  {group.subtotal.toLocaleString("es-CL")}
                </Link>
              )}
              {group.sellerPhone && (
                <a
                  href={`https://wa.me/${group.sellerPhone.replace(/\D/g, "")}?text=${waMessage()}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full bg-[#25D366] hover:bg-[#1da851] text-white font-medium py-2.5 rounded-xl text-sm transition-colors"
                >
                  Coordinar por WhatsApp
                </a>
              )}
              {!group.sellerHasMP && !group.sellerPhone && (
                <p className="text-xs text-ink-muted text-center">
                  Este vendedor aún no tiene métodos de pago configurados.
                </p>
              )}
            </div>
          </div>
        );
      })}

      {/* Total general si hay >1 grupo */}
      {sellerGroups.length > 1 && (
        <div className="bg-white rounded-xl border border-cream-dark/30 p-5 text-right">
          <p className="text-xs text-ink-muted uppercase tracking-wider mb-1">
            Total general
          </p>
          <p className="font-display text-2xl font-bold text-ink">
            ${grandTotal.toLocaleString("es-CL")}
          </p>
          <p className="text-xs text-ink-muted mt-2">
            Cada vendedor se paga por separado (una transacción por vendedor).
          </p>
        </div>
      )}
    </div>
  );
}
