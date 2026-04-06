"use client";

import { useState } from "react";

interface Props {
  listingId: string;
}

export default function AddToCartButton({ listingId }: Props) {
  const [status, setStatus] = useState<"idle" | "loading" | "added">("idle");

  async function handleAdd() {
    setStatus("loading");
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listing_id: listingId }),
      });
      if (res.ok) {
        setStatus("added");
        setTimeout(() => setStatus("idle"), 2000);
      } else {
        const data = await res.json();
        if (data.error?.includes("No autenticado")) {
          window.location.href = `/login?next=/listings/${listingId}`;
          return;
        }
        setStatus("idle");
      }
    } catch {
      setStatus("idle");
    }
  }

  return (
    <button
      type="button"
      onClick={handleAdd}
      disabled={status === "loading"}
      className="flex items-center justify-center gap-2 w-full border-2 border-brand-500 text-brand-600 hover:bg-brand-50 font-semibold py-3 rounded-xl transition-colors disabled:opacity-50"
    >
      {status === "added" ? (
        <>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
          Agregado al carrito
        </>
      ) : (
        <>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
          </svg>
          {status === "loading" ? "Agregando..." : "Agregar al carrito"}
        </>
      )}
    </button>
  );
}
