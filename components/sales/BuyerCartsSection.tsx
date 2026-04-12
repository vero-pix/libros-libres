"use client";

import { useState } from "react";
import Link from "next/link";

interface CartListItem {
  listing_id: string;
  title: string;
  author: string;
  price: number;
  cover_url: string | null;
  added_at: string;
}

interface BuyerCart {
  buyerId: string;
  buyerName: string;
  buyerEmail: string | null;
  buyerPhone: string | null;
  items: CartListItem[];
  total: number;
  firstAddedAt: string;
  daysInCart: number;
}

interface Props {
  carts: BuyerCart[];
}

function daysSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24));
}

function waLink(phone: string | null, buyerName: string, items: CartListItem[]) {
  if (!phone) return null;
  const clean = phone.replace(/\D/g, "");
  const lines = items
    .map((i, idx) => `${idx + 1}. ${i.title} — $${i.price.toLocaleString("es-CL")}`)
    .join("\n");
  const total = items.reduce((s, i) => s + i.price, 0);
  const msg = encodeURIComponent(
    `Hola ${buyerName}! Soy de tuslibros.cl. Vi que tienes ${items.length} libro${items.length > 1 ? "s" : ""} mío${items.length > 1 ? "s" : ""} en tu carrito:\n\n${lines}\n\nTotal: $${total.toLocaleString("es-CL")}. ¿Te ayudo a coordinar la compra?`
  );
  return `https://wa.me/${clean}?text=${msg}`;
}

export default function BuyerCartsSection({ carts }: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (carts.length === 0) {
    return (
      <section className="mb-10">
        <h2 className="font-display text-lg font-bold text-ink mb-2">
          Carritos con tus libros
        </h2>
        <p className="text-sm text-ink-muted mb-4">
          Compradores que tienen libros tuyos esperando para pagar
        </p>
        <div className="bg-white rounded-xl border border-cream-dark/30 p-10 text-center text-ink-muted text-sm">
          Ningún comprador tiene tus libros en carrito en este momento.
        </div>
      </section>
    );
  }

  return (
    <section className="mb-10">
      <h2 className="font-display text-lg font-bold text-ink mb-2">
        Carritos con tus libros ({carts.length})
      </h2>
      <p className="text-sm text-ink-muted mb-4">
        Estos compradores tienen libros tuyos esperando para pagar. Puedes
        contactarlos para cerrar la venta.
      </p>
      <div className="space-y-3">
        {carts.map((cart) => {
          const isOpen = expanded.has(cart.buyerId);
          const isAbandoned = cart.daysInCart >= 3;
          return (
            <div
              key={cart.buyerId}
              className={`bg-white rounded-xl border overflow-hidden ${
                isAbandoned
                  ? "border-amber-300 bg-amber-50/30"
                  : "border-cream-dark/30"
              }`}
            >
              <button
                type="button"
                onClick={() => toggle(cart.buyerId)}
                className="w-full text-left px-5 py-4 flex items-center justify-between gap-3 hover:bg-cream-warm/30 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-sm font-bold shrink-0">
                    {cart.buyerName[0]?.toUpperCase() ?? "?"}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-ink truncate">
                      {cart.buyerName}
                    </p>
                    <p className="text-xs text-ink-muted truncate">
                      {cart.items.length} libro
                      {cart.items.length !== 1 ? "s" : ""} · $
                      {cart.total.toLocaleString("es-CL")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-full border whitespace-nowrap ${
                      isAbandoned
                        ? "bg-amber-100 text-amber-800 border-amber-300 font-semibold"
                        : "bg-cream-warm text-ink-muted border-cream-dark/30"
                    }`}
                  >
                    {cart.daysInCart === 0
                      ? "hoy"
                      : cart.daysInCart === 1
                        ? "hace 1 día"
                        : `hace ${cart.daysInCart} días`}
                  </span>
                  <svg
                    className={`w-4 h-4 text-ink-muted transition-transform ${
                      isOpen ? "rotate-180" : ""
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </button>

              {isOpen && (
                <div className="border-t border-cream-dark/20 px-5 py-4 bg-cream-warm/20 space-y-4">
                  <ul className="space-y-2">
                    {cart.items.map((item) => (
                      <li
                        key={item.listing_id}
                        className="flex items-center gap-3 text-sm"
                      >
                        {item.cover_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.cover_url}
                            alt={item.title}
                            className="w-8 h-11 object-cover rounded shrink-0"
                          />
                        ) : (
                          <div className="w-8 h-11 bg-cream-dark/20 rounded shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-ink truncate">
                            {item.title}
                          </p>
                          <p className="text-xs text-ink-muted truncate">
                            {item.author}
                          </p>
                        </div>
                        <p className="text-sm font-semibold text-ink whitespace-nowrap">
                          ${item.price.toLocaleString("es-CL")}
                        </p>
                      </li>
                    ))}
                  </ul>

                  <div className="flex flex-wrap gap-2 pt-2 border-t border-cream-dark/20">
                    {cart.buyerPhone &&
                      (() => {
                        const link = waLink(cart.buyerPhone, cart.buyerName, cart.items);
                        return link ? (
                          <a
                            href={link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 bg-[#25D366] hover:bg-[#1da851] text-white font-medium text-sm px-4 py-2 rounded-lg transition-colors"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                            </svg>
                            WhatsApp
                          </a>
                        ) : null;
                      })()}
                    <Link
                      href={`/mensajes?to=${cart.buyerId}`}
                      className="inline-flex items-center gap-1.5 bg-brand-500 hover:bg-brand-600 text-white font-medium text-sm px-4 py-2 rounded-lg transition-colors"
                    >
                      Mensaje interno
                    </Link>
                    {cart.buyerEmail && (
                      <a
                        href={`mailto:${cart.buyerEmail}?subject=${encodeURIComponent("Tus libros en carrito — tuslibros.cl")}`}
                        className="inline-flex items-center gap-1.5 border border-cream-dark/40 text-ink-muted hover:text-ink hover:bg-cream-warm/40 font-medium text-sm px-4 py-2 rounded-lg transition-colors"
                      >
                        Email
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
