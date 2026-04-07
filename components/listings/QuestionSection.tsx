"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface Question {
  id: string;
  question: string;
  answer: string | null;
  answered_at: string | null;
  created_at: string;
  asker: { id: string; full_name: string | null } | null;
}

interface Props {
  listingId: string;
  sellerId: string;
}

export default function QuestionSection({ listingId, sellerId }: Props) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [newQuestion, setNewQuestion] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [answeringId, setAnsweringId] = useState<string | null>(null);
  const [answerText, setAnswerText] = useState("");
  const [answerSubmitting, setAnswerSubmitting] = useState(false);

  const isSeller = userId === sellerId;

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id ?? null);

      const res = await fetch(`/api/questions?listing_id=${listingId}`);
      const data = await res.json();
      setQuestions(data.questions ?? []);
      setLoading(false);
    }
    load();
  }, [listingId]);

  async function handleAsk(e: React.FormEvent) {
    e.preventDefault();
    if (!newQuestion.trim()) return;
    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listing_id: listingId, question: newQuestion.trim() }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error);
    } else {
      setSuccess(true);
      setNewQuestion("");
      // Reload questions
      const res2 = await fetch(`/api/questions?listing_id=${listingId}`);
      const data2 = await res2.json();
      setQuestions(data2.questions ?? []);
    }
    setSubmitting(false);
  }

  async function handleAnswer(questionId: string) {
    if (!answerText.trim()) return;
    setAnswerSubmitting(true);

    const res = await fetch("/api/questions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question_id: questionId, answer: answerText.trim() }),
    });

    if (res.ok) {
      setAnsweringId(null);
      setAnswerText("");
      const res2 = await fetch(`/api/questions?listing_id=${listingId}`);
      const data2 = await res2.json();
      setQuestions(data2.questions ?? []);
    }
    setAnswerSubmitting(false);
  }

  if (loading) {
    return <div className="px-6 py-4 text-sm text-gray-400">Cargando preguntas...</div>;
  }

  return (
    <div className="border-t border-gray-100 px-5 sm:px-6 py-5">
      <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
        Preguntas
        {questions.length > 0 && (
          <span className="text-sm font-normal text-gray-400">({questions.length})</span>
        )}
      </h3>

      {/* Ask form */}
      {userId && !isSeller && !success && (
        <form onSubmit={handleAsk} className="mb-5">
          <div className="flex gap-2">
            <input
              type="text"
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              placeholder="Escribe tu pregunta al vendedor..."
              maxLength={500}
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
            <button
              type="submit"
              disabled={submitting || !newQuestion.trim()}
              className="px-5 py-2.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors whitespace-nowrap"
            >
              {submitting ? "..." : "Preguntar"}
            </button>
          </div>
          {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
        </form>
      )}

      {success && (
        <p className="text-sm text-green-600 bg-green-50 rounded-lg px-3 py-2 mb-4">
          Pregunta enviada. El vendedor recibirá una notificación.
        </p>
      )}

      {!userId && (
        <p className="text-sm text-gray-400 mb-4">
          <a href="/login" className="text-brand-600 hover:underline">Inicia sesión</a> para hacer una pregunta.
        </p>
      )}

      {/* Questions list */}
      {questions.length === 0 ? (
        <p className="text-sm text-gray-400 italic">Aún no hay preguntas. ¡Sé el primero!</p>
      ) : (
        <div className="space-y-4">
          {questions.map((q) => (
            <div key={q.id} className="bg-gray-50 rounded-xl p-4">
              {/* Question */}
              <div className="flex items-start gap-2">
                <svg className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                </svg>
                <div className="flex-1">
                  <p className="text-sm text-gray-800">{q.question}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {q.asker?.full_name?.split(" ")[0] ?? "Usuario"} · {new Date(q.created_at).toLocaleDateString("es-CL")}
                  </p>
                </div>
              </div>

              {/* Answer */}
              {q.answer ? (
                <div className="flex items-start gap-2 mt-3 pl-6">
                  <svg className="w-4 h-4 text-brand-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                  </svg>
                  <div>
                    <p className="text-sm text-gray-700">{q.answer}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Vendedor · {q.answered_at ? new Date(q.answered_at).toLocaleDateString("es-CL") : ""}
                    </p>
                  </div>
                </div>
              ) : isSeller ? (
                /* Seller can answer */
                answeringId === q.id ? (
                  <div className="mt-3 pl-6 flex gap-2">
                    <input
                      type="text"
                      value={answerText}
                      onChange={(e) => setAnswerText(e.target.value)}
                      placeholder="Escribe tu respuesta..."
                      maxLength={500}
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                    />
                    <button
                      onClick={() => handleAnswer(q.id)}
                      disabled={answerSubmitting || !answerText.trim()}
                      className="px-4 py-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors"
                    >
                      {answerSubmitting ? "..." : "Responder"}
                    </button>
                    <button
                      onClick={() => { setAnsweringId(null); setAnswerText(""); }}
                      className="px-3 py-2 text-xs text-gray-500 hover:text-gray-700"
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setAnsweringId(q.id)}
                    className="mt-2 ml-6 text-xs text-brand-600 hover:underline font-medium"
                  >
                    Responder esta pregunta
                  </button>
                )
              ) : (
                <p className="text-xs text-gray-400 italic mt-2 pl-6">Esperando respuesta del vendedor...</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
