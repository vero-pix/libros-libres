"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  reviewer: { id: string; full_name: string | null } | null;
}

function Stars({ rating, interactive, onChange }: { rating: number; interactive?: boolean; onChange?: (r: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onClick={() => onChange?.(star)}
          onMouseEnter={() => interactive && setHover(star)}
          onMouseLeave={() => interactive && setHover(0)}
          className={`text-lg ${interactive ? "cursor-pointer" : "cursor-default"}`}
        >
          <svg
            className={`w-5 h-5 ${(hover || rating) >= star ? "text-yellow-400 fill-yellow-400" : "text-gray-300 fill-gray-300"}`}
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </button>
      ))}
    </div>
  );
}

interface Props {
  listingId: string;
}

export default function ReviewSection({ listingId }: Props) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [canReview, setCanReview] = useState(false);
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);

  // Form state
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id ?? null);

      const res = await fetch(`/api/reviews?listing_id=${listingId}`);
      const data = await res.json();
      const fetchedReviews: Review[] = data.reviews ?? [];
      setReviews(fetchedReviews);

      if (user) {
        const hasReview = fetchedReviews.some((r) => r.reviewer?.id === user.id);
        setAlreadyReviewed(hasReview);

        if (!hasReview) {
          // Check if user bought/rented
          const { data: order } = await supabase
            .from("orders")
            .select("id")
            .eq("listing_id", listingId)
            .eq("buyer_id", user.id)
            .eq("status", "paid")
            .limit(1)
            .maybeSingle();

          const { data: rental } = await supabase
            .from("rentals")
            .select("id")
            .eq("listing_id", listingId)
            .eq("renter_id", user.id)
            .eq("status", "paid")
            .limit(1)
            .maybeSingle();

          setCanReview(!!(order || rental));
        }
      }

      setLoading(false);
    }
    load();
  }, [listingId]);

  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) { setFormError("Selecciona una calificación"); return; }
    setSubmitting(true);
    setFormError(null);

    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listing_id: listingId, rating, comment: comment.trim() || null }),
    });
    const data = await res.json();

    if (!res.ok) {
      setFormError(data.error);
      setSubmitting(false);
      return;
    }

    setFormSuccess(true);
    setSubmitting(false);
    // Reload reviews
    const res2 = await fetch(`/api/reviews?listing_id=${listingId}`);
    const data2 = await res2.json();
    setReviews(data2.reviews ?? []);
    setAlreadyReviewed(true);
    setCanReview(false);
  }

  if (loading) {
    return <div className="px-6 py-4 text-sm text-gray-400">Cargando reseñas...</div>;
  }

  return (
    <div className="border-t border-gray-100 px-5 sm:px-6 py-5">
      <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
        Reseñas
        {reviews.length > 0 && (
          <span className="text-sm font-normal text-gray-500">
            {avgRating.toFixed(1)} / 5 ({reviews.length})
          </span>
        )}
      </h3>

      {/* Average */}
      {reviews.length > 0 && (
        <div className="flex items-center gap-2 mb-4">
          <Stars rating={Math.round(avgRating)} />
          <span className="text-sm text-gray-500">{avgRating.toFixed(1)}</span>
        </div>
      )}

      {/* Form */}
      {canReview && !formSuccess && (
        <form onSubmit={handleSubmit} className="bg-gray-50 rounded-xl p-4 mb-4 space-y-3">
          <p className="text-sm font-medium text-gray-700">Deja tu reseña</p>
          <Stars rating={rating} interactive onChange={setRating} />
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={2}
            maxLength={500}
            placeholder="Comentario (opcional)"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none"
          />
          {formError && <p className="text-xs text-red-600">{formError}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            {submitting ? "Enviando..." : "Enviar reseña"}
          </button>
        </form>
      )}

      {formSuccess && (
        <p className="text-sm text-green-600 bg-green-50 rounded-lg px-3 py-2 mb-4">Gracias por tu reseña.</p>
      )}

      {alreadyReviewed && !formSuccess && (
        <p className="text-xs text-gray-400 mb-4">Ya dejaste una reseña para este libro.</p>
      )}

      {/* List */}
      {reviews.length === 0 ? (
        <p className="text-sm text-gray-400 italic">Aún no hay reseñas.</p>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <div key={r.id} className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Stars rating={r.rating} />
                <span className="text-xs text-gray-400">
                  {new Date(r.created_at).toLocaleDateString("es-CL")}
                </span>
              </div>
              <p className="text-xs font-medium text-gray-600">
                {r.reviewer?.full_name?.split(" ")[0] ?? "Usuario"}
              </p>
              {r.comment && (
                <p className="text-sm text-gray-600 mt-1">{r.comment}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
