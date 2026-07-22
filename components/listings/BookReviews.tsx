"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export interface BookReview {
  id: string;
  rating: number | null;
  title: string | null;
  body: string;
  is_editorial: boolean;
  author_label: string | null;
  created_at: string;
  reviewer: { id: string; full_name: string | null } | null;
}

interface Props {
  bookId: string;
  bookTitle: string;
  initialReviews: BookReview[];
}

function Stars({ value, size = "text-base" }: { value: number; size?: string }) {
  return (
    <span className={`${size} tracking-tight text-brand-500`} aria-label={`${value} de 5 estrellas`}>
      {"★★★★★".slice(0, value)}
      <span className="text-ink/20">{"★★★★★".slice(value)}</span>
    </span>
  );
}

/** Selector de estrellas para el formulario. */
function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1" role="radiogroup" aria-label="Tu nota">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          className={`text-2xl leading-none transition-transform hover:scale-110 ${
            (hover || value) >= n ? "text-brand-500" : "text-ink/20"
          }`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export default function BookReviews({ bookId, bookTitle, initialReviews }: Props) {
  const [reviews, setReviews] = useState<BookReview[]>(initialReviews);
  const [userId, setUserId] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  const editorial = reviews.find((r) => r.is_editorial);
  const userReviews = reviews.filter((r) => !r.is_editorial);
  const rated = reviews.filter((r) => r.rating != null);
  const count = rated.length;
  const avg = count ? rated.reduce((s, r) => s + (r.rating ?? 0), 0) / count : 0;

  // Si el usuario ya reseñó, precargamos su reseña en el formulario (edición).
  const myReview = userId ? userReviews.find((r) => r.reviewer?.id === userId) : undefined;
  useEffect(() => {
    if (myReview) {
      setRating(myReview.rating ?? 0);
      setTitle(myReview.title ?? "");
      setBody(myReview.body);
    }
  }, [myReview?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function reload() {
    const res = await fetch(`/api/book-reviews?bookId=${bookId}`);
    const data = await res.json();
    setReviews(data.reviews ?? []);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!rating || !body.trim()) {
      setError("Pon una nota y escribe tu reseña.");
      return;
    }
    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/book-reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookId, rating, title: title.trim(), body: body.trim() }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "No pudimos guardar tu reseña.");
    } else {
      setSaved(true);
      await reload();
    }
    setSubmitting(false);
  }

  return (
    <section className="mt-12 border-t border-ink/10 pt-10">
      <div className="flex items-end justify-between mb-6">
        <h2 className="font-display text-2xl font-bold text-ink">Reseñas del libro</h2>
        {count > 0 && (
          <div className="flex items-center gap-2 text-sm text-ink/60">
            <Stars value={Math.round(avg)} />
            <span className="font-semibold text-ink">{avg.toFixed(1)}</span>
            <span>· {count} {count === 1 ? "reseña" : "reseñas"}</span>
          </div>
        )}
      </div>

      {/* Reseña editorial destacada */}
      {editorial && (
        <article className="mb-8 rounded-2xl bg-brand-50 border border-brand-100 p-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-brand-700 bg-brand-100 rounded-full px-2.5 py-0.5">
              Reseña de la casa
            </span>
            {editorial.rating != null && <Stars value={editorial.rating} size="text-sm" />}
          </div>
          {editorial.title && (
            <h3 className="font-display text-lg font-bold text-ink mb-1">{editorial.title}</h3>
          )}
          <p className="text-ink/80 leading-relaxed whitespace-pre-line">{editorial.body}</p>
          <p className="mt-3 text-sm font-medium text-ink/60">
            — {editorial.author_label || "Equipo tuslibros"}
          </p>
        </article>
      )}

      {/* Reseñas de usuarios */}
      {userReviews.length > 0 && (
        <div className="space-y-5 mb-8">
          {userReviews.map((r) => (
            <article key={r.id} className="rounded-xl bg-white border border-ink/10 p-5">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="font-semibold text-ink">
                  {r.reviewer?.full_name?.split(" ")[0] ?? "Lector"}
                </span>
                {r.rating != null && <Stars value={r.rating} size="text-sm" />}
              </div>
              {r.title && <h3 className="font-medium text-ink mb-1">{r.title}</h3>}
              <p className="text-ink/75 leading-relaxed whitespace-pre-line">{r.body}</p>
              <p className="mt-2 text-xs text-ink/40">
                {new Date(r.created_at).toLocaleDateString("es-CL")}
              </p>
            </article>
          ))}
        </div>
      )}

      {/* Estado vacío */}
      {!editorial && userReviews.length === 0 && (
        <p className="text-ink/50 italic mb-8">
          Sé el primero en reseñar esta obra.
        </p>
      )}

      {/* Formulario / CTA */}
      {userId ? (
        saved ? (
          <p className="rounded-xl bg-green-50 text-green-700 px-4 py-3 text-sm">
            ¡Gracias! Tu reseña de <strong>{bookTitle}</strong> ya está publicada.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="rounded-2xl border border-ink/10 bg-cream/50 p-6">
            <h3 className="font-display text-lg font-bold text-ink mb-4">
              {myReview ? "Edita tu reseña" : "Escribe tu reseña"}
            </h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-ink/70 mb-1.5">Tu nota</label>
              <StarPicker value={rating} onChange={setRating} />
            </div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título (opcional)"
              maxLength={120}
              className="w-full mb-3 px-4 py-2.5 border border-ink/15 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="¿Qué te pareció esta obra? Cuéntale a otros lectores."
              maxLength={2000}
              rows={4}
              className="w-full mb-3 px-4 py-2.5 border border-ink/15 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 resize-y"
            />
            {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              {submitting ? "Guardando..." : myReview ? "Actualizar reseña" : "Publicar reseña"}
            </button>
          </form>
        )
      ) : (
        <p className="text-sm text-ink/60">
          <a href="/login" className="text-brand-600 font-semibold hover:underline">
            Inicia sesión
          </a>{" "}
          para reseñar esta obra.
        </p>
      )}
    </section>
  );
}
