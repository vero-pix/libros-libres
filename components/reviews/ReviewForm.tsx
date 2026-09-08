"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Formulario de reseña del vendedor, para /resena/[orderId].
 *
 * No consulta nada al montarse: la página ya resolvió la orden en el servidor y
 * le pasa el listing. El comprador llega del correo y lo único que le queda es
 * marcar estrellas y apretar enviar.
 */

const COMENTARIO_MAX = 300;

export default function ReviewForm({
  listingId,
  vendedorNombre,
}: {
  listingId: string;
  vendedorNombre: string;
}) {
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [listo, setListo] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) {
      setError("Marca de 1 a 5 estrellas.");
      return;
    }
    setEnviando(true);
    setError(null);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listing_id: listingId, rating, comment }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "No se pudo guardar la reseña.");
        return;
      }
      setListo(true);
      router.refresh();
    } catch {
      setError("No se pudo guardar la reseña. Revisa tu conexión.");
    } finally {
      setEnviando(false);
    }
  }

  if (listo) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-5">
        <p className="font-semibold text-green-900">Listo, gracias.</p>
        <p className="mt-1 text-sm text-green-800">
          Tu reseña ya aparece en la tienda de {vendedorNombre}.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={enviar} className="space-y-4">
      <div>
        <p className="mb-2 text-sm font-medium text-ink">¿Cómo te fue con {vendedorNombre}?</p>
        <div className="flex gap-1" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              onMouseEnter={() => setHover(n)}
              aria-label={`${n} ${n === 1 ? "estrella" : "estrellas"}`}
              className="text-3xl leading-none transition-transform hover:scale-110"
            >
              <span className={(hover || rating) >= n ? "text-amber-400" : "text-gray-300"}>★</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          maxLength={COMENTARIO_MAX}
          placeholder="Cuenta cómo te fue (opcional)"
          className="w-full resize-none rounded-lg border border-cream-dark px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
        />
        <p className="mt-1 text-right text-[11px] text-ink-muted">
          {comment.length}/{COMENTARIO_MAX}
        </p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={enviando}
        className="w-full rounded-lg bg-ink px-4 py-3 font-semibold text-cream transition-colors hover:bg-ink/90 disabled:opacity-50 sm:w-auto sm:px-8"
      >
        {enviando ? "Enviando…" : "Enviar reseña"}
      </button>
    </form>
  );
}
