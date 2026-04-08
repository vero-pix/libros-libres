"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  sellerId: string;
  listingId: string;
  sellerName: string;
}

export default function ContactSellerButton({ sellerId, listingId, sellerName }: Props) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleClick() {
    setLoading(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipient_id: sellerId,
          listing_id: listingId,
          body: `Hola ${sellerName}, me interesa este libro.`,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        router.push(`/mensajes/${data.conversation_id}`);
      } else if (res.status === 401) {
        router.push(`/login?next=/listings/${listingId}`);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="w-full flex items-center justify-center gap-2 bg-ink hover:bg-ink/90 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors"
    >
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
      </svg>
      {loading ? "Abriendo chat..." : "Enviar mensaje"}
    </button>
  );
}
